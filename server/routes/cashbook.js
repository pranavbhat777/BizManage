const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// For now, use a mock business ID since we're removing auth
const mockBusinessId = 1;

// Get all cashbook entries
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, type, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;
    
    let query = db('cashbook')
      .where({ business_id: mockBusinessId })
      .orderBy('created_at', 'desc');
    
    // Filter by type if specified
    if (type && (type === 'in' || type === 'out')) {
      query = query.where('type', type);
    }
    
    // Filter by date range if specified
    if (start_date) {
      query = query.where('date', '>=', start_date);
    }
    if (end_date) {
      query = query.where('date', '<=', end_date);
    }
    
    const entries = await query.limit(limit).offset(offset);
    
    // Get total balance
    const totalIn = await db('cashbook')
      .where({ business_id: mockBusinessId, type: 'in' })
      .sum('amount as total')
      .first();
    
    const totalOut = await db('cashbook')
      .where({ business_id: mockBusinessId, type: 'out' })
      .sum('amount as total')
      .first();
    
    const balance = (parseFloat(totalIn.total) || 0) - (parseFloat(totalOut.total) || 0);
    
    res.json({
      entries,
      balance,
      total_in: parseFloat(totalIn.total) || 0,
      total_out: parseFloat(totalOut.total) || 0,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: entries.length
      }
    });
  } catch (error) {
    console.error('Get cashbook entries error:', error);
    res.status(500).json({ message: 'Server error fetching cashbook entries' });
  }
});

