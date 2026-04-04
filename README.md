A complete satellite monitoring system with automatic alert generation and real-time database integration.

🛠️ Technology Stack
Frontend: HTML5, CSS3, JavaScript

Backend: Node.js, Express.js

Database: MySQL 8.0

API Protocol: REST API

📁 Project Structure
text
satellite-monitoring-system/
├── frontend/
│   └── index.html          # Main UI
├── backend/
│   ├── server.js           # Main server
│   ├── db-config.js        # Database config
│   ├── package.json        # Dependencies
│   ├── routes/
│   │   ├── satellites.js   # Satellite CRUD
│   │   ├── operators.js    # Operator CRUD
│   │   ├── groundStations.js
│   │   ├── sensors.js
│   │   ├── telemetry.js
│   │   ├── readings.js
│   │   ├── alerts.js
│   │   └── assignments.js
│   └── monitoring-service.js # Auto alert generator
└── database/
    └── create_tables.sql   # Database schema

#Tables Created (8 tables)
Satellites

Operators

GroundStations

Sensors

TelemetryPackets

SensorReadings

Alerts

OperatorAssignments

#When Adding a Satellite, System Auto-Creates:
3 Default Sensors (Temperature, Gyroscope, Magnetometer)

1 Telemetry Packet (Initial status)

3 Sensor Readings (One per sensor)

Operator Assignment (Auto-assigns to first available)

Risk-based Alerts (Based on age, status, orbit type)

#Auto-Alert Rules:
Condition	Severity	Example
Status = Inactive	High	"Satellite is INACTIVE"
Age > 10 years	High	"Exceeds operational life"
Age 5-10 years	Medium	"Schedule maintenance"
Status = Maintenance	Medium	"In maintenance mode"
GEO + Active	Low	"Station-keeping check"

#Background Monitoring (Every 5 minutes):
Checks all satellites for new issues

Generates alerts for persistent problems

No manual intervention needed

#📊 Features
Dashboard
Total satellites count

Active alerts by severity

Ground stations count

Operators count

Recent alerts display

Satellite Management
Add new satellites (auto-creates related data)

View all satellites with sequential display

Delete satellites (cascade deletes related data)

Alert System
Auto-generated based on business rules

Color-coded by severity (Red/High, Yellow/Medium, Green/Low)

Manual alert creation option

Delete alerts

SQL Query Runner
Execute SELECT queries

Results displayed as tables

Query history tracking

#📝 Important Notes
Database Name: Must be satellite_telemetry in both SQL and backend config

Auto-Increment IDs: Gaps are normal and don't affect functionality

Cascade Delete: Deleting a satellite removes all related data

Query Safety: Only SELECT queries allowed in frontend SQL runner

Auto-Monitoring: Runs every 5 minutes; can be triggered manually
