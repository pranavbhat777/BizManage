const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const moment = require('moment');

const router = express.Router();

// For now, use a mock business ID since we're removing auth
const mockBusinessId = 1;

// Get payroll records
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, employee_id, status, period_type } = req.query;
    
    let query = db('payroll')
      .join('employees', 'payroll.employee_id', 'employees.id')
      .select(
        'payroll.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'employees.salary_type',
        'employees.salary_amount'
      )
      .where('employees.business_id', mockBusinessId);
    
    if (start_date && end_date) {
      query = query.whereBetween('payroll.period_start', [start_date, end_date]);
    }
    
    if (employee_id) {
      query = query.where('payroll.employee_id', employee_id);
    }
    
    if (status) {
      query = query.where('payroll.status', status);
    }
    
    if (period_type) {
      query = query.where('payroll.period_type', period_type);
    }
    
    const payroll = await query.orderBy('payroll.period_start', 'desc');
    
    res.json(payroll);
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({ message: 'Server error fetching payroll' });
  }
});

// Test endpoint for debugging
router.post('/test', async (req, res) => {
  try {
    console.log('Payroll test endpoint hit!');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    res.json({ message: 'Test endpoint working', body: req.body });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ message: 'Test endpoint error' });
  }
});

// Simple test route without validation
router.post('/generate-simple', async (req, res) => {
  try {
    console.log('SIMPLE PAYROLL ROUTE HIT!');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { period_start, period_end, period_type, employee_ids } = req.body;
    
    res.status(201).json({
      message: 'Simple payroll test successful',
      data: { period_start, period_end, period_type, employee_ids }
    });
    
  } catch (error) {
    console.error('Simple payroll error:', error);
    res.status(500).json({ message: 'Simple server error' });
  }
});

// Generate payroll for a period
router.post('/generate', async (req, res) => {
  try {
    console.log('Payroll generation route hit!');
    console.log('Payroll generation request body:', JSON.stringify(req.body, null, 2));
    
    const { period_start, period_end, period_type, employee_ids } = req.body;
    
    console.log('Extracted data:', { period_start, period_end, period_type, employee_ids });
    
    // Validate employees belong to this business
    const employees = await db('employees')
      .where({ business_id: mockBusinessId, active: true })
      .whereIn('id', employee_ids);
    
    if (employees.length !== employee_ids.length) {
      return res.status(400).json({ message: 'Invalid employee IDs' });
    }
    
    // const business = await db('businesses')
    //   .where({ id: mockBusinessId })
    //   .first();
    
    // console.log('Business found:', !!business);
    
    const generatedPayroll = [];
    
    for (const employee of employees) {
      console.log('Processing employee:', employee.id, employee.first_name);
      
      // Check if payroll already exists for this period
      const existingPayroll = await db('payroll')
        .where({
          employee_id: employee.id,
          period_start,
          period_end
        })
        .first();
      
      if (existingPayroll) {
        console.log('Payroll already exists for employee:', employee.id);
        continue; // Skip if payroll already exists
      }
      
      // Calculate basic pay based on attendance
      let basicPay = 0;
      const attendanceRecords = await db('attendance')
        .where({ employee_id: employee.id })
        .whereBetween('date', [period_start, period_end]);
      
      if (attendanceRecords && attendanceRecords.length > 0) {
        const dailyRate = employee.salary_type === 'daily' 
          ? employee.salary_amount
          : employee.salary_amount / (employee.salary_type === 'weekly' ? 6 : 26);
        
        attendanceRecords.forEach(record => {
          if (record.status === 'present') {
            basicPay += dailyRate;
          } else if (record.status === 'half_day') {
            basicPay += dailyRate * 0.5;
          }
          // Absent = 0, so no addition
        });
      } else {
        // If no attendance records, use full period salary
        if (period_type === 'weekly') {
          if (employee.salary_type === 'daily') {
            basicPay = employee.salary_amount * 6; // 6 working days
          } else if (employee.salary_type === 'weekly') {
            basicPay = employee.salary_amount;
          } else if (employee.salary_type === 'monthly') {
            basicPay = employee.salary_amount / 4; // Approximate weekly
          }
        } else if (period_type === 'monthly') {
          if (employee.salary_type === 'daily') {
            basicPay = employee.salary_amount * 26; // 26 working days
          } else if (employee.salary_type === 'weekly') {
            basicPay = employee.salary_amount * 4; // 4 weeks
          } else if (employee.salary_type === 'monthly') {
            basicPay = employee.salary_amount;
          }
        }
      }
      
      // Calculate overtime pay
      const [overtimeTotal] = await db('overtime')
        .where({ employee_id: employee.id })
        .whereBetween('date', [period_start, period_end])
        .sum('total_amount as total')
        .first();
      
      const overtimePay = parseFloat(overtimeTotal.total) || 0;
      
      // Calculate total earnings
      const totalEarnings = basicPay + overtimePay;
      
      // Get active advance amount
      const [advanceBalance] = await db('advances')
        .where({ employee_id: employee.id })
        .where('balance_remaining', '>', 0)
        .sum('balance_remaining as total')
        .first();
      
      const activeAdvanceAmount = parseFloat(advanceBalance.total) || 0;
      
      // Default custom advance deduction (can be modified in frontend)
      const customAdvanceDeduction = 0; // Default to 0, user can specify
      
      // Calculate final net salary
      const finalNetSalary = basicPay + overtimePay - customAdvanceDeduction;
      
      const [payrollRecord] = await db('payroll').insert({
        employee_id: employee.id,
        period_start,
        period_end,
        period_type,
        base_salary: basicPay,
        attendance_deduction: 0, // No attendance deduction in new system
        overtime_amount: overtimePay,
        advance_deduction: customAdvanceDeduction,
        total_deductions: customAdvanceDeduction,
        net_salary: finalNetSalary,
        status: 'pending',
        processed_by: mockBusinessId,
        // Store detailed breakdown in notes for frontend display
        notes: JSON.stringify({
          basic_pay: basicPay,
          overtime_pay: overtimePay,
          total_earnings: totalEarnings,
          active_advance_amount: activeAdvanceAmount,
          custom_advance_deduction: customAdvanceDeduction,
          final_net_salary: finalNetSalary,
          attendance_breakdown: attendanceRecords.map(r => ({
            date: r.date,
            status: r.status
          }))
        })
      }).returning('*');
      
      generatedPayroll.push(payrollRecord);
    }
    
    res.status(201).json({
      message: 'Payroll generated successfully',
      payroll: generatedPayroll
    });
  } catch (error) {
    console.error('Generate payroll error:', error);
    res.status(500).json({ message: 'Server error generating payroll' });
  }
});

