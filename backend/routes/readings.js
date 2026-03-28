const express = require('express');
const router = express.Router();
const { getConnection } = require('../db-config');

// GET all sensor readings with filters
router.get('/', async (req, res) => {
    let connection;
    try {
        let query = `
            SELECT r.PacketID, r.ReadingNo, r.SensorID, r.Timestamp, 
                   r.Value, r.Unit, s.Type as SensorType,
                   t.SatelliteID
            FROM SensorReadings r
            LEFT JOIN Sensors s ON r.SensorID = s.SensorID
            LEFT JOIN TelemetryPackets t ON r.PacketID = t.PacketID
            WHERE 1=1
        `;
        const params = [];
        
        if (req.query.sensorId) {
            query += ` AND r.SensorID = ?`;
            params.push(req.query.sensorId);
        }
        
        if (req.query.packetId) {
            query += ` AND r.PacketID = ?`;
            params.push(req.query.packetId);
        }
        
        query += ` ORDER BY r.Timestamp DESC`;
        
        connection = await getConnection();
        const [rows] = await connection.execute(query, params);
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching sensor readings:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// GET readings by packet ID
router.get('/packet/:packetId', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            `SELECT r.PacketID, r.ReadingNo, r.SensorID, r.Timestamp, 
                    r.Value, r.Unit, s.Type as SensorType
             FROM SensorReadings r
             LEFT JOIN Sensors s ON r.SensorID = s.SensorID
             WHERE r.PacketID = ?
             ORDER BY r.ReadingNo`,
            [req.params.packetId]
        );
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching readings by packet:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// POST new sensor reading
router.post('/', async (req, res) => {
    let connection;
    try {
        const { packetId, readingNo, sensorId, timestamp, value, unit } = req.body;
        
        if (!packetId || !readingNo || !sensorId) {
            return res.status(400).json({ error: 'PacketID, ReadingNo, and SensorID are required' });
        }
        
        connection = await getConnection();
        const [result] = await connection.execute(
            `INSERT INTO SensorReadings (PacketID, ReadingNo, SensorID, Timestamp, Value, Unit) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [packetId, readingNo, sensorId, timestamp || new Date(), value || null, unit || null]
        );
        
        res.status(201).json({ 
            message: 'Sensor reading created successfully',
            affectedRows: result.affectedRows
        });
    } catch (err) {
        console.error('Error creating sensor reading:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// GET latest readings for each sensor
router.get('/latest', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(`
            SELECT r1.*, s.Type as SensorType
            FROM SensorReadings r1
            INNER JOIN (
                SELECT SensorID, MAX(Timestamp) as MaxTimestamp
                FROM SensorReadings
                GROUP BY SensorID
            ) r2 ON r1.SensorID = r2.SensorID AND r1.Timestamp = r2.MaxTimestamp
            LEFT JOIN Sensors s ON r1.SensorID = s.SensorID
            ORDER BY r1.Timestamp DESC
        `);
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching latest readings:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;