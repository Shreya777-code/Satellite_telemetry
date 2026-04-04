# 🛰️ Satellite Telemetry System

A **full-stack web application** for real-time satellite tracking, automated anomaly detection, and intelligent alert generation.

When a satellite is added, the system automatically generates all related data including sensors, telemetry packets, operator assignments, and risk-based alerts based on satellite age, status, and orbit type.

The application features a **modern responsive dashboard**, a **SQL query runner**, and an **automated background monitoring system** that scans for issues every 5 minutes.It demonstrates complete CRUD operations, foreign key relationships, and business rule automation for a satellite telemetry monitoring system.
  
Create → Add satellite (auto-creates sensors, alerts, etc.)  
Read → Dashboard + SQL query runner  
Update → Change satellite status or alerts  
Delete → Remove satellite (cascade deletes everything related)  

---

## 🚀 Tech Stack

* **Frontend:** HTML5, CSS3, JavaScript
* **Backend:** Node.js, Express.js
* **Database:** MySQL 8.0
* **API Protocol:** REST API

---

## 📁 Project Structure

```
satellite-monitoring-system/
├── frontend/
│   └── index.html              # Main UI
├── backend/
│   ├── server.js               # Main server
│   ├── db-config.js            # Database config
│   ├── package.json            # Dependencies
│   ├── routes/
│   │   ├── satellites.js       # Satellite CRUD
│   │   ├── operators.js        # Operator CRUD
│   │   ├── groundStations.js
│   │   ├── sensors.js
│   │   ├── telemetry.js
│   │   ├── readings.js
│   │   ├── alerts.js
│   │   └── assignments.js
│   └── monitoring-service.js   # Auto alert generator
└── database/
    └── create_tables.sql       # Database schema
```

---

## 🗄️ Database Schema

### Tables Created (8 Total)

* Satellites
* Operators
* GroundStations
* Sensors
* TelemetryPackets
* SensorReadings
* Alerts
* OperatorAssignments

---

## ⚙️ Automated Data Creation

When a **new satellite is added**, the system automatically creates:

* ✅ 3 Default Sensors

  * Temperature
  * Gyroscope
  * Magnetometer

* ✅ 1 Telemetry Packet (Initial status)

* ✅ 3 Sensor Readings (one per sensor)

* ✅ Operator Assignment (auto-assigned to first available operator)

* ✅ Risk-based Alerts

---

## 🚨 Auto-Alert Rules

| Condition            | Severity | Example                    |
| -------------------- | -------- | -------------------------- |
| Status = Inactive    | High     | "Satellite is INACTIVE"    |
| Age > 10 years       | High     | "Exceeds operational life" |
| Age 5–10 years       | Medium   | "Schedule maintenance"     |
| Status = Maintenance | Medium   | "In maintenance mode"      |
| GEO + Active         | Low      | "Station-keeping check"    |

---

## 🔄 Background Monitoring

* Runs automatically **every 5 minutes**
* Scans all satellites for new issues
* Generates alerts for persistent problems
* Requires **no manual intervention**

---

## 📊 Features

### 📌 Dashboard

* Total satellites count
* Active alerts by severity
* Ground stations count
* Operators count
* Recent alerts display

---

### 🛰️ Satellite Management

* Add new satellites *(auto-generates related data)*
* View all satellites *(sequential display)*
* Delete satellites *(cascade delete enabled)*

---

###  Alert System

* Auto-generated alerts based on business rules
* Color-coded severity:

  * 🔴 High
  * 🟡 Medium
  * 🟢 Low

---

###  SQL Query Runner

* Execute **SELECT queries only**
* Results displayed in table format
* Query history tracking

---

## 📝 Important Notes

* **Database Name:** Must be `satellite_telemetry` in both SQL and backend config
* **Auto-Increment IDs:** Gaps are normal and do not affect functionality
* **Cascade Delete:** Deleting a satellite removes all related data
* **Query Safety:** Only SELECT queries allowed in frontend SQL runner
* **Auto-Monitoring:** Runs every 5 minutes (can also be triggered manually)

---

##  Summary

This project demonstrates:

* Full-stack development with **Node.js + MySQL**
* Complex **relational database design**
* **Foreign key relationships & cascade operations**
* **Business rule automation**
* Real-time monitoring & alert systems



