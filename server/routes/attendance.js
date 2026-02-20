const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const moment = require('moment');

const router = express.Router();

// For now, use a mock business ID since we're removing auth
const mockBusinessId = 1;

// Get attendance for a date range
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, employee_id } = req.query;
    
    let query = db('attendance')
      .join('employees', 'attendance.employee_id', 'employees.id')
      .select(
        'attendance.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code'
      )
      .where('employees.business_id', mockBusinessId);
    
    if (start_date && end_date) {
      query = query.whereBetween('attendance.date', [start_date, end_date]);
    }
    
    if (employee_id) {
      query = query.where('attendance.employee_id', employee_id);
    }
    
    const attendance = await query.orderBy('attendance.date', 'desc');
    
    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
});

// Mark attendance for multiple employees
router.post('/', [
  body('date').isISO8601().withMessage('Valid date required'),
  body('attendance').isArray().withMessage('Attendance array required'),
  body('attendance.*.employee_id').isUUID().withMessage('Valid employee ID required'),
  body('attendance.*.status').isIn(['present', 'absent', 'half_day']).withMessage('Invalid attendance status'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, attendance } = req.body;
    
    // Validate that date is not in the past (allow same day editing)
    const attendanceDate = moment(date);
    const today = moment().startOf('day');
    
    if (attendanceDate.isBefore(today, 'day')) {
      return res.status(400).json({ message: 'Cannot mark attendance for past dates' });
    }
    
    // Validate that all employees belong to this business
    const employeeIds = attendance.map(a => a.employee_id);
    const employees = await db('employees')
      .where({ business_id: mockBusinessId, active: true })
      .whereIn('id', employeeIds);
    
    if (employees.length !== employeeIds.length) {
      return res.status(400).json({ message: 'Invalid employee IDs' });
    }
    
    // Process attendance records
    const results = [];
    for (const attendanceRecord of attendance) {
      const [record] = await db('attendance')
        .insert({
          employee_id: attendanceRecord.employee_id,
          date: attendanceDate.format('YYYY-MM-DD'),
          status: attendanceRecord.status,
          notes: attendanceRecord.notes,
          marked_by: mockBusinessId
        })
        .onConflict(['employee_id', 'date'])
        .merge({
          status: attendanceRecord.status,
          notes: attendanceRecord.notes,
          marked_by: mockBusinessId
        })
        .returning('*');
      
      results.push(record);
    }
    
    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance: results
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Server error marking attendance' });
  }
});

// Get attendance summary for a period
router.get('/summary', async (req, res) => {
  try {
    const { start_date, end_date, employee_id } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Start date and end date required' });
    }
    
    // Calculate total days in the period
    const startDate = moment(start_date);
    const endDate = moment(end_date);
    const totalDays = endDate.diff(startDate, 'days') + 1;
    
    let query = db('attendance')
      .join('employees', 'attendance.employee_id', 'employees.id')
      .select(
        'employees.id',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        db.raw('COUNT(*) as marked_days'),
        db.raw("SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days"),
        db.raw("SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days"),
        db.raw("SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as half_days")
      )
      .where('employees.business_id', mockBusinessId)
      .whereBetween('attendance.date', [start_date, end_date])
      .groupBy('employees.id', 'employees.first_name', 'employees.last_name', 'employees.employee_code');
    
    if (employee_id) {
      query = query.where('employees.id', employee_id);
    }
    
    const summary = await query;
    
    // Calculate attendance percentage and not marked days
    const summaryWithCalculations = summary.map(record => {
      const notMarkedDays = totalDays - record.marked_days;
      const totalWorkingDays = record.present_days + record.absent_days + record.half_days;
      const attendancePercentage = totalWorkingDays > 0 
        ? ((record.present_days + record.half_days * 0.5) / totalWorkingDays * 100).toFixed(2)
        : 0;
      
      const result = {
        ...record,
        total_days: totalDays,
        not_marked_days: notMarkedDays,
        working_days: totalDays - notMarkedDays, // This is what you requested: 7 - not_marked
        attendance_percentage: parseFloat(attendancePercentage)
      };
      
      console.log('Attendance record:', result); // Debug log
      return result;
    });
    
    res.json(summaryWithCalculations);
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ message: 'Server error fetching attendance summary' });
  }
});

// Get today's attendance overview
router.get('/today', async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    
    const [totalEmployees, todayAttendance] = await Promise.all([
      db('employees')
        .where({ business_id: mockBusinessId, active: true })
        .count('* as count')
        .first(),
      
      db('attendance')
        .join('employees', 'attendance.employee_id', 'employees.id')
        .select(
          'attendance.status',
          db.raw('COUNT(*) as count')
        )
        .where('employees.business_id', mockBusinessId)
        .where('attendance.date', today)
        .groupBy('attendance.status')
    ]);
    
    const attendanceOverview = {
      total_employees: parseInt(totalEmployees.count),
      present: 0,
      absent: 0,
      half_day: 0,
      not_marked: parseInt(totalEmployees.count)
    };
    
    todayAttendance.forEach(record => {
      attendanceOverview[record.status] = parseInt(record.count);
      attendanceOverview.not_marked -= parseInt(record.count);
    });
    
    res.json(attendanceOverview);
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ message: 'Server error fetching today\'s attendance' });
  }
});

module.exports = router;
