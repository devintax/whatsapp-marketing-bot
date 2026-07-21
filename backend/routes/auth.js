const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Register user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, businessProfile } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      email,
      password: hashedPassword,
      name,
      businessProfile
    });

    await user.save();

    // Generate JWT
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            businessProfile: user.businessProfile
          }
        });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check for user
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            businessProfile: user.businessProfile
          }
        });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get user profile (alias for /me)
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Mautic OAuth callback endpoint
router.get('/mautic/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      console.error('Mautic OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'https://connect.vemgootech.info'}/contacts?mautic_error=${encodeURIComponent(error)}`);
    }
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'https://connect.vemgootech.info'}/contacts?mautic_error=no_code`);
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(`${process.env.MAUTIC_BASE_URL || 'https://dfgbusiness.com/mautic'}/oauth/v2/token`, {
      grant_type: 'authorization_code',
      client_id: process.env.MAUTIC_CLIENT_ID,
      client_secret: process.env.MAUTIC_CLIENT_SECRET,
      redirect_uri: `${process.env.API_BASE_URL || 'https://connect.vemgootech.info/api'}/auth/mautic/callback`,
      code: code
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // Store tokens securely (you may want to associate with user session/state)
    console.log('Mautic OAuth successful:', {
      access_token: access_token.substring(0, 10) + '...',
      expires_in
    });

    // Redirect back to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'https://connect.vemgootech.info'}/contacts?mautic_success=true&connected=true`);
    
  } catch (error) {
    console.error('Mautic OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'https://connect.vemgootech.info'}/contacts?mautic_error=callback_failed`);
  }
});

// ALIAS: Mautic OAuth callback - redirect to actual handler in CRM routes
// This handles the existing Mautic OAuth app configuration at /api/auth/mautic/callback
router.get('/mautic/callback', async (req, res) => {
  console.log('🔄 Mautic OAuth callback received at /api/auth/mautic/callback');
  console.log('📍 Redirecting to /api/crm/mautic/callback handler...');
  
  // Forward the request to the actual CRM handler
  // Preserve all query parameters (code, state, etc.)
  const queryString = new URLSearchParams(req.query).toString();
  const redirectUrl = `/api/crm/mautic/callback?${queryString}`;
  
  console.log('🔗 Forwarding to:', redirectUrl);
  
  // Use internal redirect to the CRM handler
  res.redirect(redirectUrl);
});

module.exports = router;