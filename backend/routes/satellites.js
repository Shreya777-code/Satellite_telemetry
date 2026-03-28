const express = require('express');
const router = express.Router();
const { getConnection } = require('../db-config');

// GET all satellites
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            `SELECT SatelliteID, Name, DATE_FORMAT(LaunchDate, '%Y-%m-%d') as LaunchDate, 
                    OrbitType, Status 
             FROM Satellites ORDER BY SatelliteID`
        );
        
        const satellites = rows.map(row => ({
            satelliteId: row.SatelliteID,
            name: row.Name,
            launchDate: row.LaunchDate,
            orbitType: row.OrbitType,
            status: row.Status
        }));
        
        res.json(satellites);
    } catch (err) {
        console.error('Error fetching satellites:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// GET single satellite
router.get('/:id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            `SELECT SatelliteID, Name, DATE_FORMAT(LaunchDate, '%Y-%m-%d') as LaunchDate, 
                    OrbitType, Status 
             FROM Satellites WHERE SatelliteID = ?`,
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Satellite not found' });
        }
        
        const satellite = {
            satelliteId: rows[0].SatelliteID,
            name: rows[0].Name,
            launchDate: rows[0].LaunchDate,
            orbitType: rows[0].OrbitType,
            status: rows[0].Status
        };
        
        res.json(satellite);
    } catch (err) {
        console.error('Error fetching satellite:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// POST new satellite
router.post('/', async (req, res) => {
    let connection;
    try {
        const { name, launchDate, orbitType, status } = req.body;
        
        if (!name || !orbitType || !status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        connection = await getConnection();
        const [result] = await connection.execute(
            `INSERT INTO Satellites (Name, LaunchDate, OrbitType, Status) 
             VALUES (?, ?, ?, ?)`,
            [name, launchDate || null, orbitType, status]
        );
        
        res.status(201).json({ 
            message: 'Satellite created successfully',
            satelliteId: result.insertId 
        });
    } catch (err) {
        console.error('Error creating satellite:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// PUT update satellite
router.put('/:id', async (req, res) => {
    let connection;
    try {
        const { name, launchDate, orbitType, status } = req.body;
        
        connection = await getConnection();
        const [result] = await connection.execute(
            `UPDATE Satellites 
             SET Name = ?, LaunchDate = ?, OrbitType = ?, Status = ? 
             WHERE SatelliteID = ?`,
            [name, launchDate, orbitType, status, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Satellite not found' });
        }
        
        res.json({ message: 'Satellite updated successfully' });
    } catch (err) {
        console.error('Error updating satellite:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// DELETE satellite
router.delete('/:id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.execute(
            'DELETE FROM Satellites WHERE SatelliteID = ?',
            [req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Satellite not found' });
        }
        
        res.json({ message: 'Satellite deleted successfully' });
    } catch (err) {
        console.error('Error deleting satellite:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;