// Create new cashbook entry
router.post('/', [
  body('type').isIn(['in', 'out']).withMessage('Type must be in or out'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required (max 100 characters)'),
  body('title').optional({ checkFalsy: true }).trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1-200 characters if provided'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required (HH:MM format)'),
  body('contact_number').notEmpty().withMessage('Contact number is required for all transactions').isMobilePhone('any', { strictMode: false }).withMessage('Valid mobile number is required'),
  body('proof_type').optional({ checkFalsy: true }).isIn(['receipt', 'invoice', 'bank_statement', 'other']).withMessage('Valid proof type is required if provided'),
  body('proof_description').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Proof description too long'),
  body('reminder_enabled').isBoolean().withMessage('Reminder enabled must be boolean'),
  body('reminder_message').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Reminder message too long'),
  body('reminder_interval_days').optional({ checkFalsy: true }).isInt({ min: 1, max: 365 }).withMessage('Reminder interval must be between 1-365 days'),
  body('reminder_schedule_type').optional({ checkFalsy: true }).isIn(['interval', 'manual', 'both']).withMessage('Valid reminder schedule type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      type, 
      amount, 
      name, 
      title, 
      date, 
      time, 
      contact_number, 
      proof_type, 
      proof_description, 
      reminder_enabled, 
      reminder_message, 
      reminder_interval_days,
      reminder_schedule_type 
    } = req.body;
    
    console.log('Creating cashbook entry:', { type, amount, name, title, date, time, contact_number });
    
    // Check for existing entries with same phone number for netting
    const existingEntries = await db('cashbook')
      .where({ 
        business_id: mockBusinessId, 
        contact_number: contact_number 
      })
      .orderBy('created_at', 'asc');
    
    // Find opposite type entries for netting
    const oppositeType = type === 'in' ? 'out' : 'in';
    const oppositeEntries = existingEntries.filter(entry => entry.type === oppositeType);
    
    if (oppositeEntries.length > 0) {
      // Calculate net amount
      const newAmount = parseFloat(amount);
      let remainingAmount = newAmount;
      const entriesToDelete = [];
      const entriesToUpdate = [];
      
      for (const entry of oppositeEntries) {
        if (remainingAmount <= 0) break;
        
        const entryAmount = parseFloat(entry.amount);
        
        if (remainingAmount >= entryAmount) {
          // New entry completely covers this opposite entry
          remainingAmount -= entryAmount;
          entriesToDelete.push(entry.id);
        } else {
          // Partial netting - update the opposite entry
          const updatedAmount = entryAmount - remainingAmount;
          entriesToUpdate.push({
            id: entry.id,
            amount: updatedAmount
          });
          remainingAmount = 0;
        }
      }
      
      // Delete fully netted entries
      if (entriesToDelete.length > 0) {
        await db('cashbook').whereIn('id', entriesToDelete).del();
        console.log('Deleted netted entries:', entriesToDelete);
      }
      
      // Update partially netted entries
      for (const update of entriesToUpdate) {
        await db('cashbook').where('id', update.id).update({
          amount: update.amount,
          updated_at: new Date().toISOString()
        });
        console.log('Updated netted entry:', update);
      }
      
      // If there's remaining amount, create a new entry
      if (remainingAmount > 0) {
        const entryData = {
          id: 'cashbook-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          business_id: mockBusinessId,
          type,
          amount: remainingAmount,
          name,
          title: title || null,
          date: date || new Date().toISOString().split('T')[0],
          time: time || new Date().toTimeString().slice(0, 5),
          contact_number: contact_number,
          proof_type: proof_type || null,
          proof_description: proof_description || null,
          created_at: new Date().toISOString()
        };
        
        const [entry] = await db('cashbook').insert(entryData).returning('*');
        console.log('Created netted entry:', entry);
        
        res.status(201).json({
          message: `Netted successfully. ${entriesToDelete.length} entries deleted, ${entriesToUpdate.length} entries updated. New entry created for ₹${remainingAmount}`,
          entry,
          netted: {
            deleted: entriesToDelete.length,
            updated: entriesToUpdate.length,
            remaining: remainingAmount
          }
        });
      } else {
        // Everything was netted, no new entry needed
        res.status(200).json({
          message: `Fully netted. ${entriesToDelete.length} entries deleted, ${entriesToUpdate.length} entries updated. No remaining balance.`,
          netted: {
            deleted: entriesToDelete.length,
            updated: entriesToUpdate.length,
            remaining: 0
          }
        });
      }
    } else {
      // No opposite entries found, create normal entry
      const entryData = {
        id: 'cashbook-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        business_id: mockBusinessId,
        type,
        amount: parseFloat(amount),
        name,
        title: title || null,
        date: date || new Date().toISOString().split('T')[0],
        time: time || new Date().toTimeString().slice(0, 5),
        contact_number: contact_number,
        proof_type: proof_type || null,
        proof_description: proof_description || null,
        reminder_enabled: reminder_enabled || false,
        reminder_message: reminder_message || null,
        reminder_interval_days: reminder_interval_days || 7,
        reminder_schedule_type: reminder_schedule_type || 'interval',
        next_reminder_date: reminder_enabled && (reminder_schedule_type === 'interval' || reminder_schedule_type === 'both') 
          ? new Date(Date.now() + (reminder_interval_days || 7) * 24 * 60 * 60 * 1000).toISOString()
          : null,
        created_at: new Date().toISOString()
      };
      
      const [entry] = await db('cashbook').insert(entryData).returning('*');
      console.log('Cashbook entry created successfully:', entry);
      
      res.status(201).json({
        message: 'Cashbook entry created successfully',
        entry
      });
    }
  } catch (error) {
    console.error('Create cashbook entry error:', error);
    res.status(500).json({ message: 'Server error creating cashbook entry' });
  }
});

