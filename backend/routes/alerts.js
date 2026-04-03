const express = require('express');
const router = express.Router();
const { getConnection } = require('../db-config');

// GET all alerts
router.get('/', async (req, res) => {
    let connection;
    try {
        let query = `
            SELECT a.AlertID, a.Severity, a.Description, a.PacketID, a.CreatedAt,
                   t.SatelliteID, s.Name as SatelliteName
            FROM Alerts a
            LEFT JOIN TelemetryPackets t ON a.PacketID = t.PacketID
            LEFT JOIN Satellites s ON t.SatelliteID = s.SatelliteID
            WHERE 1=1
        `;
        const params = [];
        
        if (req.query.severity) {
            query += ` AND a.Severity = ?`;
            params.push(req.query.severity);
        }
        
        query += ` ORDER BY a.CreatedAt DESC`;
        
        connection = await getConnection();
        const [rows] = await connection.execute(query, params);
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching alerts:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// POST new alert (MANUAL creation)
router.post('/', async (req, res) => {
    let connection;
    try {
        const { severity, description, packetId, satelliteId } = req.body;
        
        if (!severity || !description) {
            return res.status(400).json({ error: 'Severity and description are required' });
        }
        
        if (!['High', 'Medium', 'Low'].includes(severity)) {
            return res.status(400).json({ error: 'Invalid severity. Must be High, Medium, or Low' });
        }
        
        connection = await getConnection();
        
        // If satelliteId is provided, create a more descriptive alert
        let finalDescription = description;
        if (satelliteId) {
            const [satellite] = await connection.execute(
                'SELECT Name FROM Satellites WHERE SatelliteID = ?',
                [satelliteId]
            );
            if (satellite.length > 0) {
                finalDescription = `[${satellite[0].Name}] ${description}`;
            }
        }
        
        const [result] = await connection.execute(
            `INSERT INTO Alerts (Severity, Description, PacketID, CreatedAt) 
             VALUES (?, ?, ?, NOW())`,
            [severity, finalDescription, packetId || null]
        );
        
        res.status(201).json({ 
            message: 'Alert created successfully',
            alertId: result.insertId 
        });
    } catch (err) {
        console.error('Error creating alert:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// AUTO-GENERATE alerts based on satellite conditions
router.post('/auto-generate/:satelliteId', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        // Get satellite details
        const [satellites] = await connection.execute(
            'SELECT * FROM Satellites WHERE SatelliteID = ?',
            [req.params.satelliteId]
        );
        
        if (satellites.length === 0) {
            return res.status(404).json({ error: 'Satellite not found' });
        }
        
        const satellite = satellites[0];
        const alerts = [];
        
        // BUSINESS RULES FOR AUTOMATIC ALERTS
        
        // Rule 1: Check satellite status
        if (satellite.Status === 'Inactive') {
            alerts.push({
                severity: 'High',
                description: `⚠️ CRITICAL: Satellite ${satellite.Name} is INACTIVE - Immediate action required`
            });
        }
        
        // Rule 2: Check for maintenance mode
        if (satellite.Status === 'Maintenance') {
            alerts.push({
                severity: 'Medium',
                description: `🔧 Satellite ${satellite.Name} is in MAINTENANCE mode - Limited functionality`
            });
        }
        
        // Rule 3: Check satellite age
        if (satellite.LaunchDate) {
            const launchYear = new Date(satellite.LaunchDate).getFullYear();
            const currentYear = new Date().getFullYear();
            const age = currentYear - launchYear;
            
            if (age > 10) {
                alerts.push({
                    severity: 'High',
                    description: `⚠️ Satellite ${satellite.Name} is ${age} years old - Exceeds operational life expectancy`
                });
            } else if (age > 5) {
                alerts.push({
                    severity: 'Medium',
                    description: `📡 Satellite ${satellite.Name} is ${age} years old - Consider preventive maintenance`
                });
            }
        }
        
        // Rule 4: Check orbit type specific issues
        if (satellite.OrbitType === 'GEO' && satellite.Status === 'Active') {
            alerts.push({
                severity: 'Low',
                description: `🛰️ GEO Satellite ${satellite.Name} - Routine station-keeping check recommended`
            });
        }
        
        // Rule 5: Check for duplicate alerts (avoid spam)
        const createdAlerts = [];
        for (const alert of alerts) {
            // Check if similar alert already exists in last 24 hours
            const [existing] = await connection.execute(
                `SELECT AlertID FROM Alerts 
                 WHERE Description LIKE ? 
                 AND CreatedAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
                [`%${satellite.Name}%`]
            );
            
            if (existing.length === 0) {
                const [result] = await connection.execute(
                    `INSERT INTO Alerts (Severity, Description, PacketID, CreatedAt) 
                     VALUES (?, ?, NULL, NOW())`,
                    [alert.severity, alert.description]
                );
                createdAlerts.push({ id: result.insertId, ...alert });
            }
        }
        
        res.json({
            message: `Generated ${createdAlerts.length} alerts for ${satellite.Name}`,
            alerts: createdAlerts
        });
        
    } catch (err) {
        console.error('Error auto-generating alerts:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// BATCH AUTO-GENERATE for all satellites
router.post('/auto-generate-all', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        // Get all satellites
        const [satellites] = await connection.execute('SELECT SatelliteID FROM Satellites');
        
        const results = [];
        for (const sat of satellites) {
            // Call the auto-generate for each satellite
            const response = await fetch(`http://localhost:3000/api/alerts/auto-generate/${sat.SatelliteID}`, {
                method: 'POST'
            });
            const data = await response.json();
            results.push(data);
        }
        
        res.json({
            message: `Processed ${satellites.length} satellites`,
            details: results
        });
        
    } catch (err) {
        console.error('Error batch generating alerts:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// DELETE alert
router.delete('/:id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.execute(
            'DELETE FROM Alerts WHERE AlertID = ?',
            [req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        
        res.json({ message: 'Alert deleted successfully' });
    } catch (err) {
        console.error('Error deleting alert:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;