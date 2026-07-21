const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:8080',
        'https://connect.vemgootech.info',
        'https://api.vemgootech.info'
    ],
    credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Backend server is running',
        oauth2_test: 'ready'
    });
});

// OAuth2 Test endpoint
app.get('/api/test/oauth2', (req, res) => {
    const { code, state } = req.query;
    
    if (code) {
        res.json({
            success: true,
            message: 'OAuth2 authorization code received',
            code: code.substring(0, 10) + '...', // Partial code for security
            state: state,
            timestamp: new Date().toISOString()
        });
    } else {
        res.json({
            success: false,
            message: 'No OAuth2 code provided',
            query: req.query,
            timestamp: new Date().toISOString()
        });
    }
});

// Mautic OAuth2 callback endpoint
app.get('/api/auth/mautic/callback', async (req, res) => {
    try {
        const { code, state, error, error_description } = req.query;
        
        console.log('📞 Mautic OAuth2 Callback received:', {
            code: code ? code.substring(0, 10) + '...' : 'none',
            state,
            error,
            error_description
        });

        if (error) {
            const redirectUrl = `https://connect.vemgootech.info/oauth2-test.html?mautic_error=true&message=${encodeURIComponent(error_description || error)}`;
            return res.redirect(redirectUrl);
        }

        if (!code) {
            const redirectUrl = `https://connect.vemgootech.info/oauth2-test.html?mautic_error=true&message=${encodeURIComponent('No authorization code received')}`;
            return res.redirect(redirectUrl);
        }

        // In a real implementation, we would exchange the code for tokens here
        // For testing, we'll just redirect with success
        const redirectUrl = `https://connect.vemgootech.info/oauth2-test.html?mautic_success=true&message=${encodeURIComponent('OAuth2 authorization successful!')}`;
        res.redirect(redirectUrl);

    } catch (error) {
        console.error('❌ OAuth2 callback error:', error);
        const redirectUrl = `https://connect.vemgootech.info/oauth2-test.html?mautic_error=true&message=${encodeURIComponent('Server error during OAuth2 callback')}`;
        res.redirect(redirectUrl);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 OAuth2 Test Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 OAuth2 callback: http://localhost:${PORT}/api/auth/mautic/callback`);
    console.log(`🌐 Test page: oauth2-test.html`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log('❌ Unhandled Promise Rejection:', err.message);
});