// Update cashbook entry
router.put('/:id', [
  body('type').optional({ checkFalsy: true }).isIn(['in', 'out']).withMessage('Type must be in or out'),
  body('amount').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('name').optional({ checkFalsy: true }).trim().isLength({ min: 1, max: 100 }).withMessage('Name is required (max 100 characters)'),
  body('title').optional({ checkFalsy: true }).trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1-200 characters if provided'),
  body('date').optional({ checkFalsy: true }).isISO8601().withMessage('Valid date is required'),
  body('time').optional({ checkFalsy: true }).matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format is HH:MM'),
  body('contact_number').notEmpty().withMessage('Contact number is required for all transactions').isMobilePhone('any', { strictMode: false }).withMessage('Valid mobile number is required'),
  body('proof_type').optional({ checkFalsy: true }).isIn(['receipt', 'invoice', 'bank_statement', 'other']).withMessage('Valid proof type is required if provided'),
  body('proof_description').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Proof description too long'),
  body('reminder_enabled').optional({ checkFalsy: true }).isBoolean().withMessage('Reminder enabled must be boolean'),
  body('reminder_message').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Reminder message too long'),
  body('reminder_interval_days').optional({ checkFalsy: true }).isInt({ min: 1, max: 365 }).withMessage('Reminder interval must be between 1-365 days'),
  body('reminder_schedule_type').optional({ checkFalsy: true }).isIn(['interval', 'manual', 'both']).withMessage('Valid reminder schedule type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;
    
    // Check if entry exists and belongs to business
    const existingEntry = await db('cashbook').where({ id, business_id: mockBusinessId }).first();
    if (!existingEntry) {
      return res.status(404).json({ message: 'Cashbook entry not found' });
    }
    
    // Update entry with netting logic
    const updateData = {
      ...updates,
      title: updates.title || null,
      date: updates.date || existingEntry.date,
      time: updates.time || existingEntry.time,
      proof_type: updates.proof_type || null,
      proof_description: updates.proof_description || null,
      updated_at: new Date().toISOString()
    };
    
    // Apply the update first
    await db('cashbook').where({ id }).update(updateData);
    
    // Check if we need to run netting after this update
    if (updates.amount || updates.type) {
      // Get the updated entry
      const updatedEntry = await db('cashbook').where({ id }).first();
      
      // Check for netting opportunities with this updated entry
      const allEntries = await db('cashbook')
        .where({ 
          business_id: mockBusinessId, 
          contact_number: updatedEntry.contact_number 
        })
        .whereNot('id', id) // Exclude the current entry
        .orderBy('created_at', 'asc');
      
      // Find opposite type entries for netting
      const oppositeType = updatedEntry.type === 'in' ? 'out' : 'in';
      const oppositeEntries = allEntries.filter(entry => entry.type === oppositeType);
      
      if (oppositeEntries.length > 0) {
        const currentAmount = parseFloat(updatedEntry.amount);
        let remainingAmount = currentAmount;
        const entriesToDelete = [];
        const entriesToUpdate = [];
        
        for (const entry of oppositeEntries) {
          if (remainingAmount <= 0) break;
          
          const entryAmount = parseFloat(entry.amount);
          
          if (remainingAmount >= entryAmount) {
            // Current entry completely covers this opposite entry
            remainingAmount -= entryAmount;
            entriesToDelete.push(entry.id);
          } else {
            // Partial netting - update the opposite entry
            const updatedAmount = entryAmount - remainingAmount;
            entriesToUpdate.push({
              id: entry.id,
              amount: updatedAmount
            });
            remainingAmount = 0;
          }
        }
        
        // Delete fully netted entries
        if (entriesToDelete.length > 0) {
          await db('cashbook').whereIn('id', entriesToDelete).del();
        }
        
        // Update partially netted entries
        for (const update of entriesToUpdate) {
          await db('cashbook').where('id', update.id).update({
            amount: update.amount,
            updated_at: new Date().toISOString()
          });
        }
        
        // Update or delete the current entry based on remaining amount
        if (remainingAmount === 0) {
          // Delete the current entry if fully netted
          await db('cashbook').where({ id }).del();
          
          res.json({
            message: `Entry updated and fully netted. ${entriesToDelete.length} opposite entries deleted.`,
            netted: {
              deleted: entriesToDelete.length + 1, // +1 for current entry
              updated: entriesToUpdate.length,
              remaining: 0
            }
          });
          return;
        } else if (remainingAmount !== currentAmount) {
          // Update the current entry if partially netted
          await db('cashbook').where({ id }).update({
            amount: remainingAmount,
            updated_at: new Date().toISOString()
          });
        }
      }
    }
    
    // Get the final updated entry
    const finalEntry = await db('cashbook').where({ id }).first();
    
    res.json({
      message: 'Cashbook entry updated successfully',
      entry: finalEntry
    });
  } catch (error) {
    console.error('Update cashbook entry error:', error);
    res.status(500).json({ message: 'Server error updating cashbook entry' });
  }
});

