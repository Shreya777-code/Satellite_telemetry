const express = require('express');
const cors = require('cors');
const { testConnection, getConnection } = require('./db-config');
// Start automatic monitoring service
require('./monitoring-service');

// Import all route handlers
const satellitesRoutes = require('./routes/satellites');
const operatorsRoutes = require('./routes/operators');
const groundStationsRoutes = require('./routes/groundStations');
const sensorsRoutes = require('./routes/sensors');
const telemetryRoutes = require('./routes/telemetry');
const readingsRoutes = require('./routes/readings');
const alertsRoutes = require('./routes/alerts');
const assignmentsRoutes = require('./routes/assignments');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/satellites', satellitesRoutes);
app.use('/api/operators', operatorsRoutes);
app.use('/api/ground-stations', groundStationsRoutes);
app.use('/api/sensors', sensorsRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/assignments', assignmentsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Satellite Monitoring System API is running',
        version: '1.0.0',
        database: 'MySQL',
        timestamp: new Date().toISOString()
    });
});

// SQL Query endpoint
app.post('/api/query', async (req, res) => {
    let connection;
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        
        // Security: Only allow SELECT queries for safety
        const upperQuery = query.trim().toUpperCase();
        if (!upperQuery.startsWith('SELECT')) {
            return res.status(400).json({ error: 'Only SELECT queries are allowed for security' });
        }
        
        connection = await getConnection();
        const [rows] = await connection.execute(query);
        res.json(rows);
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.url}` });
});
// Manual health check endpoint
app.post('/api/monitor/check', async (req, res) => {
    try {
        const { autoMonitorAndGenerateAlerts } = require('./monitoring-service');
        await autoMonitorAndGenerateAlerts();
        res.json({ message: 'Health check completed successfully' });
    } catch (err) {
        console.error('Health check error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log('\n========================================');
    console.log('🚀 Satellite Monitoring System Server');
    console.log('========================================');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Query endpoint: http://localhost:${PORT}/api/query`);
    console.log('========================================\n');
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.log('\n⚠️  Server started but database connection failed!');
        console.log('   Please check database configuration in db-config.js\n');
    } else {
        console.log('\n✅ System ready! You can now use the frontend.\n');
        console.log('Available endpoints:');
        console.log('  GET  /api/satellites');
        console.log('  POST /api/satellites');
        console.log('  GET  /api/alerts');
        console.log('  POST /api/query');
        console.log('  ... and more\n');
    }
});

