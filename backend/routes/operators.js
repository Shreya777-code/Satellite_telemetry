const express = require('express');
const router = express.Router();
const { getConnection } = require('../db-config');

// GET all operators
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            'SELECT OperatorID, Name, Role, Email FROM Operators ORDER BY OperatorID'
        );
        
        const operators = rows.map(row => ({
            operatorId: row.OperatorID,
            name: row.Name,
            role: row.Role,
            email: row.Email
        }));
        
        res.json(operators);
    } catch (err) {
        console.error('Error fetching operators:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// GET single operator
router.get('/:id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            'SELECT OperatorID, Name, Role, Email FROM Operators WHERE OperatorID = ?',
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Operator not found' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching operator:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// POST new operator
router.post('/', async (req, res) => {
    let connection;
    try {
        const { name, role, email } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }
        
        connection = await getConnection();
        const [result] = await connection.execute(
            `INSERT INTO Operators (Name, Role, Email) VALUES (?, ?, ?)`,
            [name, role, email]
        );
        
        res.status(201).json({ 
            message: 'Operator created successfully',
            operatorId: result.insertId 
        });
    } catch (err) {
        console.error('Error creating operator:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// PUT update operator
router.put('/:id', async (req, res) => {
    let connection;
    try {
        const { name, role, email } = req.body;
        
        connection = await getConnection();
        const [result] = await connection.execute(
            `UPDATE Operators SET Name = ?, Role = ?, Email = ? WHERE OperatorID = ?`,
            [name, role, email, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Operator not found' });
        }
        
        res.json({ message: 'Operator updated successfully' });
    } catch (err) {
        console.error('Error updating operator:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// DELETE operator
router.delete('/:id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.execute(
            'DELETE FROM Operators WHERE OperatorID = ?',
            [req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Operator not found' });
        }
        
        res.json({ message: 'Operator deleted successfully' });
    } catch (err) {
        console.error('Error deleting operator:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;