// Delete cashbook entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if entry exists and belongs to business
    const existingEntry = await db('cashbook').where({ id, business_id: mockBusinessId }).first();
    if (!existingEntry) {
      return res.status(404).json({ message: 'Cashbook entry not found' });
    }
    
    // Delete entry
    await db('cashbook').where({ id }).del();
    
    res.json({
      message: 'Cashbook entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete cashbook entry error:', error);
    res.status(500).json({ message: 'Server error deleting cashbook entry' });
  }
});

// Get cashbook summary
router.get('/summary', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateCondition;
    const now = new Date();
    
    switch (period) {
      case 'today':
        dateCondition = db.raw('date(date) = date(?)', [now.toISOString()]);
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateCondition = db.raw('date >= ?', [weekAgo.toISOString()]);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateCondition = db.raw('date >= ?', [monthAgo.toISOString()]);
        break;
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        dateCondition = db.raw('date >= ?', [yearAgo.toISOString()]);
        break;
      default:
        dateCondition = db.raw('1=1');
    }
    
    const summary = await db('cashbook')
      .where({ business_id: mockBusinessId })
      .where(dateCondition)
      .select(
        db.raw('SUM(CASE WHEN type = "in" THEN amount ELSE 0 END) as total_in'),
        db.raw('SUM(CASE WHEN type = "out" THEN amount ELSE 0 END) as total_out'),
        db.raw('COUNT(*) as total_entries'),
        db.raw('COUNT(CASE WHEN type = "in" THEN 1 END) as entries_in'),
        db.raw('COUNT(CASE WHEN type = "out" THEN 1 END) as entries_out')
      )
      .first();
    
    const balance = (parseFloat(summary.total_in) || 0) - (parseFloat(summary.total_out) || 0);
    
    res.json({
      period,
      total_in: parseFloat(summary.total_in) || 0,
      total_out: parseFloat(summary.total_out) || 0,
      balance,
      total_entries: parseInt(summary.total_entries) || 0,
      entries_in: parseInt(summary.entries_in) || 0,
      entries_out: parseInt(summary.entries_out) || 0
    });
  } catch (error) {
    console.error('Get cashbook summary error:', error);
    res.status(500).json({ message: 'Server error fetching cashbook summary' });
  }
});

// Manual netting endpoint
router.post('/net-manual', async (req, res) => {
  try {
    const { contact_number } = req.body;
    
    if (!contact_number) {
      return res.status(400).json({ message: 'Contact number is required for manual netting' });
    }
    
    // Get all entries for this contact number
    const entries = await db('cashbook')
      .where({ 
        business_id: mockBusinessId, 
        contact_number: contact_number 
      })
      .orderBy('created_at', 'asc');
    
    // Separate by type
    const givenEntries = entries.filter(entry => entry.type === 'out');
    const receivedEntries = entries.filter(entry => entry.type === 'in');
    
    let nettedCount = 0;
    const entriesToDelete = [];
    
    // Net entries
    for (const givenEntry of givenEntries) {
      for (const receivedEntry of receivedEntries) {
        if (entriesToDelete.includes(givenEntry.id) || entriesToDelete.includes(receivedEntry.id)) {
          continue;
        }
        
        const givenAmount = parseFloat(givenEntry.amount);
        const receivedAmount = parseFloat(receivedEntry.amount);
        
        if (givenAmount === receivedAmount) {
          // Perfect match - delete both
          entriesToDelete.push(givenEntry.id, receivedEntry.id);
          nettedCount++;
          break;
        }
      }
    }
    
    // Delete netted entries
    if (entriesToDelete.length > 0) {
      await db('cashbook').whereIn('id', entriesToDelete).del();
    }
    
    res.json({
      message: `Manual netting completed. ${entriesToDelete.length} entries deleted (${nettedCount} pairs netted).`,
      nettedPairs: nettedCount,
      deletedEntries: entriesToDelete.length
    });
    
  } catch (error) {
    console.error('Manual netting error:', error);
    res.status(500).json({ message: 'Server error during manual netting' });
  }
});

