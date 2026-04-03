-- Create database
CREATE DATABASE IF NOT EXISTS satellite_telemetry;
USE satellite_telemetry;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS OperatorAssignments;
DROP TABLE IF EXISTS Alerts;
DROP TABLE IF EXISTS SensorReadings;
DROP TABLE IF EXISTS TelemetryPackets;
DROP TABLE IF EXISTS Sensors;
DROP TABLE IF EXISTS GroundStations;
DROP TABLE IF EXISTS Operators;
DROP TABLE IF EXISTS Satellites;

-- Satellites
CREATE TABLE Satellites (
    SatelliteID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    LaunchDate DATE,
    OrbitType ENUM('LEO', 'GEO', 'MEO', 'HEO'),
    Status ENUM('Active', 'Inactive', 'Maintenance')
);

-- Operators
CREATE TABLE Operators (
    OperatorID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Role VARCHAR(50),
    Email VARCHAR(100) UNIQUE
);

-- Ground Stations
CREATE TABLE GroundStations (
    StationID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Latitude DECIMAL(10,6),
    Longitude DECIMAL(10,6)
);

-- Sensors
CREATE TABLE Sensors (
    SensorID INT AUTO_INCREMENT PRIMARY KEY,
    Type VARCHAR(50) NOT NULL,
    SatelliteID INT,
    FOREIGN KEY (SatelliteID) 
        REFERENCES Satellites(SatelliteID)
        ON DELETE CASCADE
);

-- Telemetry Packets
CREATE TABLE TelemetryPackets (
    PacketID INT AUTO_INCREMENT PRIMARY KEY,
    Timestamp DATETIME NOT NULL,
    SatelliteID INT,
    StationID INT,
    FOREIGN KEY (SatelliteID) 
        REFERENCES Satellites(SatelliteID)
        ON DELETE CASCADE,
    FOREIGN KEY (StationID) 
        REFERENCES GroundStations(StationID)
        ON DELETE SET NULL
);

-- Sensor Readings
CREATE TABLE SensorReadings (
    PacketID INT,
    ReadingNo INT,
    SensorID INT,
    Timestamp DATETIME NOT NULL,
    Value DECIMAL(10,4),
    Unit VARCHAR(20),
    PRIMARY KEY (PacketID, ReadingNo),
    FOREIGN KEY (PacketID) 
        REFERENCES TelemetryPackets(PacketID)
        ON DELETE CASCADE,
    FOREIGN KEY (SensorID) 
        REFERENCES Sensors(SensorID)
        ON DELETE CASCADE
);

-- Alerts
CREATE TABLE Alerts (
    AlertID INT AUTO_INCREMENT PRIMARY KEY,
    Severity ENUM('High', 'Medium', 'Low'),
    Description VARCHAR(500),
    PacketID INT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PacketID) 
        REFERENCES TelemetryPackets(PacketID)
        ON DELETE CASCADE
);

-- Operator Assignments
CREATE TABLE OperatorAssignments (
    AssignmentID INT AUTO_INCREMENT PRIMARY KEY,
    OperatorID INT,
    SatelliteID INT,
    AssignedDate DATE,
    Role VARCHAR(50),
    ShiftTime VARCHAR(20),
    FOREIGN KEY (OperatorID) 
        REFERENCES Operators(OperatorID)
        ON DELETE CASCADE,
    FOREIGN KEY (SatelliteID) 
        REFERENCES Satellites(SatelliteID)
        ON DELETE CASCADE
);

-- Insert sample data

INSERT INTO Satellites (Name, LaunchDate, OrbitType, Status) VALUES 
('AQUA-1', '2023-05-12', 'LEO', 'Active'),
('TERRA-X', '2022-11-01', 'GEO', 'Inactive'),
('NOVA-3', '2024-01-20', 'MEO', 'Active'),


INSERT INTO Operators (Name, Role, Email) VALUES 
('Dr. Eva Green', 'Mission Director', 'eva@space.com'),
('Mark Chen', 'Flight Engineer', 'mark@space.com');

INSERT INTO GroundStations (Name, Latitude, Longitude) VALUES 
('Polar Ground', 78.2, 15.6),
('Equatorial Hub', 0.1, -78.5);

INSERT INTO Sensors (Type, SatelliteID) VALUES 
('Thermal', 1),
('Gyroscope', 1),
('Magnetometer', 3);