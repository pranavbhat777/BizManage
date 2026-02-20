const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../config/database');
const moment = require('moment');

// For now, use a mock business ID since we're removing auth
const mockBusinessId = 1;

// Get all insurance policies for a business
router.get('/', async (req, res) => {
  try {
    const insurance = await db('insurance')
      .where({ business_id: mockBusinessId })
      .orderBy('expiry_date', 'asc');
    
    res.json(insurance);
  } catch (error) {
    console.error('Get insurance error:', error);
    res.status(500).json({ message: 'Server error fetching insurance policies' });
  }
});

// Get insurance policies expiring soon (within 30 days)
router.get('/expiring-soon', async (req, res) => {
  try {
    const thirtyDaysFromNow = moment().add(30, 'days').format('YYYY-MM-DD');
    const today = moment().format('YYYY-MM-DD');
    
    const expiring = await db('insurance')
      .where({ 
        business_id: mockBusinessId,
        active: true
      })
      .where('expiry_date', '>=', today)
      .where('expiry_date', '<=', thirtyDaysFromNow)
      .orderBy('expiry_date', 'asc');
    
    res.json(expiring);
  } catch (error) {
    console.error('Get expiring insurance error:', error);
    res.status(500).json({ message: 'Server error fetching expiring insurance' });
  }
});

// Get single insurance policy
router.get('/:id', async (req, res) => {
  try {
    const insurance = await db('insurance')
      .where({ 
        id: req.params.id, 
        business_id: mockBusinessId 
      })
      .first();
    
    if (!insurance) {
      return res.status(404).json({ message: 'Insurance policy not found' });
    }
    
    res.json(insurance);
  } catch (error) {
    console.error('Get insurance error:', error);
    res.status(500).json({ message: 'Server error fetching insurance policy' });
  }
});

// Create new insurance policy
router.post('/', [
  body('policy_name').trim().isLength({ min: 1, max: 200 }).withMessage('Policy name is required (max 200 characters)'),
  body('insurance_company').trim().isLength({ min: 1, max: 100 }).withMessage('Insurance company is required (max 100 characters)'),
  body('policy_number').optional({ checkFalsy: true }).trim().isLength({ min: 1, max: 100 }).withMessage('Policy number must be between 1-100 characters if provided'),
  body('policy_type').isIn(['health', 'life', 'vehicle', 'property', 'travel', 'business', 'other']).withMessage('Valid policy type is required'),
  body('policy_premium').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Valid premium amount is required'),
  body('premium_frequency').optional({ checkFalsy: true }).isIn(['monthly', 'quarterly', 'yearly']).withMessage('Valid premium frequency is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('expiry_date').isISO8601().withMessage('Valid expiry date is required'),
  body('contact_person').optional({ checkFalsy: true }).trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1-100 characters if provided'),
  body('contact_phone').isLength({ min: 10, max: 15 }).withMessage('Phone number is required (10-15 digits)'),
  body('contact_email').optional({ checkFalsy: true }).isEmail().withMessage('Valid email is required if provided'),
  body('coverage_details').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }).withMessage('Coverage details too long'),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }).withMessage('Notes too long'),
  body('vehicle_number').optional().trim().isLength({ max: 50 }).withMessage('Vehicle number must be less than 50 characters')
], async (req, res) => {
  try {
    console.log('Creating insurance policy with body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      policy_name,
      insurance_company,
      policy_number,
      policy_type,
      policy_premium,
      premium_frequency,
      start_date,
      expiry_date,
      contact_person,
      contact_phone,
      contact_email,
      coverage_details,
      notes,
      vehicle_number
    } = req.body;

    console.log('Extracted data:', {
      policy_name,
      insurance_company,
      policy_type,
      start_date,
      expiry_date
    });

    // Generate unique ID
    const id = 'ins-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    const insertData = {
      id,
      business_id: mockBusinessId,
      policy_name,
      insurance_company,
      policy_number: policy_number || null,
      policy_type,
      policy_premium: policy_premium ? parseFloat(policy_premium) : null,
      premium_frequency: premium_frequency || null,
      start_date,
      expiry_date,
      contact_person: contact_person || null,
      contact_phone: contact_phone, // Phone is mandatory - don't use || null
      contact_email: contact_email || null,
      coverage_details: coverage_details || null,
      notes: notes || null,
      vehicle_number: vehicle_number || null
    };

    console.log('Insert data prepared:', insertData);

    try {
      const [insurance] = await db('insurance').insert(insertData).returning('*');
      console.log('Insurance created successfully:', insurance);
      
      res.status(201).json({
        message: 'Insurance policy created successfully',
        insurance
      });
    } catch (dbError) {
      console.error('Database insert error:', dbError);
      console.error('Error details:', {
        message: dbError.message,
        sql: dbError.sql,
        bindings: dbError.bindings
      });
      res.status(500).json({ 
        message: 'Database error creating insurance policy',
        error: dbError.message 
      });
    }
  } catch (error) {
    console.error('Create insurance error:', error);
    res.status(500).json({ message: 'Server error creating insurance policy' });
  }
});

