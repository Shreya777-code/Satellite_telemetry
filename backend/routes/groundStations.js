const express = require('express');
const router = express.Router();
const { getConnection } = require('../db-config');

// GET all ground stations
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            'SELECT StationID, Name, Latitude, Longitude FROM GroundStations ORDER BY StationID'
        );
        
        const stations = rows.map(row => ({
            stationId: row.StationID,
            name: row.Name,
            latitude: parseFloat(row.Latitude),
            longitude: parseFloat(row.Longitude)
        }));
        
        res.json(stations);
    } catch (err) {
        console.error('Error fetching ground stations:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// GET single ground station
router.get('/:id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            'SELECT StationID, Name, Latitude, Longitude FROM GroundStations WHERE StationID = ?',
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Ground station not found' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching ground station:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// POST new ground station
router.post('/', async (req, res) => {
    let connection;
    try {
        const { name, latitude, longitude } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        connection = await getConnection();
        const [result] = await connection.execute(
            `INSERT INTO GroundStations (Name, Latitude, Longitude) VALUES (?, ?, ?)`,
            [name, latitude || null, longitude || null]
        );
        
        res.status(201).json({ 
            message: 'Ground station created successfully',
            stationId: result.insertId 
        });
    } catch (err) {
        console.error('Error creating ground station:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// PUT update ground station
router.put('/:id', async (req, res) => {
    let connection;
    try {
        const { name, latitude, longitude } = req.body;
        
        connection = await getConnection();
        const [result] = await connection.execute(
            `UPDATE GroundStations SET Name = ?, Latitude = ?, Longitude = ? WHERE StationID = ?`,
            [name, latitude, longitude, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ground station not found' });
        }
        
        res.json({ message: 'Ground station updated successfully' });
    } catch (err) {
        console.error('Error updating ground station:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// DELETE ground station
router.delete('/:id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.execute(
            'DELETE FROM GroundStations WHERE StationID = ?',
            [req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ground station not found' });
        }
        
        res.json({ message: 'Ground station deleted successfully' });
    } catch (err) {
        console.error('Error deleting ground station:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;