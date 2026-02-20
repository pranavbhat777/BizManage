const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// For now, use a mock business ID since we're removing auth
const mockBusinessId = 1;

// Simple test route
router.post('/generate', async (req, res) => {
  try {
    console.log('SIMPLE PAYROLL ROUTE HIT!');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { period_start, period_end, period_type, employee_ids } = req.body;
    console.log('Extracted data:', { period_start, period_end, period_type, employee_ids });
    
    res.status(201).json({
      message: 'Simple payroll test successful',
      data: { period_start, period_end, period_type, employee_ids }
    });
    
  } catch (error) {
    console.error('Simple payroll error:', error);
    res.status(500).json({ message: 'Simple server error' });
  }
});

module.exports = router;
