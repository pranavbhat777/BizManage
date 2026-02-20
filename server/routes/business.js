const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// For now, use a mock business ID since we're removing auth
const mockBusinessId = 1;

// Get business profile
router.get('/profile', async (req, res) => {
  try {
    const business = await db('businesses')
      .where({ id: mockBusinessId })
      .first();
    
    delete business.password;
    
    res.json(business);
  } catch (error) {
    console.error('Get business profile error:', error);
    res.status(500).json({ message: 'Server error fetching business profile' });
  }
});

// Update business profile
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  body('standard_working_hours').optional().isInt({ min: 1, max: 24 }),
  body('week_start_day').optional().isInt({ min: 1, max: 7 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const allowedFields = [
      'name', 'email', 'phone', 'address', 'logo_url',
      'working_days', 'standard_working_hours', 'week_start_day',
      'holidays', 'overtime_rates'
    ];
    
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const [updatedBusiness] = await db('businesses')
      .where({ id: mockBusinessId })
      .update(updateData)
      .returning('*');
    
    delete updatedBusiness.password;
    
    res.json({
      message: 'Business profile updated successfully',
      business: updatedBusiness
    });
  } catch (error) {
    console.error('Update business profile error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error updating business profile' });
  }
});

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    
    const [
      totalEmployees,
      todayAttendance,
      weeklyPayroll,
      monthlyPayroll,
      advanceSummary
    ] = await Promise.all([
      // Total employees
      db('employees')
        .where({ business_id: mockBusinessId, active: true })
        .count('* as count')
        .first(),
      
      // Today's attendance overview
      db('attendance')
        .join('employees', 'attendance.employee_id', 'employees.id')
        .select(
          'attendance.status',
          db.raw('COUNT(*) as count')
        )
        .where('employees.business_id', mockBusinessId)
        .where('attendance.date', today)
        .groupBy('attendance.status'),
      
      // Weekly payroll summary
      db('payroll')
        .join('employees', 'payroll.employee_id', 'employees.id')
        .where('employees.business_id', mockBusinessId)
        .where('payroll.period_start', '>=', startOfWeek.toISOString().split('T')[0])
        .select(
          db.raw('SUM(net_salary) as total_amount'),
          db.raw("SUM(CASE WHEN status = 'pending' THEN net_salary ELSE 0 END) as pending"),
          db.raw("SUM(CASE WHEN status = 'paid' THEN net_salary ELSE 0 END) as paid")
        )
        .first(),
      
      // Monthly payroll summary
      db('payroll')
        .join('employees', 'payroll.employee_id', 'employees.id')
        .where('employees.business_id', mockBusinessId)
        .where('payroll.period_start', '>=', startOfMonth.toISOString().split('T')[0])
        .select(
          db.raw('SUM(net_salary) as total_amount'),
          db.raw("SUM(CASE WHEN status = 'pending' THEN net_salary ELSE 0 END) as pending"),
          db.raw("SUM(CASE WHEN status = 'paid' THEN net_salary ELSE 0 END) as paid")
        )
        .first(),
      
      // Advance summary
      db('advances')
        .join('employees', 'advances.employee_id', 'employees.id')
        .where('employees.business_id', mockBusinessId)
        .where('advances.balance_remaining', '>', 0)
        .select(
          db.raw('SUM(advances.balance_remaining) as total_outstanding'),
          db.raw('COUNT(*) as advance_count')
        )
        .first()
    ]);
    
    // Process today's attendance
    const attendanceOverview = {
      present: 0,
      absent: 0,
      half_day: 0,
      not_marked: parseInt(totalEmployees.count)
    };
    
    todayAttendance.forEach(record => {
      console.log('Processing today attendance record:', record); // Debug log
      attendanceOverview[record.status] = parseInt(record.count);
      attendanceOverview.not_marked -= parseInt(record.count);
      
      // Count half_day as present for daily present count
      if (record.status === 'half_day') {
        console.log('Adding half_day to present count:', record.count); // Debug log
        attendanceOverview.present += parseInt(record.count);
      }
    });
    
    console.log('Final attendance overview:', attendanceOverview); // Debug log
    
    res.json({
      total_employees: parseInt(totalEmployees.count),
      today_attendance: attendanceOverview,
      weekly_payroll: {
        total_amount: parseFloat(weeklyPayroll.total_amount) || 0,
        pending: parseFloat(weeklyPayroll.pending) || 0,
        paid: parseFloat(weeklyPayroll.paid) || 0
      },
      monthly_payroll: {
        total_amount: parseFloat(monthlyPayroll.total_amount) || 0,
        pending: parseFloat(monthlyPayroll.pending) || 0,
        paid: parseFloat(monthlyPayroll.paid) || 0
      },
      advances: {
        total_outstanding: parseFloat(advanceSummary.total_outstanding) || 0,
        advance_count: parseInt(advanceSummary.advance_count) || 0
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard statistics' });
  }
});