// Update advance records when payroll deduction is applied
router.put('/:id/update-advances', async (req, res) => {
  try {
    const payrollId = req.params.id;
    const { advance_deduction } = req.body;
    
    console.log('Updating advance records for payroll:', payrollId, 'deduction:', advance_deduction);
    
    // Get the payroll record to find employee
    const payrollRecord = await db('payroll')
      .where({ id: payrollId })
      .first();
    
    if (!payrollRecord) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    // Get active advances for this employee
    const advances = await db('advances')
      .where({ employee_id: payrollRecord.employee_id })
      .where('balance_remaining', '>', 0)
      .orderBy('date', 'asc');
    
    let remainingDeduction = parseFloat(advance_deduction || 0);
    
    // Update advance balances
    for (const advance of advances) {
      if (remainingDeduction <= 0) break;
      
      const deductionAmount = Math.min(remainingDeduction, parseFloat(advance.balance_remaining));
      const newBalance = parseFloat(advance.balance_remaining) - deductionAmount;
      
      await db('advances')
        .where({ id: advance.id })
        .update({ 
          balance_remaining: Math.max(0, newBalance),
          updated_at: new Date()
        });
      
      remainingDeduction -= deductionAmount;
    }
    
    // Clear overtime records within payroll period
    const overtimeRecords = await db('overtime')
      .where({ employee_id: payrollRecord.employee_id })
      .whereBetween('date', [payrollRecord.period_start, payrollRecord.period_end]);
    
    for (const overtime of overtimeRecords) {
      await db('overtime')
        .where({ id: overtime.id })
        .update({ 
          status: 'cleared',
          updated_at: new Date()
        });
    }
    
    res.json({ 
      message: 'Advance records updated successfully',
      advances_updated: advances.length,
      total_deducted: parseFloat(advance_deduction || 0) - remainingDeduction,
      overtime_cleared: overtimeRecords.length
    });
    
  } catch (error) {
    console.error('Update advance records error:', error);
    res.status(500).json({ message: 'Server error updating advance records' });
  }
});

