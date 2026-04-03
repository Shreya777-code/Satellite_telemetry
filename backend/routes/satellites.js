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

// POST new satellite with AUTO-GENERATED ALERTS (SIMPLIFIED WORKING VERSION)
// POST new satellite - NEVER blocks, just adds alerts
// POST new satellite with AUTO-CREATION of ALL related data (ALL 8 TABLES)
router.post('/', async (req, res) => {
    let connection;
    try {
        const { name, launchDate, orbitType, status } = req.body;
        
        if (!name || !orbitType || !status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        connection = await getConnection();
        
        // Start transaction (so everything succeeds or fails together)
        await connection.beginTransaction();
        
        // ============================================
        // 1. INSERT INTO SATELLITES TABLE
        // ============================================
        const [insertResult] = await connection.execute(
            `INSERT INTO Satellites (Name, LaunchDate, OrbitType, Status) 
             VALUES (?, ?, ?, ?)`,
            [name, launchDate || null, orbitType, status]
        );
        
        const newSatelliteId = insertResult.insertId;
        const generatedAlerts = [];
        const generatedSensors = [];
        
        // ============================================
        // 2. CHECK/CREATE DEFAULT OPERATOR (if none exists)
        // ============================================
        const [existingOperators] = await connection.execute(
            `SELECT OperatorID FROM Operators LIMIT 1`
        );
        
        let defaultOperatorId = null;
        
        if (existingOperators.length === 0) {
            // Auto-create a default operator if none exists
            const [operatorResult] = await connection.execute(
                `INSERT INTO Operators (Name, Role, Email) 
                 VALUES ('Default Operator', 'System Auto-assigned', 'auto@system.com')`,
                []
            );
            defaultOperatorId = operatorResult.insertId;
        } else {
            defaultOperatorId = existingOperators[0].OperatorID;
        }
        
        // ============================================
        // 3. CHECK/CREATE DEFAULT GROUND STATION (if StationID=1 doesn't exist)
        // ============================================
        const [existingStation] = await connection.execute(
            `SELECT StationID FROM GroundStations WHERE StationID = 1`
        );
        
        if (existingStation.length === 0) {
            // Auto-create a default ground station
            await connection.execute(
                `INSERT INTO GroundStations (StationID, Name, Latitude, Longitude) 
                 VALUES (1, 'Default Ground Station', 0.000000, 0.000000)`,
                []
            );
        }
        
        // ============================================
        // 4. AUTO-CREATE DEFAULT SENSORS
        // ============================================
        const defaultSensors = [
            { type: 'Temperature Sensor' },
            { type: 'Gyroscope' },
            { type: 'Magnetometer' }
        ];
        
        for (const sensor of defaultSensors) {
            const [sensorResult] = await connection.execute(
                `INSERT INTO Sensors (Type, SatelliteID) VALUES (?, ?)`,
                [sensor.type, newSatelliteId]
            );
            generatedSensors.push({
                sensorId: sensorResult.insertId,
                type: sensor.type
            });
        }
        
        // ============================================
        // 5. AUTO-CREATE TELEMETRY PACKET
        // ============================================
        const [packetResult] = await connection.execute(
            `INSERT INTO TelemetryPackets (Timestamp, SatelliteID, StationID) 
             VALUES (NOW(), ?, 1)`,
            [newSatelliteId]
        );
        const newPacketId = packetResult.insertId;
        
        // ============================================
        // 6. AUTO-CREATE SENSOR READINGS
        // ============================================
        const [sensors] = await connection.execute(
            `SELECT SensorID FROM Sensors WHERE SatelliteID = ?`,
            [newSatelliteId]
        );
        
        for (let i = 0; i < sensors.length; i++) {
            await connection.execute(
                `INSERT INTO SensorReadings (PacketID, ReadingNo, SensorID, Timestamp, Value, Unit) 
                 VALUES (?, ?, ?, NOW(), ?, ?)`,
                [newPacketId, i + 1, sensors[i].SensorID, 0.00, 'units']
            );
        }
        
        // ============================================
        // 7. AUTO-ASSIGN OPERATOR (OPERATOR ASSIGNMENTS TABLE)
        // ============================================
        await connection.execute(
            `INSERT INTO OperatorAssignments (OperatorID, SatelliteID, AssignedDate, Role, ShiftTime) 
             VALUES (?, ?, CURDATE(), 'Primary Monitor', 'Auto-assigned')`,
            [defaultOperatorId, newSatelliteId]
        );
        
        // ============================================
        // 8. GENERATE ALERTS
        // ============================================
        
        // Check status
        if (status === 'Inactive') {
            const alertText = `🚨 HIGH RISK: Satellite ${name} is INACTIVE - Immediate attention required`;
            await connection.execute(
                `INSERT INTO Alerts (Severity, Description, CreatedAt) 
                 VALUES ('High', ?, NOW())`,
                [alertText]
            );
            generatedAlerts.push({ severity: 'High', description: alertText });
        }
        
        if (status === 'Maintenance') {
            const alertText = `🔧 MEDIUM RISK: Satellite ${name} is in MAINTENANCE mode`;
            await connection.execute(
                `INSERT INTO Alerts (Severity, Description, CreatedAt) 
                 VALUES ('Medium', ?, NOW())`,
                [alertText]
            );
            generatedAlerts.push({ severity: 'Medium', description: alertText });
        }
        
        // Check age
        if (launchDate) {
            const launchYear = new Date(launchDate).getFullYear();
            const currentYear = new Date().getFullYear();
            const age = currentYear - launchYear;
            
            if (age > 10) {
                const alertText = `⚠️ HIGH RISK: Satellite ${name} is ${age} years old - Exceeds operational life`;
                await connection.execute(
                    `INSERT INTO Alerts (Severity, Description, CreatedAt) 
                     VALUES ('High', ?, NOW())`,
                    [alertText]
                );
                generatedAlerts.push({ severity: 'High', description: alertText });
            } else if (age > 5) {
                const alertText = `📡 MEDIUM RISK: Satellite ${name} is ${age} years old - Schedule maintenance`;
                await connection.execute(
                    `INSERT INTO Alerts (Severity, Description, CreatedAt) 
                     VALUES ('Medium', ?, NOW())`,
                    [alertText]
                );
                generatedAlerts.push({ severity: 'Medium', description: alertText });
            }
        }
        
        // Check orbit type
        if (orbitType === 'GEO' && status === 'Active') {
            const alertText = `🛰️ LOW RISK: GEO satellite ${name} - Routine station-keeping check recommended`;
            await connection.execute(
                `INSERT INTO Alerts (Severity, Description, CreatedAt) 
                 VALUES ('Low', ?, NOW())`,
                [alertText]
            );
            generatedAlerts.push({ severity: 'Low', description: alertText });
        }
        
        // Commit all changes
        await connection.commit();
        
        // Send success response with details
        res.status(201).json({ 
            success: true,
            message: `Satellite "${name}" added successfully with all related data`,
            satelliteId: newSatelliteId,
            sensorsCreated: generatedSensors.length,
            telemetryPacketId: newPacketId,
            alerts: generatedAlerts,
            tablesUpdated: {
                Satellites: 1,
                Operators: existingOperators.length === 0 ? 1 : 0,
                GroundStations: existingStation.length === 0 ? 1 : 0,
                Sensors: generatedSensors.length,
                TelemetryPackets: 1,
                SensorReadings: sensors.length,
                OperatorAssignments: 1,
                Alerts: generatedAlerts.length
            }
        });
        
    } catch (err) {
        // Rollback on error
        if (connection) await connection.rollback();
        console.error('Error creating satellite:', err);
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
        
        // First check if satellite exists
        const [check] = await connection.execute(
            'SELECT SatelliteID FROM Satellites WHERE SatelliteID = ?',
            [req.params.id]
        );
        
        if (check.length === 0) {
            return res.status(404).json({ error: 'Satellite not found' });
        }
        
        // Delete satellite (cascade will handle related tables)
        await connection.execute(
            'DELETE FROM Satellites WHERE SatelliteID = ?',
            [req.params.id]
        );
        
        res.json({ message: 'Satellite deleted successfully' });
    } catch (err) {
        console.error('Error deleting satellite:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;