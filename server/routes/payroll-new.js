const express = require('express');
const db = require('../config/database');

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

// Preview payroll calculation
router.post('/preview', async (req, res) => {
  try {
    const { period_start, period_end, period_type, employee_ids, custom_advance_deduction } = req.body;
    
    const employees = await db('employees')
      .where({ business_id: mockBusinessId, active: true })
      .whereIn('id', employee_ids);
    
    const previewData = [];
    
    for (const employee of employees) {
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
        });
      } else {
        // Use full period salary
        if (period_type === 'weekly') {
          if (employee.salary_type === 'daily') {
            basicPay = employee.salary_amount * 6;
          } else if (employee.salary_type === 'weekly') {
            basicPay = employee.salary_amount;
          } else if (employee.salary_type === 'monthly') {
            basicPay = employee.salary_amount / 4;
          }
        } else if (period_type === 'monthly') {
          if (employee.salary_type === 'daily') {
            basicPay = employee.salary_amount * 26;
          } else if (employee.salary_type === 'weekly') {
            basicPay = employee.salary_amount * 4;
          } else if (employee.salary_type === 'monthly') {
            basicPay = employee.salary_amount;
          }
        }
      }
      
      // Calculate overtime pay
      const overtimeTotal = await db('overtime')
        .where({ employee_id: employee.id })
        .whereBetween('date', [period_start, period_end])
        .sum('total_amount as total')
        .first();
      
      const overtimePay = parseFloat(overtimeTotal.total) || 0;
      const totalEarnings = basicPay + overtimePay;
      const customDeduction = parseFloat(custom_advance_deduction) || 0;
      const netSalary = totalEarnings - customDeduction;
      
      previewData.push({
        employee_id: employee.id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        basicPay,
        overtimePay,
        totalEarnings,
        customAdvanceDeduction: customDeduction,
        netSalary
      });
    }
    
    res.json(previewData);
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ message: 'Error calculating preview' });
  }
});

// Generate payroll for a period
router.post('/generate', async (req, res) => {
  try {
    console.log('NEW PAYROLL ROUTE HIT!');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { period_start, period_end, period_type, employee_ids, custom_advance_deduction } = req.body;
    
    console.log('Extracted data:', { period_start, period_end, period_type, employee_ids });
    
    // Validate employees belong to this business
    const employees = await db('employees')
      .where({ business_id: mockBusinessId, active: true })
      .whereIn('id', employee_ids);
    
    console.log('Found employees:', employees.length);
    
    if (employees.length !== employee_ids.length) {
      return res.status(400).json({ message: 'Invalid employee IDs' });
    }
    
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
        continue;
      }
      
      // Calculate basic pay based on attendance
      let basicPay = 0;
      const attendanceRecords = await db('attendance')
        .where({ employee_id: employee.id })
        .whereBetween('date', [period_start, period_end]);
      
      console.log('Attendance records found:', attendanceRecords.length);
      
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
            basicPay = employee.salary_amount * 6;
          } else if (employee.salary_type === 'weekly') {
            basicPay = employee.salary_amount;
          } else if (employee.salary_type === 'monthly') {
            basicPay = employee.salary_amount / 4;
          }
        } else if (period_type === 'monthly') {
          if (employee.salary_type === 'daily') {
            basicPay = employee.salary_amount * 26;
          } else if (employee.salary_type === 'weekly') {
            basicPay = employee.salary_amount * 4;
          } else if (employee.salary_type === 'monthly') {
            basicPay = employee.salary_amount;
          }
        }
      }
      
      // Calculate overtime pay
      const overtimeTotal = await db('overtime')
        .where({ employee_id: employee.id })
        .whereBetween('date', [period_start, period_end])
        .sum('total_amount as total')
        .first();
      
      const overtimePay = parseFloat(overtimeTotal.total) || 0;
      
      // Calculate total earnings
      const totalEarnings = basicPay + overtimePay;
      
      // Get active advance amount
      const advanceBalance = await db('advances')
        .where({ employee_id: employee.id })
        .where('balance_remaining', '>', 0)
        .sum('balance_remaining as total')
        .first();
      
      const activeAdvanceAmount = parseFloat(advanceBalance.total) || 0;
      
      // Default custom advance deduction from request
      const customAdvanceDeduction = parseFloat(custom_advance_deduction) || 0;
      
      // Calculate final net salary
      const finalNetSalary = basicPay + overtimePay - customAdvanceDeduction;
      
      console.log('Payroll calculation:', {
        basicPay,
        overtimePay,
        totalEarnings,
        activeAdvanceAmount,
        customAdvanceDeduction,
        finalNetSalary
      });
      
      const [payrollRecord] = await db('payroll').insert({
        employee_id: employee.id,
        period_start,
        period_end,
        period_type,
        base_salary: basicPay,
        attendance_deduction: 0,
        overtime_amount: overtimePay,
        advance_deduction: customAdvanceDeduction,
        total_deductions: customAdvanceDeduction,
        net_salary: finalNetSalary,
        status: 'pending',
        processed_by: mockBusinessId,
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
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Server error generating payroll' });
  }
});

// Update payroll record (for advance deduction)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { advance_deduction, net_salary } = req.body;
    
    // Verify payroll belongs to this business
    const payroll = await db('payroll')
      .join('employees', 'payroll.employee_id', 'employees.id')
      .where({
        'payroll.id': id,
        'employees.business_id': mockBusinessId
      })
      .first();
    
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    await db('payroll')
      .where({ id })
      .update({
        advance_deduction: advance_deduction,
        net_salary: net_salary
      });
    
    res.json({ message: 'Payroll updated successfully' });
  } catch (error) {
    console.error('Update payroll error:', error);
    res.status(500).json({ message: 'Server error updating payroll' });
  }
});

// Update advance records based on payroll deduction
router.put('/:id/update-advances', async (req, res) => {
  try {
    const { id } = req.params;
    const { advance_deduction } = req.body;
    
    // Verify payroll belongs to this business
    const payroll = await db('payroll')
      .join('employees', 'payroll.employee_id', 'employees.id')
      .where({
        'payroll.id': id,
        'employees.business_id': mockBusinessId
      })
      .select('payroll.employee_id', 'payroll.advance_deduction')
      .first();
    
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    if (advance_deduction > 0) {
      // Get employee's active advances
      const advances = await db('advances')
        .where({ employee_id: payroll.employee_id })
        .where('balance_remaining', '>', 0)
        .orderBy('date', 'asc');
      
      let remainingDeduction = parseFloat(advance_deduction);
      
      for (const advance of advances) {
        if (remainingDeduction <= 0) break;
        
        const deduction = Math.min(remainingDeduction, advance.balance_remaining);
        await db('advances')
          .where({ id: advance.id })
          .update({ 
            balance_remaining: advance.balance_remaining - deduction
          });
        
        remainingDeduction -= deduction;
      }
    }
    
    res.json({ message: 'Advance records updated successfully' });
  } catch (error) {
    console.error('Update advance records error:', error);
    res.status(500).json({ message: 'Server error updating advance records' });
  }
});

// Delete payroll record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify payroll belongs to this business
    const payroll = await db('payroll')
      .join('employees', 'payroll.employee_id', 'employees.id')
      .where({
        'payroll.id': id,
        'employees.business_id': mockBusinessId
      })
      .first();
    
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    await db('payroll').where({ id }).del();
    
    res.json({ message: 'Payroll record deleted successfully' });
  } catch (error) {
    console.error('Delete payroll error:', error);
    res.status(500).json({ message: 'Server error deleting payroll' });
  }
});

module.exports = router;
