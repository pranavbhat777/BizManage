const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const moment = require('moment');

const router = express.Router();

// For now, use a mock business ID since we're removing auth
const mockBusinessId = 1;

// Get overtime records
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, employee_id } = req.query;
    
    let query = db('overtime')
      .join('employees', 'overtime.employee_id', 'employees.id')
      .select(
        'overtime.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'employees.salary_amount',
        'employees.salary_type'
      )
      .where('employees.business_id', mockBusinessId);
    
    if (start_date && end_date) {
      query = query.whereBetween('overtime.date', [start_date, end_date]);
    }
    
    if (employee_id) {
      query = query.where('overtime.employee_id', employee_id);
    }
    
    const overtime = await query.orderBy('overtime.date', 'desc');
    
    res.json(overtime);
  } catch (error) {
    console.error('Get overtime error:', error);
    res.status(500).json({ message: 'Server error fetching overtime' });
  }
});

// Add overtime record
router.post('/', [
  body('employee_id').isUUID().withMessage('Valid employee ID required'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('hours').isFloat({ min: 0.1, max: 24 }).withMessage('Hours must be between 0.1 and 24'),
  body('rate').isFloat({ min: 0 }).withMessage('Rate must be a positive number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employee_id, date, hours, rate, notes } = req.body;
    
    // Validate employee belongs to this business
    const employee = await db('employees')
      .where({ id: employee_id, business_id: mockBusinessId, active: true })
      .first();
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Calculate total amount as hours * rate
    const totalAmount = hours * rate;
    
    const [overtimeRecord] = await db('overtime').insert({
      employee_id,
      date,
      hours,
      rate_type: rate >= 2 ? 'holiday' : 'normal', // Use allowed values: normal or holiday
      rate_multiplier: rate,
      total_amount: totalAmount,
      notes,
      approved_by: mockBusinessId
    }).returning('*');
    
    res.status(201).json({
      message: 'Overtime recorded successfully',
      overtime: overtimeRecord
    });
  } catch (error) {
    console.error('Add overtime error:', error);
    res.status(500).json({ message: 'Server error adding overtime' });
  }
});

// Get weekly overtime summary
router.get('/weekly', async (req, res) => {
  try {
    const { start_date, end_date, employee_id } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Start date and end date required' });
    }
    
    let query = db('overtime')
      .join('employees', 'overtime.employee_id', 'employees.id')
      .select(
        'employees.id',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        db.raw('SUM(overtime.hours) as total_hours'),
        db.raw('SUM(overtime.total_amount) as total_amount'),
        db.raw("SUM(CASE WHEN overtime.rate_type = 'normal' THEN overtime.hours ELSE 0 END) as normal_hours"),
        db.raw("SUM(CASE WHEN overtime.rate_type = 'holiday' THEN overtime.hours ELSE 0 END) as holiday_hours")
      )
      .where('employees.business_id', mockBusinessId)
      .whereBetween('overtime.date', [start_date, end_date])
      .groupBy('employees.id', 'employees.first_name', 'employees.last_name', 'employees.employee_code');
    
    if (employee_id) {
      query = query.where('employees.id', employee_id);
    }
    
    const weeklySummary = await query;
    
    res.json(weeklySummary);
  } catch (error) {
    console.error('Get weekly overtime error:', error);
    res.status(500).json({ message: 'Server error fetching weekly overtime' });
  }
});

// Get overtime summary for reports
router.get('/summary', async (req, res) => {
  try {
    const { start_date, end_date, employee_id } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Start date and end date required' });
    }
    
    let query = db('overtime')
      .join('employees', 'overtime.employee_id', 'employees.id')
      .select(
        'employees.id',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        db.raw('SUM(overtime.hours) as total_hours'),
        db.raw('SUM(overtime.total_amount) as total_amount'),
        db.raw('COUNT(overtime.id) as record_count')
      )
      .where('employees.business_id', mockBusinessId)
      .whereBetween('overtime.date', [start_date, end_date])
      .groupBy('employees.id', 'employees.first_name', 'employees.last_name', 'employees.employee_code');
    
    if (employee_id) {
      query = query.where('employees.id', employee_id);
    }
    
    const summary = await query;
    
    res.json(summary);
  } catch (error) {
    console.error('Get overtime summary error:', error);
    res.status(500).json({ message: 'Server error fetching overtime summary' });
  }
});

// Update overtime record
router.put('/:id', [
  body('hours').optional().isFloat({ min: 0.1, max: 24 }),
  body('rate').optional().isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const overtimeId = req.params.id;
    
    // Check if overtime exists and belongs to business
    const existingOvertime = await db('overtime')
      .join('employees', 'overtime.employee_id', 'employees.id')
      .where({
        'overtime.id': overtimeId,
        'employees.business_id': mockBusinessId
      })
      .first();
    
    if (!existingOvertime) {
      return res.status(404).json({ message: 'Overtime record not found' });
    }
    
    // If hours or rate changed, recalculate amount
    if (req.body.hours || req.body.rate) {
      const newHours = req.body.hours || existingOvertime.hours;
      const newRate = req.body.rate || existingOvertime.rate_multiplier;
      req.body.total_amount = newHours * newRate;
      req.body.rate_multiplier = newRate;
      req.body.rate_type = newRate >= 2 ? 'holiday' : 'normal'; // Use allowed values
    }
    
    const [updatedOvertime] = await db('overtime')
      .where({ id: overtimeId })
      .update(req.body)
      .returning('*');
    
    res.json({
      message: 'Overtime updated successfully',
      overtime: updatedOvertime
    });
  } catch (error) {
    console.error('Update overtime error:', error);
    res.status(500).json({ message: 'Server error updating overtime' });
  }
});

// Delete overtime record
router.delete('/:id', async (req, res) => {
  try {
    const overtimeId = req.params.id;
    
    const deleted = await db('overtime')
      .join('employees', 'overtime.employee_id', 'employees.id')
      .where({
        'overtime.id': overtimeId,
        'employees.business_id': mockBusinessId
      })
      .del();
    
    if (!deleted) {
      return res.status(404).json({ message: 'Overtime record not found' });
    }
    
    res.json({ message: 'Overtime record deleted successfully' });
  } catch (error) {
    console.error('Delete overtime error:', error);
    res.status(500).json({ message: 'Server error deleting overtime' });
  }
});

module.exports = router;
