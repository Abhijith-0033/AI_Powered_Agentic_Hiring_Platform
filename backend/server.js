import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import aiCoverLetterRoutes from './routes/aiCoverLetterRoutes.js';
import jobsRoutes from './routes/jobs.js';
import candidatesRoutes from './routes/candidates.js';
import applicationsRoutes from './routes/applications.js';
import dashboardRoutes from './routes/dashboard.js';
import aiRoutes from './routes/ai.js';
import companiesRoutes from './routes/companies.js';
import aiToolsRoutes from './routes/aiToolsRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import profileImageRoutes from './routes/profileImage.js';
import testRoutes from './routes/testRoutes.js';
import codingRoutes from './routes/codingRoutes.js';
import pool from './config/db.js'; // Initialize PostgreSQL connection
import dns from 'dns';

// Force IPv4 to avoid delay/timeouts with IPv6 on some networks
dns.setDefaultResultOrder('ipv4first');

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
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Serve static files (Uploaded PDFs)
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Initialize Passport
import passport from './config/passport.js';
app.use(passport.initialize());

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
app.use('/api/profile-image', profileImageRoutes);
app.use('/api', applicationsRoutes); // Flat structure for /api/jobs/:id/apply etc.
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/ai-tools', aiToolsRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/ai/cover-letter', aiCoverLetterRoutes);
import aiResumeRoutes from './routes/aiResumeRoutes.js';
app.use('/api/ai/resume', aiResumeRoutes);

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
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push({ name, address: iface.address });
            }
        }
    }

    console.log('');
    console.log('🚀 ============================================');
    console.log(`   AI Hiring Platform API Server`);
    console.log('   ============================================');
    console.log(`   🌐 Local:   http://localhost:${PORT}`);
    addresses.forEach(info => {
        console.log(`   📡 Network (${info.name}): http://${info.address}:${PORT}`);
    });
    console.log(`   📊 Health:  http://localhost:${PORT}/health`);
    console.log(`   💻 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log('   ============================================');
    console.log('');
});

export default app;
