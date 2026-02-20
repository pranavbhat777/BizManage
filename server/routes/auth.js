const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Register business
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Business name must be at least 2 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone(),
], async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, password, phone, address } = req.body;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create business
    const [business] = await db('businesses').insert({
      name,
      password: hashedPassword,
      phone,
      address,
      working_days: [1, 2, 3, 4, 5], // Monday to Friday
      standard_working_hours: 8,
      week_start_day: 1, // Monday
      holidays: [],
      overtime_rates: { normal: 1.5, holiday: 2.0 }
    }).returning('*');

    // Create JWT token
    const token = jwt.sign(
      { id: business.id, name: business.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Remove password from response
    delete business.password;

    res.status(201).json({
      message: 'Business registered successfully',
      business,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login business
router.post('/login', [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password } = req.body;

    // Find business by phone (unique identifier)
    const business = await db('businesses').where({ phone, active: true }).first();
    if (!business) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, business.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: business.id, name: business.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Remove password from response
    delete business.password;

    res.status(200).json({
      message: 'Login successful',
      business,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current business profile
router.get('/profile', async (req, res) => {
  try {
    // For now, return a mock profile since we're removing auth
    const business = {
      id: 1,
      name: 'Test Business',
      email: 'test@business.com',
      phone: '+1234567890',
      address: 'Test Address'
    };
    
    res.json(business);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

module.exports = router;