// Get recent activities
router.get('/activities', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Simplified approach - get activities separately and combine
    const [attendance, advances, overtime] = await Promise.all([
      db.raw(`
        SELECT 
          'attendance' as type,
          attendance.date,
          attendance.status,
          employees.first_name || ' ' || employees.last_name as employee_name,
          employees.employee_code,
          attendance.notes,
          attendance.marked_at as created_at
        FROM attendance
        JOIN employees ON attendance.employee_id = employees.id
        WHERE employees.business_id = ?
        ORDER BY attendance.marked_at DESC
        LIMIT ?
      `, [mockBusinessId, limit]),
      
      db.raw(`
        SELECT 
          'advance' as type,
          advances.date,
          CAST(advances.amount AS TEXT) as status,
          employees.first_name || ' ' || employees.last_name as employee_name,
          employees.employee_code,
          advances.notes,
          advances.recorded_at as created_at
        FROM advances
        JOIN employees ON advances.employee_id = employees.id
        WHERE employees.business_id = ?
        ORDER BY advances.recorded_at DESC
        LIMIT ?
      `, [mockBusinessId, limit]),
      
      db.raw(`
        SELECT 
          'overtime' as type,
          overtime.date,
          CAST(overtime.hours AS TEXT) || ' hours' as status,
          employees.first_name || ' ' || employees.last_name as employee_name,
          employees.employee_code,
          overtime.notes,
          overtime.approved_at as created_at
        FROM overtime
        JOIN employees ON overtime.employee_id = employees.id
        WHERE employees.business_id = ?
        ORDER BY overtime.approved_at DESC
        LIMIT ?
      `, [mockBusinessId, limit])
    ]);
    
    // Combine all activities
    const allActivities = [
      ...attendance.rows || [],
      ...advances.rows || [],
      ...overtime.rows || []
    ];
    
    // Sort by created_at and limit
    const activities = allActivities
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);
    
    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Server error fetching activities' });
  }
});

// Get weekly attendance report
router.get('/weekly-attendance', async (req, res) => {
  try {
    const { week_start } = req.query;
    
    // Default to current week if not provided
    const today = new Date();
    const currentWeekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekStartDate = week_start ? new Date(week_start) : currentWeekStart;
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6); // Add 6 days to get week end
    
    // Get all employees
    const employees = await db('employees')
      .where({ business_id: mockBusinessId, active: true })
      .select('id', 'first_name', 'last_name');
    
    const weeklyReport = [];
    
    for (const employee of employees) {
      // Get attendance for this week
      const attendance = await db('attendance')
        .where({ employee_id: employee.id })
        .whereBetween('date', [
          weekStartDate.toISOString().split('T')[0],
          weekEndDate.toISOString().split('T')[0]
        ])
        .select('status', 'date');
      
      let presentDays = 0;
      let absentDays = 0;
      let halfDays = 0;
      
      attendance.forEach(record => {
        switch (record.status) {
          case 'present':
            presentDays++;
            break;
          case 'absent':
            absentDays++;
            break;
          case 'half_day':
            halfDays++;
            break;
        }
      });
      
      // Calculate working days (exclude weekends if needed)
      const totalWorkingDays = 6; // Monday to Saturday
      const notMarkedDays = totalWorkingDays - (presentDays + absentDays + halfDays);
      const workingDays = totalWorkingDays - notMarkedDays; // 7 - not_marked as requested
      
      weeklyReport.push({
        employee_id: employee.id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        present_days: presentDays,
        absent_days: absentDays,
        half_days: halfDays,
        working_days: workingDays, // Add working days field
        total_days: presentDays + absentDays + halfDays,
        attendance_percentage: workingDays > 0 ? ((presentDays + halfDays * 0.5) / workingDays * 100).toFixed(1) : 0
      });
    }
    
    res.json({
      week_start: weekStartDate.toISOString().split('T')[0],
      week_end: weekEndDate.toISOString().split('T')[0],
      employees: weeklyReport
    });
  } catch (error) {
    console.error('Get weekly attendance report error:', error);
    res.status(500).json({ message: 'Server error fetching weekly attendance report' });
  }
});

// Update business settings
router.put('/settings', [
  body('working_days').isArray().withMessage('Working days must be an array'),
  body('standard_working_hours').isInt({ min: 1, max: 24 }),
  body('week_start_day').isInt({ min: 1, max: 7 }),
  body('overtime_rates').isObject().withMessage('Overtime rates must be an object'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { working_days, standard_working_hours, week_start_day, overtime_rates, holidays } = req.body;
    
    const [updatedBusiness] = await db('businesses')
      .where({ id: mockBusinessId })
      .update({
        working_days,
        standard_working_hours,
        week_start_day,
        overtime_rates,
        holidays: holidays || []
      })
      .returning('*');
    
    delete updatedBusiness.password;
    
    res.json({
      message: 'Business settings updated successfully',
      business: updatedBusiness
    });
  } catch (error) {
    console.error('Update business settings error:', error);
    res.status(500).json({ message: 'Server error updating business settings' });
  }
});

// Change password
router.put('/password', [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { current_password, new_password } = req.body;
    
    // Get current business with password
    const business = await db('businesses')
      .where({ id: mockBusinessId })
      .first();
    
    // Verify current password
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(current_password, business.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);
    
    // Update password
    await db('businesses')
      .where({ id: mockBusinessId })
      .update({ password: hashedPassword });
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error changing password' });
  }
});

module.exports = router;