// Update payroll status
router.put('/:id/status', [
  body('status').isIn(['pending', 'processed', 'paid']).withMessage('Invalid status'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const payrollId = req.params.id;
    const { status, payment_date } = req.body;
    
    // Check if payroll exists and belongs to business
    const existingPayroll = await db('payroll')
      .join('employees', 'payroll.employee_id', 'employees.id')
      .where({
        'payroll.id': payrollId,
        'employees.business_id': mockBusinessId
      })
      .first();
    
    if (!existingPayroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    const updateData = { status };
    if (status === 'paid' && payment_date) {
      updateData.payment_date = payment_date;
    }
    
    const [updatedPayroll] = await db('payroll')
      .where({ id: payrollId })
      .update(updateData)
      .returning('*');
    
    res.json({
      message: 'Payroll status updated successfully',
      payroll: updatedPayroll
    });
  } catch (error) {
    console.error('Update payroll status error:', error);
    res.status(500).json({ message: 'Server error updating payroll status' });
  }
});

// Get payroll summary
router.get('/summary', async (req, res) => {
  try {
    const { start_date, end_date, period_type } = req.query;
    
    let query = db('payroll')
      .join('employees', 'payroll.employee_id', 'employees.id')
      .where('employees.business_id', mockBusinessId);
    
    if (start_date && end_date) {
      query = query.whereBetween('payroll.period_start', [start_date, end_date]);
    }
    
    if (period_type) {
      query = query.where('payroll.period_type', period_type);
    }
    
    const [summary] = await query
      .select(
        db.raw('COUNT(*) as total_records'),
        db.raw('SUM(base_salary) as total_base_salary'),
        db.raw('SUM(attendance_deduction) as total_attendance_deductions'),
        db.raw('SUM(overtime_amount) as total_overtime'),
        db.raw('SUM(advance_deduction) as total_advance_deductions'),
        db.raw('SUM(total_deductions) as total_deductions'),
        db.raw('SUM(net_salary) as total_net_salary'),
        db.raw("SUM(CASE WHEN status = 'pending' THEN net_salary ELSE 0 END) as pending_amount"),
        db.raw("SUM(CASE WHEN status = 'processed' THEN net_salary ELSE 0 END) as processed_amount"),
        db.raw("SUM(CASE WHEN status = 'paid' THEN net_salary ELSE 0 END) as paid_amount")
      )
      .first();
    
    res.json({
      total_records: parseInt(summary.total_records) || 0,
      total_base_salary: parseFloat(summary.total_base_salary) || 0,
      total_attendance_deductions: parseFloat(summary.total_attendance_deductions) || 0,
      total_overtime: parseFloat(summary.total_overtime) || 0,
      total_advance_deductions: parseFloat(summary.total_advance_deductions) || 0,
      total_deductions: parseFloat(summary.total_deductions) || 0,
      total_net_salary: parseFloat(summary.total_net_salary) || 0,
      pending_amount: parseFloat(summary.pending_amount) || 0,
      processed_amount: parseFloat(summary.processed_amount) || 0,
      paid_amount: parseFloat(summary.paid_amount) || 0
    });
  } catch (error) {
    console.error('Get payroll summary error:', error);
    res.status(500).json({ message: 'Server error fetching payroll summary' });
  }
});

// Get detailed payslip
router.get('/:id/payslip', async (req, res) => {
  try {
    const payrollId = req.params.id;
    
    const payslip = await db('payroll')
      .join('employees', 'payroll.employee_id', 'employees.id')
      .join('businesses', 'employees.business_id', 'businesses.id')
      .select(
        'payroll.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'employees.salary_type',
        'employees.salary_amount',
        'employees.email',
        'employees.phone',
        'businesses.name as business_name',
        'businesses.address as business_address',
        'businesses.phone as business_phone'
      )
      .where({
        'payroll.id': payrollId,
        'employees.business_id': mockBusinessId
      })
      .first();
    
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }
    
    // Get attendance details for the period
    const attendanceDetails = await db('attendance')
      .where({ employee_id: payslip.employee_id })
      .whereBetween('date', [payslip.period_start, payslip.period_end])
      .orderBy('date');
    
    // Get overtime details for the period
    const overtimeDetails = await db('overtime')
      .where({ employee_id: payslip.employee_id })
      .whereBetween('date', [payslip.period_start, payslip.period_end])
      .orderBy('date');
    
    // Get advance details for the period
    const advanceDetails = await db('advances')
      .where({ employee_id: payslip.employee_id })
      .whereBetween('date', [payslip.period_start, payslip.period_end])
      .orderBy('date');
    
    res.json({
      payslip,
      attendance_details: attendanceDetails,
      overtime_details: overtimeDetails,
      advance_details: advanceDetails
    });
  } catch (error) {
    console.error('Get payslip error:', error);
    res.status(500).json({ message: 'Server error fetching payslip' });
  }
});

module.exports = router;
