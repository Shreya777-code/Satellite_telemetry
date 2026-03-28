const express = require('express');
const router = express.Router();
const { getConnection } = require('../db-config');

// GET all telemetry packets
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            `SELECT t.PacketID, t.Timestamp, t.SatelliteID, t.StationID,
                    s.Name as SatelliteName, g.Name as StationName
             FROM TelemetryPackets t
             LEFT JOIN Satellites s ON t.SatelliteID = s.SatelliteID
             LEFT JOIN GroundStations g ON t.StationID = g.StationID
             ORDER BY t.Timestamp DESC`
        );
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching telemetry packets:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// GET telemetry packet by ID
router.get('/:id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            `SELECT t.PacketID, t.Timestamp, t.SatelliteID, t.StationID,
                    s.Name as SatelliteName, g.Name as StationName
             FROM TelemetryPackets t
             LEFT JOIN Satellites s ON t.SatelliteID = s.SatelliteID
             LEFT JOIN GroundStations g ON t.StationID = g.StationID
             WHERE t.PacketID = ?`,
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Telemetry packet not found' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching telemetry packet:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// POST new telemetry packet
router.post('/', async (req, res) => {
    let connection;
    try {
        const { timestamp, satelliteId, stationId } = req.body;
        
        connection = await getConnection();
        const [result] = await connection.execute(
            `INSERT INTO TelemetryPackets (Timestamp, SatelliteID, StationID) 
             VALUES (?, ?, ?)`,
            [timestamp || new Date(), satelliteId || null, stationId || null]
        );
        
        res.status(201).json({ 
            message: 'Telemetry packet created successfully',
            packetId: result.insertId 
        });
    } catch (err) {
        console.error('Error creating telemetry packet:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// GET packets by satellite
router.get('/satellite/:satelliteId', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            `SELECT PacketID, Timestamp, SatelliteID, StationID 
             FROM TelemetryPackets 
             WHERE SatelliteID = ?
             ORDER BY Timestamp DESC`,
            [req.params.satelliteId]
        );
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching packets by satellite:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;