const { getConnection } = require('./db-config');

async function autoMonitorAndGenerateAlerts() {
    let connection;
    try {
        console.log('🔍 Running automatic satellite health check...');
        connection = await getConnection();
        
        // Get all satellites
        const [satellites] = await connection.execute(
            'SELECT SatelliteID, Name, LaunchDate, OrbitType, Status FROM Satellites'
        );
        
        if (satellites.length === 0) {
            console.log('   No satellites to monitor');
            return;
        }
        
        let newAlertsCount = 0;
        
        for (const sat of satellites) {
            // Get satellite age
            let age = 0;
            if (sat.LaunchDate) {
                const launchYear = new Date(sat.LaunchDate).getFullYear();
                const currentYear = new Date().getFullYear();
                age = currentYear - launchYear;
            }
            
            // Check for issues
            if (sat.Status === 'Inactive') {
                // Check if alert already exists
                const [existing] = await connection.execute(
                    `SELECT AlertID FROM Alerts 
                     WHERE Description LIKE ? AND CreatedAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
                    [`%${sat.Name}%INACTIVE%`]
                );
                
                if (existing.length === 0) {
                    await connection.execute(
                        `INSERT INTO Alerts (Severity, Description, PacketID, CreatedAt) 
                         VALUES ('High', ?, NULL, NOW())`,
                        [`⚠️ PERSISTENT INACTIVITY: ${sat.Name} remains INACTIVE - Urgent attention required`]
                    );
                    newAlertsCount++;
                    console.log(`   📢 Generated alert for ${sat.Name}: Persistent inactivity`);
                }
            }
            
            // Age check
            if (age > 10) {
                const [existing] = await connection.execute(
                    `SELECT AlertID FROM Alerts 
                     WHERE Description LIKE ? AND CreatedAt > DATE_SUB(NOW(), INTERVAL 7 DAY)`,
                    [`%${sat.Name}%aging%`]
                );
                
                if (existing.length === 0) {
                    await connection.execute(
                        `INSERT INTO Alerts (Severity, Description, PacketID, CreatedAt) 
                         VALUES ('High', ?, NULL, NOW())`,
                        [`⚠️ CRITICAL AGING: ${sat.Name} is ${age} years old - End of life approaching`]
                    );
                    newAlertsCount++;
                    console.log(`   📢 Generated alert for ${sat.Name}: Critical aging`);
                }
            }
        }
        
        if (newAlertsCount > 0) {
            console.log(`✅ Auto-monitoring complete: ${newAlertsCount} new alerts generated`);
        } else {
            console.log('✅ Auto-monitoring complete: All systems normal');
        }
        
    } catch (err) {
        console.error('❌ Monitoring service error:', err.message);
    } finally {
        if (connection) connection.release();
    }
}

// Run every 5 minutes
setInterval(() => {
    autoMonitorAndGenerateAlerts();
}, 5 * 60 * 1000);

// Run immediately on startup
console.log('🚀 Starting automatic satellite monitoring service...');
autoMonitorAndGenerateAlerts();

module.exports = { autoMonitorAndGenerateAlerts };