const mysql = require('mysql2/promise');

// Database configuration - UPDATE THESE WITH YOUR MYSQL CREDENTIALS
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',              // Your MySQL username (default is 'root')
    password: 'mySQL', // ⚠️ CHANGE THIS to your MySQL password
    database: 'satellite_telementry',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test the connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log("✅ Successfully connected to MySQL Database");
        console.log(`   Database: ${dbConfig.database}`);
        connection.release();
        return true;
    } catch (err) {
        console.error("❌ Database connection failed!");
        console.error(`   Error: ${err.message}`);
        console.error("\n   Please check:");
        console.error("   1. MySQL is running");
        console.error("   2. Username and password in db-config.js are correct");
        console.error("   3. Database 'satellite_monitoring' exists");
        return false;
    }
}

// Get database connection from pool
async function getConnection() {
    try {
        const connection = await pool.getConnection();
        return connection;
    } catch (err) {
        console.error("Error getting connection:", err);
        throw err;
    }
}

module.exports = { getConnection, testConnection, pool };