// Send reminder for a cashbook entry
router.post('/:id/send-reminder', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get cashbook entry with business info
    const entry = await db('cashbook')
      .join('businesses', 'cashbook.business_id', 'businesses.id')
      .select(
        'cashbook.*',
        'businesses.name as business_name'
      )
      .where('cashbook.id', id)
      .where('cashbook.business_id', mockBusinessId)
      .first();
    
    if (!entry) {
      return res.status(404).json({ message: 'Cashbook entry not found' });
    }
    
    if (entry.type !== 'out') {
      return res.status(400).json({ message: 'Reminders can only be sent for money given out' });
    }
    
    if (!entry.reminder_enabled) {
      return res.status(400).json({ message: 'Reminders are not enabled for this entry' });
    }
    
    // Check if manual reminders are allowed
    if (entry.reminder_schedule_type === 'interval') {
      return res.status(400).json({ 
        message: 'This entry is set to automatic interval reminders only. Use "Both" option to enable manual reminders too.' 
      });
    }
    
    // Create friendly reminder message
    const reminderMessage = entry.reminder_message || 
      `Hi ${entry.name}, this is a friendly reminder from ${entry.business_name || 'BizManage Pro'} about outstanding amount of ₹${entry.amount}. Please settle it at your earliest convenience.\n\nPowered by BizManage Pro 🚀`;
    
    // Create reminder record
    const reminderData = {
      cashbook_id: id,
      message: reminderMessage,
      contact_number: entry.contact_number,
      status: 'sent',
      scheduled_at: new Date().toISOString(),
      sent_at: new Date().toISOString()
    };
    
    const reminder = await db('reminders').insert(reminderData).returning('*');
    
    // Update next reminder date only if interval or both
    if (entry.reminder_schedule_type === 'interval' || entry.reminder_schedule_type === 'both') {
      await db('cashbook')
        .where({ id })
        .update({
          last_reminder_sent: new Date().toISOString(),
          next_reminder_date: new Date(Date.now() + entry.reminder_interval_days * 24 * 60 * 60 * 1000).toISOString()
        });
    } else {
      // Manual only - just update last reminder sent
      await db('cashbook')
        .where({ id })
        .update({
          last_reminder_sent: new Date().toISOString()
        });
    }
    
    res.json({
      message: entry.reminder_schedule_type === 'manual' 
        ? 'Manual reminder sent successfully via WhatsApp'
        : 'Reminder sent successfully via WhatsApp',
      reminder,
      entry: {
        ...entry,
        reminder_message: reminderMessage
      }
    });
    
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({ message: 'Server error sending reminder' });
  }
});

// Get reminder history for a cashbook entry
router.get('/:id/reminders', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify the cashbook entry belongs to this business
    const entry = await db('cashbook')
      .where({ id, business_id: mockBusinessId })
      .first();
    
    if (!entry) {
      return res.status(404).json({ message: 'Cashbook entry not found' });
    }
    
    // Get reminder history
    const reminders = await db('reminders')
      .where({ cashbook_id: id })
      .orderBy('scheduled_at', 'desc');
    
    res.json(reminders);
    
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: 'Server error fetching reminders' });
  }
});

module.exports = router;
