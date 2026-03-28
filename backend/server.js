const express = require('express');
const cors = require('cors');
 // Add this after app initialization
const { testConnection, getConnection } = require('./db-config');

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
        endpoints: {
            satellites: 'GET/POST/PUT/DELETE /api/satellites',
            operators: 'GET/POST /api/operators',
            groundStations: 'GET/POST /api/ground-stations',
            sensors: 'GET/POST /api/sensors',
            telemetry: 'GET /api/telemetry',
            readings: 'GET /api/readings',
            alerts: 'GET/POST /api/alerts',
            assignments: 'GET/POST /api/assignments'
        }
    });
});

app.post("/api/query", async (req, res) => {
    // try {
    //     const query = req.body.query;

    //     const [rows] = await connection.query(query);

    //     res.json(rows);
    // } catch (err) {
    //     res.status(500).json({ error: err.message });
    // }
    let connection;
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
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
        res.status(404).json({ error: 'Endpoint not found' });
    });

// Start server
app.listen(PORT, async () => {
    console.log('\n========================================');
    console.log('🚀 Satellite Monitoring System Server');
    console.log('========================================');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    console.log('========================================\n');
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.log('\n⚠️  Server started but database connection failed!');
        console.log('   Please fix database configuration in db-config.js\n');
    } else {
        console.log('\n✅ System ready! You can now use the frontend.\n');
    }
    

    // app.post("/api/query", async (req, res) => {
    // try {
    //     const query = req.body.query;

    //     const [rows] = await connection.query(query); // ✅ correct

    //     res.json(rows);
    // } catch (err) {
    //     res.status(500).json({ error: err.message });
    // }
    // });
    app.use(express.json());
    
});

