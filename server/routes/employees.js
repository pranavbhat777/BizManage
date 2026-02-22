const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Get all employees for a business
router.get('/', async (req, res) => {
  try {
    // For now, use a mock business ID since we're removing auth
    const mockBusinessId = 1;
    console.log('Employees API - Request received for business:', mockBusinessId);
    
    const employees = await db('employees')
      .where({ business_id: mockBusinessId, active: true })
      .orderBy('first_name');
    
    console.log('Fetched employees for business', mockBusinessId, ':', employees);
    console.log('Employees count:', employees.length);
    
    if (employees.length === 0) {
      console.log('No active employees found for business:', mockBusinessId);
    }
    
    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Server error fetching employees' });
  }
});

// Debug route - get all employees (including inactive)
router.get('/debug/all', async (req, res) => {
  try {
    // For now, use a mock business ID since we're removing auth
    const mockBusinessId = 1;
    
    const allEmployees = await db('employees')
      .where({ business_id: mockBusinessId })
      .orderBy('employee_code')
      .select('employee_code', 'first_name', 'last_name', 'active');
    
    console.log('Debug - ALL employees for business', mockBusinessId, ':', allEmployees);
    res.json(allEmployees);
  } catch (error) {
    console.error('Debug get employees error:', error);
    res.status(500).json({ message: 'Server error fetching employees' });
  }
});

// Debug route - check specific employee code
router.get('/debug/check/:code', async (req, res) => {
  try {
    // For now, use a mock business ID since we're removing auth
    const mockBusinessId = 1;
    
    const employee = await db('employees')
      .where({ 
        business_id: mockBusinessId,
        employee_code: req.params.code
      })
      .select('employee_code', 'first_name', 'last_name', 'active')
      .first();
    
    console.log('Debug - Checking employee code:', req.params.code, 'Result:', employee);
    res.json(employee);
  } catch (error) {
    console.error('Debug check employee error:', error);
    res.status(500).json({ message: 'Server error checking employee' });
  }
});

// Get single employee
router.get('/:id', async (req, res) => {
  try {
    // For now, use a mock business ID since we're removing auth
    const mockBusinessId = 1;
    
    const employee = await db('employees')
      .where({ 
        business_id: mockBusinessId,
        id: req.params.id
      })
      .first();
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Server error fetching employee' });
  }
});

// Create new employee
router.post('/', [
  body('first_name').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('last_name').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body('salary_type').isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid salary type'),
  body('salary_amount').isFloat({ min: 0 }).withMessage('Salary amount must be positive'),
  body('join_date').optional({ checkFalsy: true }).isISO8601().withMessage('Valid join date required'),
  body('employee_code').optional({ checkFalsy: true }).trim().isLength({ min: 2, max: 20 }).withMessage('Employee code must be 2-20 characters'),
], async (req, res) => {
  try {
    // For now, use a mock business ID since we're removing auth
    const mockBusinessId = 1;
    console.log('Employee creation request:', req.body);
    console.log('Business ID:', mockBusinessId);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const employeeCode = req.body.employee_code && req.body.employee_code.trim() 
    ? req.body.employee_code.trim() 
    : await generateEmployeeCode(mockBusinessId);
    console.log('Employee code to use:', employeeCode);
    
    // Check if employee code already exists (only if custom code provided)
    if (req.body.employee_code && req.body.employee_code.trim()) {
      const existingEmployee = await db('employees')
        .where({ 
          business_id: mockBusinessId, 
          employee_code: req.body.employee_code.trim() 
        })
        .first();
      
      if (existingEmployee) {
        return res.status(400).json({ 
          message: 'Employee code already exists. Please use a different code or leave empty to auto-generate.' 
        });
      }
    }
    
    const employeeData = {
      business_id: mockBusinessId,
      ...req.body,
      employee_code: employeeCode,
      active: true,
    };

    console.log('Employee data to insert:', employeeData);
    const [employee] = await db('employees').insert(employeeData).returning('*');
    console.log('Employee created:', employee);
    
    res.status(201).json({
      message: 'Employee created successfully',
      employee
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Server error creating employee: ' + error.message });
  }
});

// Update employee
router.put('/:id', [
  body('first_name').optional().trim().isLength({ min: 2 }),
  body('last_name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('salary_type').optional().isIn(['daily', 'weekly', 'monthly']),
  body('salary_amount').optional().isFloat({ min: 0 }),
  body('join_date').optional({ checkFalsy: true }).isISO8601().withMessage('Valid join date required'),
  body('employee_code').optional({ checkFalsy: true }).trim().isLength({ min: 2, max: 20 }).withMessage('Employee code must be 2-20 characters'),
], async (req, res) => {
  try {
    // For now, use a mock business ID since we're removing auth
    const mockBusinessId = 1;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const [employee] = await db('employees')
      .where({ 
        id: req.params.id, 
        business_id: mockBusinessId, 
        active: true 
      })
      .update(req.body)
      .returning('*');
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json({
      message: 'Employee updated successfully',
      employee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Server error updating employee' });
  }
});

// Delete employee (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    // For now, use a mock business ID since we're removing auth
    const mockBusinessId = 1;
    
    const [employee] = await db('employees')
      .where({ 
        id: req.params.id, 
        business_id: mockBusinessId, 
        active: true 
      })
      .update({ active: false })
      .returning('*');
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Server error deleting employee' });
  }
});

// Helper function to generate employee code
async function generateEmployeeCode(businessId) {
  const prefix = 'EMP';
  
  console.log('Generating employee code for business:', businessId);
  console.log('Business ID type:', typeof businessId);
  
  try {
    // Simple approach: use timestamp + random to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const uniqueCode = `${prefix}${timestamp}${randomSuffix}`;
    
    console.log('Generated unique employee code:', uniqueCode);
    
    // Double-check if this code exists (shouldn't with timestamp + random)
    const exists = await db('employees')
      .where({ 
        business_id: businessId, 
        employee_code: uniqueCode 
      })
      .first();
    
    if (exists) {
      // Extremely unlikely, but handle it
      console.log('Code already exists, generating another one');
      const fallbackTimestamp = Date.now().toString().slice(-6);
      const fallbackRandom = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      const fallbackCode = `${prefix}${fallbackTimestamp}${fallbackRandom}`;
      console.log('Using fallback code:', fallbackCode);
      return fallbackCode;
    }
    
    return uniqueCode;
  } catch (error) {
    console.error('Error generating employee code:', error);
    // Fallback to simple timestamp-based code
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `${prefix}${timestamp}${randomNum}`;
  }
}

module.exports = router;
