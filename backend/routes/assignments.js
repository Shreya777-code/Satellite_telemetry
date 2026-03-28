const express = require('express');
const router = express.Router();
const { getConnection } = require('../db-config');

// GET all operator assignments
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            `SELECT oa.AssignmentID, oa.OperatorID, oa.SatelliteID, 
                    oa.AssignedDate, oa.Role, oa.ShiftTime,
                    op.Name as OperatorName, op.Email as OperatorEmail,
                    s.Name as SatelliteName
             FROM OperatorAssignments oa
             LEFT JOIN Operators op ON oa.OperatorID = op.OperatorID
             LEFT JOIN Satellites s ON oa.SatelliteID = s.SatelliteID
             ORDER BY oa.AssignedDate DESC`
        );
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching assignments:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// GET assignment by ID
router.get('/:id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            `SELECT oa.AssignmentID, oa.OperatorID, oa.SatelliteID, 
                    oa.AssignedDate, oa.Role, oa.ShiftTime,
                    op.Name as OperatorName, s.Name as SatelliteName
             FROM OperatorAssignments oa
             LEFT JOIN Operators op ON oa.OperatorID = op.OperatorID
             LEFT JOIN Satellites s ON oa.SatelliteID = s.SatelliteID
             WHERE oa.AssignmentID = ?`,
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching assignment:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// POST new operator assignment
router.post('/', async (req, res) => {
    let connection;
    try {
        const { operatorId, satelliteId, assignedDate, role, shiftTime } = req.body;
        
        if (!operatorId || !satelliteId) {
            return res.status(400).json({ error: 'Operator ID and Satellite ID are required' });
        }
        
        connection = await getConnection();
        const [result] = await connection.execute(
            `INSERT INTO OperatorAssignments 
             (OperatorID, SatelliteID, AssignedDate, Role, ShiftTime) 
             VALUES (?, ?, ?, ?, ?)`,
            [operatorId, satelliteId, assignedDate || new Date(), role || null, shiftTime || null]
        );
        
        res.status(201).json({ 
            message: 'Operator assignment created successfully',
            assignmentId: result.insertId 
        });
    } catch (err) {
        console.error('Error creating assignment:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// PUT update operator assignment
router.put('/:id', async (req, res) => {
    let connection;
    try {
        const { operatorId, satelliteId, assignedDate, role, shiftTime } = req.body;
        
        connection = await getConnection();
        const [result] = await connection.execute(
            `UPDATE OperatorAssignments 
             SET OperatorID = ?, SatelliteID = ?, AssignedDate = ?, 
                 Role = ?, ShiftTime = ? 
             WHERE AssignmentID = ?`,
            [operatorId, satelliteId, assignedDate, role, shiftTime, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        
        res.json({ message: 'Operator assignment updated successfully' });
    } catch (err) {
        console.error('Error updating assignment:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// DELETE operator assignment
router.delete('/:id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.execute(
            'DELETE FROM OperatorAssignments WHERE AssignmentID = ?',
            [req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        
        res.json({ message: 'Operator assignment deleted successfully' });
    } catch (err) {
        console.error('Error deleting assignment:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// GET assignments by operator
router.get('/operator/:operatorId', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            `SELECT oa.*, s.Name as SatelliteName
             FROM OperatorAssignments oa
             LEFT JOIN Satellites s ON oa.SatelliteID = s.SatelliteID
             WHERE oa.OperatorID = ?
             ORDER BY oa.AssignedDate DESC`,
            [req.params.operatorId]
        );
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching assignments by operator:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// GET assignments by satellite
router.get('/satellite/:satelliteId', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            `SELECT oa.*, op.Name as OperatorName, op.Email as OperatorEmail
             FROM OperatorAssignments oa
             LEFT JOIN Operators op ON oa.OperatorID = op.OperatorID
             WHERE oa.SatelliteID = ?
             ORDER BY oa.AssignedDate DESC`,
            [req.params.satelliteId]
        );
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching assignments by satellite:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;