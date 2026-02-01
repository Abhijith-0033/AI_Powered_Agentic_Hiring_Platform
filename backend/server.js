import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import jobsRoutes from './routes/jobs.js';
import candidatesRoutes from './routes/candidates.js';
import applicationsRoutes from './routes/applications.js';
import dashboardRoutes from './routes/dashboard.js';
import aiRoutes from './routes/ai.js';
import resumeRoutes from './routes/resumes.js';
import companiesRoutes from './routes/companies.js';
import pool from './config/db.js'; // Initialize PostgreSQL connection

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================

// CORS configuration - Allow requests from frontend
// In development, allow all origins for network access
// In production, restrict to specific FRONTEND_URL
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : true, // Allow all origins in development
    credentials: true
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// ============================================================
// ROUTES
// ============================================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'AI Hiring Platform API is running',
        timestamp: new Date().toISOString()
    });
});

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api', applicationsRoutes); // Flat structure for /api/jobs/:id/apply etc.
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/candidate', resumeRoutes);
app.use('/api/companies', companiesRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================================
// START SERVER
// ============================================================

import os from 'os';

app.listen(PORT, () => {
    // Get network interfaces
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (const k in interfaces) {
        for (const k2 in interfaces[k]) {
            const address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
            }
        }
    }

    console.log('');
    console.log('🚀 ============================================');
    console.log(`   AI Hiring Platform API Server`);
    console.log('   ============================================');
    console.log(`   🌐 Local:   http://localhost:${PORT}`);
    addresses.forEach(ip => {
        console.log(`   📡 Network: http://${ip}:${PORT}`);
    });
    console.log(`   📊 Health:  http://localhost:${PORT}/health`);
    console.log('   ============================================');
    console.log('');
});

export default app;
