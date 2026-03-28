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

// GET alert by ID
router.get('/:id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            `SELECT a.AlertID, a.Severity, a.Description, a.PacketID, a.CreatedAt,
                    t.SatelliteID, s.Name as SatelliteName
             FROM Alerts a
             LEFT JOIN TelemetryPackets t ON a.PacketID = t.PacketID
             LEFT JOIN Satellites s ON t.SatelliteID = s.SatelliteID
             WHERE a.AlertID = ?`,
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching alert:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// POST new alert
router.post('/', async (req, res) => {
    let connection;
    try {
        const { severity, description, packetId } = req.body;
        
        if (!severity || !description) {
            return res.status(400).json({ error: 'Severity and description are required' });
        }
        
        if (!['High', 'Medium', 'Low'].includes(severity)) {
            return res.status(400).json({ error: 'Invalid severity. Must be High, Medium, or Low' });
        }
        
        connection = await getConnection();
        const [result] = await connection.execute(
            `INSERT INTO Alerts (Severity, Description, PacketID) VALUES (?, ?, ?)`,
            [severity, description, packetId || null]
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

// GET alerts by severity
router.get('/severity/:severity', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            `SELECT a.AlertID, a.Severity, a.Description, a.PacketID, a.CreatedAt,
                    t.SatelliteID, s.Name as SatelliteName
             FROM Alerts a
             LEFT JOIN TelemetryPackets t ON a.PacketID = t.PacketID
             LEFT JOIN Satellites s ON t.SatelliteID = s.SatelliteID
             WHERE a.Severity = ?
             ORDER BY a.CreatedAt DESC`,
            [req.params.severity]
        );
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching alerts by severity:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;