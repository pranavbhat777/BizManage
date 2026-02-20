const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// For now, use a mock business ID since we're removing auth
const mockBusinessId = 1;

// Get advance records
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, employee_id, status } = req.query;
    
    let query = db('advances')
      .join('employees', 'advances.employee_id', 'employees.id')
      .select(
        'advances.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'advances.notes'
      )
      .where('employees.business_id', mockBusinessId);
    
    if (start_date && end_date) {
      query = query.whereBetween('advances.date', [start_date, end_date]);
    }
    
    if (employee_id) {
      query = query.where('advances.employee_id', employee_id);
    }
    
    if (status === 'pending') {
      query = query.where('advances.balance_remaining', '>', 0);
    } else if (status === 'cleared') {
      query = query.where('advances.balance_remaining', '=', 0);
    }
    
    const advances = await query.orderBy('advances.date', 'desc');
    
    res.json(advances);
  } catch (error) {
    console.error('Get advances error:', error);
    res.status(500).json({ message: 'Server error fetching advances' });
  }
});

// Add advance record
router.post('/', [
  body('employee_id').isUUID().withMessage('Valid employee ID required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be positive'),
  body('date').isISO8601().withMessage('Valid date required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employee_id, amount, date, notes } = req.body;
    
    // Validate employee belongs to this business
    const employee = await db('employees')
      .where({ id: employee_id, business_id: mockBusinessId, active: true })
      .first();
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    const [advance] = await db('advances').insert({
      employee_id,
      amount,
      date,
      notes,
      balance_remaining: amount,
      recorded_by: mockBusinessId
    }).returning('*');
    
    res.status(201).json({
      message: 'Advance recorded successfully',
      advance
    });
  } catch (error) {
    console.error('Add advance error:', error);
    res.status(500).json({ message: 'Server error adding advance' });
  }
});

// Get employee advance balance
router.get('/balance/:employee_id', async (req, res) => {
  try {
    const employee_id = req.params.employee_id;
    
    // Validate employee belongs to this business
    const employee = await db('employees')
      .where({ id: employee_id, business_id: mockBusinessId, active: true })
      .first();
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    const [balanceResult] = await db('advances')
      .where({ employee_id })
      .sum('balance_remaining as total_balance')
      .first();
    
    const advances = await db('advances')
      .where({ employee_id })
      .where('balance_remaining', '>', 0)
      .orderBy('date', 'desc');
    
    res.json({
      total_balance: parseFloat(balanceResult.total_balance) || 0,
      pending_advances: advances
    });
  } catch (error) {
    console.error('Get advance balance error:', error);
    res.status(500).json({ message: 'Server error fetching advance balance' });
  }
});

// Update advance balance (used when payroll deducts advance)
router.put('/:id/balance', [
  body('deduction_amount').isFloat({ min: 0.01 }).withMessage('Deduction amount must be positive'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const advanceId = req.params.id;
    const { deduction_amount } = req.body;
    
    // Get current advance
    const advance = await db('advances')
      .join('employees', 'advances.employee_id', 'employees.id')
      .where({
        'advances.id': advanceId,
        'employees.business_id': mockBusinessId
      })
      .first();
    
    if (!advance) {
      return res.status(404).json({ message: 'Advance record not found' });
    }
    
    if (deduction_amount > advance.balance_remaining) {
      return res.status(400).json({ 
        message: 'Deduction amount cannot exceed remaining balance',
        remaining_balance: advance.balance_remaining
      });
    }
    
    const newBalance = advance.balance_remaining - deduction_amount;
    
    const [updatedAdvance] = await db('advances')
      .where({ id: advanceId })
      .update({ balance_remaining: newBalance })
      .returning('*');
    
    res.json({
      message: 'Advance balance updated successfully',
      advance: updatedAdvance
    });
  } catch (error) {
    console.error('Update advance balance error:', error);
    res.status(500).json({ message: 'Server error updating advance balance' });
  }
});

// Get advance summary for all employees
router.get('/summary', async (req, res) => {
  try {
    const summary = await db('advances')
      .join('employees', 'advances.employee_id', 'employees.id')
      .select(
        'employees.id',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        db.raw('SUM(advances.amount) as total_advances'),
        db.raw('SUM(advances.balance_remaining) as pending_balance'),
        db.raw('COUNT(*) as advance_count')
      )
      .where('employees.business_id', mockBusinessId)
      .where('advances.balance_remaining', '>', 0)
      .groupBy('employees.id', 'employees.first_name', 'employees.last_name', 'employees.employee_code')
      .orderBy('pending_balance', 'desc');
    
    // Add overall totals
    const [totalSummary] = await db('advances')
      .join('employees', 'advances.employee_id', 'employees.id')
      .where('employees.business_id', mockBusinessId)
      .where('advances.balance_remaining', '>', 0)
      .select(
        db.raw('SUM(advances.amount) as total_advances'),
        db.raw('SUM(advances.balance_remaining) as pending_balance'),
        db.raw('COUNT(*) as advance_count')
      )
      .first();
    
    res.json({
      employee_summary: summary,
      total_summary: {
        total_advances: parseFloat(totalSummary.total_advances) || 0,
        pending_balance: parseFloat(totalSummary.pending_balance) || 0,
        advance_count: parseInt(totalSummary.advance_count) || 0
      }
    });
  } catch (error) {
    console.error('Get advance summary error:', error);
    res.status(500).json({ message: 'Server error fetching advance summary' });
  }
});

// Delete advance record
router.delete('/:id', async (req, res) => {
  try {
    const advanceId = req.params.id;
    
    const deleted = await db('advances')
      .join('employees', 'advances.employee_id', 'employees.id')
      .where({
        'advances.id': advanceId,
        'employees.business_id': mockBusinessId
      })
      .del();
    
    if (!deleted) {
      return res.status(404).json({ message: 'Advance record not found' });
    }
    
    res.json({ message: 'Advance record deleted successfully' });
  } catch (error) {
    console.error('Delete advance error:', error);
    res.status(500).json({ message: 'Server error deleting advance' });
  }
});

module.exports = router;
