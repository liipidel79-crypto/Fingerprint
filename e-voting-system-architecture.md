# E-Voting System Architecture Documentation

## System Overview

This document provides a comprehensive architectural overview of the Fingerprint-Based Electronic Voting System, designed to ensure secure, transparent, and accessible elections through biometric authentication.

**Date Created**: April 28, 2026
**Version**: 1.0
**System Type**: Biometric E-Voting Platform

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Technology Stack](#technology-stack)
3. [System Components](#system-components)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Security Architecture](#security-architecture)
6. [Deployment Architecture](#deployment-architecture)
7. [API Specifications](#api-specifications)
8. [Database Schema](#database-schema)
9. [Hardware Specifications](#hardware-specifications)
10. [System Requirements](#system-requirements)

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Layer    │    │ Presentation   │    │ Application     │
│                 │    │   Layer        │    │   Layer         │
│ • Voters        │◄──►│ • React UI     │◄──►│ • Express.js    │
│ • Administrators│    │ • TypeScript   │    │ • REST API      │
└─────────────────┘    │ • Responsive   │    └─────────────────┘
                       └─────────────────┘             │
                                                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Hardware      │    │   Data Layer    │    │ Communication   │
│   Layer         │    │                 │    │   Protocols     │
│ • ESP32 Device  │◄──►│ • MySQL DB      │◄──►│ • HTTP/REST     │
│ • Fingerprint   │    │ • Biometric Data│    │ • WebSocket     │
│   Sensor        │    │ • Vote Records  │    │ • WiFi          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Architecture Principles

- **Modular Design**: Separated concerns across layers
- **Security First**: Biometric authentication and encrypted communications
- **Scalability**: Support for multiple voting stations
- **Reliability**: Fault-tolerant design with error handling
- **Auditability**: Complete logging and tracking of all operations

---

## Technology Stack

### Frontend Technologies
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Framework | React | 19.x | UI Components |
| Language | TypeScript | Latest | Type Safety |
| Build Tool | Vite | Latest | Development Server |
| Styling | Tailwind CSS | 4.x | Responsive Design |
| State Mgmt | Zustand | Latest | Global State |
| HTTP Client | Axios/Fetch | Native | API Communication |

### Backend Technologies
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Runtime | Node.js | Latest | Server Runtime |
| Framework | Express.js | 5.x | Web Framework |
| Database | MySQL | 8.x | Data Persistence |
| Auth | JWT | Latest | Token Authentication |
| Validation | Zod | Latest | Input Validation |

### Hardware Technologies
| Component | Technology | Purpose |
|-----------|------------|---------|
| Microcontroller | ESP32 | WiFi-enabled MCU |
| Fingerprint Sensor | Adafruit Fingerprint | Biometric Input |
| Communication | HTTP/WiFi | Network Connectivity |
| Power | USB/External | Device Power |

---

## System Components

### 1. Frontend Layer (Presentation)

#### Main Components
- **App.tsx**: Main application component
- **Layout.tsx**: Page layout wrapper
- **Pages/**: Individual page components
  - HomePage.tsx - Landing page
  - VotingPage.tsx - Vote casting interface
  - ResultPage.tsx - Election results display
  - AdminLoginPage.tsx - Administrator authentication
  - AdminDashboardPage.tsx - Administrative panel

#### Services Layer
- **api.ts**: HTTP client for backend communication
- **votingStore.ts**: Global state management (Zustand)
- **voting.ts**: TypeScript type definitions

### 2. Backend Layer (Application)

#### Server Structure
```
server/
├── app.js                 # Main Express application
├── routes/
│   ├── publicRoutes.js    # Public API endpoints
│   ├── adminRoutes.js     # Admin API endpoints
│   └── hardwareRoutes.js  # Hardware device endpoints
├── controllers/
│   ├── publicController.js    # Public business logic
│   ├── AdminController.js     # Admin business logic
│   └── hardwareController.js  # Hardware integration
├── models/
│   ├── database.js        # Database connection
│   ├── init.js           # Database initialization
│   └── store.js          # Data models
└── middleware/
    └── auth.js           # Authentication middleware
```

#### API Endpoints

**Public Routes (/api/public/)**
- `GET /health` - Health check
- `POST /voter/validate` - Validate voter eligibility
- `POST /voter/register` - Complete voter registration
- `POST /vote` - Cast vote
- `GET /candidates` - Get candidate list

**Admin Routes (/api/admin/)**
- `POST /login` - Administrator login
- `GET /dashboard` - Dashboard data
- `GET /results` - Election results
- `POST /candidates` - Manage candidates

**Hardware Routes (/api/hardware/)**
- `POST /register` - Register voter from hardware
- `POST /check-fingerprint` - Verify fingerprint
- `POST /scan` - Process fingerprint scan

### 3. Data Layer (Persistence)

#### Database Schema

**admins Table**
```sql
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**candidates Table**
```sql
CREATE TABLE candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    party VARCHAR(100) NOT NULL,
    photo_url VARCHAR(255),
    position VARCHAR(50) NOT NULL,
    vote_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**voters Table**
```sql
CREATE TABLE voters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fingerprint_id INT UNIQUE NOT NULL,
    unique_id VARCHAR(20) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    name VARCHAR(100),
    section VARCHAR(50),
    has_voted BOOLEAN DEFAULT FALSE,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**votes Table**
```sql
CREATE TABLE votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voter_id INT NOT NULL,
    candidate_id INT NOT NULL,
    session_id INT NOT NULL,
    voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (voter_id) REFERENCES voters(id),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);
```

**sessions Table**
```sql
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Hardware Layer

#### ESP32 Configuration
```cpp
// WiFi Configuration
const char* ssid = "VOTING_NETWORK";
const char* password = "secure_password";
const char* serverUrl = "http://192.168.1.100:3000/api/hardware";

// Hardware Pins
const int RX_PIN = 16;  // UART RX for fingerprint sensor
const int TX_PIN = 17;  // UART TX for fingerprint sensor
const int LED_PIN = 2;  // Status LED
```

### Fingerprint Sensor Integration
- **Model**: Adafruit Fingerprint Sensor
- **Interface**: UART Serial Communication
- **Baud Rate**: 57600
- **Template Storage**: On-device flash memory
- **Matching Algorithm**: Built-in biometric matching

### Power Requirements
- **Voltage**: 5V DC
- **Current**: 500mA (peak during scanning)
- **Power Source**: USB or regulated power supply
- **Battery Backup**: Optional for offline operation

---

## Data Flow Architecture

### Voter Registration Flow
1. **Web Interface**: Voter accesses registration page
2. **Validation**: System checks voter eligibility
3. **Biometric Capture**: ESP32 scans fingerprint
4. **Data Transmission**: Fingerprint template sent to server
5. **Storage**: Biometric data stored in database
6. **Confirmation**: Registration completion notification

### Voting Process Flow
1. **Authentication**: Fingerprint verification
2. **Interface Display**: Candidate list presentation
3. **Vote Selection**: User selects candidate
4. **Validation**: Duplicate vote prevention
5. **Recording**: Vote stored in database
6. **Confirmation**: Vote receipt generation

### Administrative Flow
1. **Login**: Admin credential verification
2. **Dashboard Access**: System overview display
3. **Management**: Candidate and session management
4. **Monitoring**: Real-time election monitoring
5. **Reporting**: Results and analytics generation

---

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **Role-Based Access**: Voter vs Administrator permissions
- **Session Management**: Token expiration and refresh
- **Biometric Verification**: Fingerprint-based identity confirmation

### Data Security
- **Encryption**: HTTPS/TLS for all communications
- **Password Hashing**: bcrypt for credential storage
- **Input Validation**: Sanitization and validation middleware
- **SQL Injection Prevention**: Parameterized queries

### System Security
- **CORS Configuration**: Cross-origin request handling
- **Rate Limiting**: API request throttling
- **Audit Logging**: Complete activity tracking
- **Backup Security**: Encrypted database backups

---

## Deployment Architecture

### Local Deployment
```
┌─────────────────┐    ┌─────────────────┐
│   Client PCs    │    │  ESP32 Devices  │
│   (Browsers)    │    │                 │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
          ┌─────────────────────┐
          │   Local Network     │
          │   (WiFi Router)     │
          └─────────┬───────────┘
                    │
          ┌─────────────────────┐
          │   Server Machine    │
          │ • Node.js App       │
          │ • MySQL Database    │
          │ • Web Server        │
          └─────────────────────┘
```

### Distributed Deployment
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Voting        │    │   Database      │    │   Hardware      │
│   Server        │    │   Server        │    │   Stations      │
│ • API Services  │    │ • MySQL         │    │ • ESP32 Devices │
│ • Web Frontend  │    │ • Backups       │    │ • Sensors       │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────┬───────────┬──────────┬───────────┘
                     │           │           │
          ┌─────────────────────┐┌─────────────────────┐
          │   Load Balancer     ││   Network Switch    │
          └─────────┬───────────┘└─────────┬───────────┘
                    │                      │
          ┌─────────────────────┐┌─────────────────────┐
          │   Client Access     ││   Admin Access      │
          │   (Web Browsers)    ││   (Admin Panel)     │
          └─────────────────────┘└─────────────────────┘
```

### Cloud Deployment Options
- **AWS**: EC2 instances, RDS MySQL, S3 storage
- **Azure**: App Services, Azure Database, Blob Storage
- **GCP**: Compute Engine, Cloud SQL, Cloud Storage

---

## API Specifications

### Authentication
```javascript
// JWT Token Structure
{
  "userId": 123,
  "role": "admin|voter",
  "exp": 1640995200,
  "iat": 1640991600
}
```

### Request/Response Examples

**Voter Validation**
```javascript
// POST /api/public/voter/validate
{
  "uniqueId": "VOTER001",
  "name": "John Doe"
}

// Response
{
  "success": true,
  "message": "Voter eligible for registration",
  "voterId": 123
}
```

**Vote Casting**
```javascript
// POST /api/public/vote
{
  "voterId": 123,
  "candidateId": 456,
  "fingerprintToken": "biometric_hash"
}

// Response
{
  "success": true,
  "message": "Vote recorded successfully",
  "voteId": 789,
  "receipt": "VOTE-2026-001"
}
```

**Fingerprint Registration**
```javascript
// POST /api/hardware/scan
{
  "fingerprintData": "base64_encoded_template",
  "deviceId": "ESP32_001"
}

// Response
{
  "success": true,
  "fingerprintId": 123,
  "message": "Fingerprint registered"
}
```

---

## Hardware Specifications

### ESP32 Device Configuration
```cpp
// WiFi Configuration
const char* ssid = "VOTING_NETWORK";
const char* password = "secure_password";
const char* serverUrl = "http://192.168.1.100:3000/api/hardware";

// Hardware Pins
const int RX_PIN = 16;  // UART RX for fingerprint sensor
const int TX_PIN = 17;  // UART TX for fingerprint sensor
const int LED_PIN = 2;  // Status LED
```

### Fingerprint Sensor Integration
- **Model**: Adafruit Fingerprint Sensor
- **Interface**: UART Serial Communication
- **Baud Rate**: 57600
- **Template Storage**: On-device flash memory
- **Matching Algorithm**: Built-in biometric matching

### Power Requirements
- **Voltage**: 5V DC
- **Current**: 500mA (peak during scanning)
- **Power Source**: USB or regulated power supply
- **Battery Backup**: Optional for offline operation

---

## System Requirements

### Minimum Hardware Requirements

**Server Machine**
- CPU: Dual-core 2.4GHz or higher
- RAM: 4GB minimum, 8GB recommended
- Storage: 50GB available space
- Network: Gigabit Ethernet or WiFi

**Client Machines**
- Modern web browser (Chrome 90+, Firefox 88+, Edge 90+)
- Minimum 2GB RAM
- Stable internet connection (for distributed deployment)

**ESP32 Hardware Stations**
- ESP32 development board
- Adafruit fingerprint sensor
- USB power supply or battery
- WiFi network access

### Software Requirements

**Development Environment**
- Node.js 18.x or higher
- MySQL 8.0 or higher
- Arduino IDE 2.x (for ESP32 programming)
- VS Code or similar IDE
- Git version control

**Production Environment**
- Linux/Windows Server OS
- Nginx or Apache web server
- SSL certificate for HTTPS
- Automated backup system
- Monitoring and logging tools

### Network Requirements
- Local WiFi network (2.4GHz/5GHz)
- DHCP server for IP assignment
- Firewall configuration for security
- Bandwidth: 10Mbps minimum per voting station

---

## Implementation Guidelines

### Development Workflow
1. **Setup Development Environment**
2. **Database Initialization**
3. **Backend API Development**
4. **Frontend Interface Development**
5. **Hardware Integration Testing**
6. **Security Testing and Validation**
7. **Performance Testing**
8. **Deployment and Monitoring**

### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **Hardware Tests**: ESP32 device testing
- **Security Tests**: Penetration testing
- **Load Tests**: Concurrent user simulation
- **User Acceptance Tests**: End-to-end voting simulation

### Maintenance Procedures
- **Regular Backups**: Daily database backups
- **Security Updates**: Keep dependencies updated
- **Hardware Maintenance**: ESP32 device calibration
- **Log Monitoring**: Regular log analysis
- **Performance Monitoring**: System resource tracking

---

## Conclusion

This fingerprint-based e-voting system provides a secure, scalable, and user-friendly solution for electronic elections. The modular architecture ensures maintainability, while the biometric authentication prevents fraud and ensures voter privacy.

**Key Benefits:**
- Enhanced security through biometric verification
- Real-time results and monitoring
- Scalable for various election sizes
- User-friendly interface for all voters
- Comprehensive audit trails for transparency

**Future Enhancements:**
- Mobile app support
- Blockchain integration for additional security
- Multi-language support
- Advanced analytics and reporting
- Integration with existing voter databases

---

*Document generated on April 28, 2026*  
*System Architecture Version 1.0*  
*Prepared by GitHub Copilot Assistant*