// Update insurance policy
router.put('/:id', [
  body('policy_name').optional().trim().isLength({ min: 2 }),
  body('insurance_company').optional().trim().isLength({ min: 2 }),
  body('policy_number').optional().trim(),
  body('policy_type').optional().isIn(['health', 'life', 'vehicle', 'property', 'liability']),
  body('policy_premium').optional().isFloat({ min: 0 }),
  body('premium_frequency').optional().isIn(['monthly', 'quarterly', 'yearly']),
  body('start_date').optional().isISO8601(),
  body('expiry_date').optional().isISO8601(),
  body('contact_person').optional().trim(),
  body('contact_phone').optional().trim()
], async (req, res) => {
  try {
    console.log('Updating insurance policy with body:', req.body);
    console.log('Request params:', req.params);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if insurance exists and belongs to business
    const existing = await db('insurance')
      .where({ id: req.params.id, business_id: mockBusinessId })
      .first();

    if (!existing) {
      return res.status(404).json({ message: 'Insurance policy not found' });
    }

    const updates = {};
    const allowedFields = [
      'policy_name', 'insurance_company', 'policy_number', 'policy_type',
      'policy_premium', 'premium_frequency', 'start_date', 'expiry_date',
      'contact_person', 'contact_phone', 'contact_email', 'coverage_details',
      'notes', 'vehicle_number', 'active'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        updates[field] = field === 'policy_premium' ? parseFloat(req.body[field]) : req.body[field];
      }
    });

    console.log('Updates prepared:', updates);

    const [insurance] = await db('insurance')
      .where({ id: req.params.id })
      .update(updates)
      .returning('*');

    res.json({
      message: 'Insurance policy updated successfully',
      insurance
    });
  } catch (error) {
    console.error('Update insurance error:', error);
    res.status(500).json({ message: 'Server error updating insurance policy' });
  }
});

// Delete insurance policy
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await db('insurance')
      .where({ id: req.params.id, business_id: mockBusinessId })
      .del();

    if (deleted === 0) {
      return res.status(404).json({ message: 'Insurance policy not found' });
    }

    res.json({ message: 'Insurance policy deleted successfully' });
  } catch (error) {
    console.error('Delete insurance error:', error);
    res.status(500).json({ message: 'Server error deleting insurance policy' });
  }
});

// Send insurance expiry notification
router.post('/:id/send-notification', async (req, res) => {
  try {
    const insurance = await db('insurance')
      .where({ 
        id: req.params.id, 
        business_id: mockBusinessId 
      })
      .first();

    if (!insurance) {
      return res.status(404).json({ message: 'Insurance policy not found' });
    }

    // Create comprehensive notification message
    const notificationMessage = `🔔 INSURANCE RENEWAL REMINDER 🔔

📋 Policy Details:
• Policy Name: ${insurance.policy_name}
• Insurance Company: ${insurance.insurance_company}
• Policy Number: ${insurance.policy_number || 'N/A'}
• Policy Type: ${insurance.policy_type}
• Premium Amount: ${insurance.premium_amount ? `₹${insurance.premium_amount}` : 'N/A'}
• Premium Frequency: ${insurance.premium_frequency || 'N/A'}

📅 Important Dates:
• Start Date: ${insurance.start_date}
• Expiry Date: ${insurance.expiry_date}
• Days Until Expiry: ${Math.ceil((new Date(insurance.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))} days

👤 Contact Person: ${insurance.contact_person || 'N/A'}
📱 Phone: ${insurance.contact_phone}
📧 Email: ${insurance.contact_email || 'N/A'}

📄 Coverage Details:
${insurance.coverage_details || 'No coverage details provided'}

📝 Notes:
${insurance.notes || 'No additional notes'}

⚠️ Please renew your policy before expiry to ensure continuous coverage.
Powered by BizManage Pro 🚀`;

    // Update notification sent status
    await db('insurance')
      .where({ id: req.params.id })
      .update({
        notification_sent: true,
        last_notification_sent: new Date().toISOString()
      });

    // Create WhatsApp URL for sending notification
    const whatsappUrl = insurance.contact_phone 
      ? `https://wa.me/${insurance.contact_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(notificationMessage)}`
      : null;

    console.log('Insurance notification message:', notificationMessage);
    console.log('WhatsApp URL:', whatsappUrl);
    
    res.json({
      message: 'Expiry notification sent successfully via WhatsApp',
      notification: notificationMessage,
      whatsappUrl: whatsappUrl,
      insurance: {
        ...insurance,
        notification_sent: true,
        last_notification_sent: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Server error sending notification' });
  }
});

module.exports = router;
