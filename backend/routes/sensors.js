const express = require('express');
const router = express.Router();
const { getConnection } = require('../db-config');

// GET all sensors with satellite info
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            `SELECT s.SensorID, s.Type, s.SatelliteID, sat.Name as SatelliteName
             FROM Sensors s
             LEFT JOIN Satellites sat ON s.SatelliteID = sat.SatelliteID
             ORDER BY s.SensorID`
        );
        
        const sensors = rows.map(row => ({
            sensorId: row.SensorID,
            type: row.Type,
            satelliteId: row.SatelliteID,
            satelliteName: row.SatelliteName
        }));
        
        res.json(sensors);
    } catch (err) {
        console.error('Error fetching sensors:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// GET sensor by ID
router.get('/:id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            `SELECT s.SensorID, s.Type, s.SatelliteID, sat.Name as SatelliteName
             FROM Sensors s
             LEFT JOIN Satellites sat ON s.SatelliteID = sat.SatelliteID
             WHERE s.SensorID = ?`,
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Sensor not found' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching sensor:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// POST new sensor
router.post('/', async (req, res) => {
    let connection;
    try {
        const { type, satelliteId } = req.body;
        
        if (!type) {
            return res.status(400).json({ error: 'Type is required' });
        }
        
        connection = await getConnection();
        const [result] = await connection.execute(
            `INSERT INTO Sensors (Type, SatelliteID) VALUES (?, ?)`,
            [type, satelliteId || null]
        );
        
        res.status(201).json({ 
            message: 'Sensor created successfully',
            sensorId: result.insertId 
        });
    } catch (err) {
        console.error('Error creating sensor:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// GET sensors by satellite
router.get('/satellite/:satelliteId', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            `SELECT SensorID, Type, SatelliteID FROM Sensors WHERE SatelliteID = ?`,
            [req.params.satelliteId]
        );
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching sensors by satellite:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;