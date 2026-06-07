/**
 * Database Initialization Script
 * Creates tables and inserts default data
 */

import bcrypt from "bcrypt";
import { executeQuery } from "./database.js";

export async function initializeTables() {
  try {
    console.log("🔄 Initializing database tables...");

    // Create admins table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at_timestamp INT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    // Create candidates table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS candidates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        party VARCHAR(100) NOT NULL,
        photo_url VARCHAR(255),
        position VARCHAR(50) NOT NULL,
        vote_count INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at_timestamp INT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create voters table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS voters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fingerprint_id INT UNIQUE NOT NULL,
        unique_id VARCHAR(20) UNIQUE NOT NULL,
        phone_number VARCHAR(20),
        name VARCHAR(100),
        section VARCHAR(50),
        age INT,
        gender ENUM('Male', 'Female', 'Other'),
        is_registered BOOLEAN DEFAULT FALSE,
        status ENUM('not_voted', 'already_voted') DEFAULT 'not_voted',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at_timestamp INT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create votes table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        voter_unique_id VARCHAR(20) NOT NULL,
        candidate_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at_timestamp INT,
        FOREIGN KEY (voter_unique_id) REFERENCES voters(unique_id) ON DELETE CASCADE,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
      )
    `);

    // Create finger_scans table for storing fingerprint scan data from Arduino
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS finger_scans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        voter_id INT NOT NULL,
        fingerprint_id INT NOT NULL,
        quality INT,
        match_score INT,
        scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        scanned_at_timestamp INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (voter_id) REFERENCES voters(id) ON DELETE CASCADE
      )
    `);

    const columnHasAutoIncrement = async (tableName, columnName) => {
      const rows = await executeQuery(
        `SHOW COLUMNS FROM \`${tableName}\` LIKE '${columnName}'`,
      );
      return rows.length > 0 && rows[0].Extra?.includes("auto_increment");
    };

    const getForeignKeyName = async (tableName, columnName) => {
      const rows = await executeQuery(
        `
          SELECT CONSTRAINT_NAME
          FROM information_schema.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
            AND COLUMN_NAME = ?
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `,
        [tableName, columnName],
      );
      return rows.length > 0 ? rows[0].CONSTRAINT_NAME : null;
    };

    const ensureAutoIncrement = async (tableName, columnName) => {
      if (await columnHasAutoIncrement(tableName, columnName)) {
        return;
      }

      let droppedForeignKeys = [];
      if (tableName === "candidates") {
        const fkName = await getForeignKeyName("votes", "candidate_id");
        if (fkName) {
          await executeQuery(
            `ALTER TABLE votes DROP FOREIGN KEY \`${fkName}\``,
          );
          droppedForeignKeys.push({
            table: "votes",
            column: "candidate_id",
            name: fkName,
          });
        }
      }

      if (tableName === "voters") {
        const fkName = await getForeignKeyName("votes", "voter_unique_id");
        if (fkName) {
          await executeQuery(
            `ALTER TABLE votes DROP FOREIGN KEY \`${fkName}\``,
          );
          droppedForeignKeys.push({
            table: "votes",
            column: "voter_unique_id",
            name: fkName,
          });
        }
      }

      await executeQuery(
        `ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${columnName}\` INT NOT NULL AUTO_INCREMENT`,
      );

      // Recreate dropped foreign keys
      for (const fk of droppedForeignKeys) {
        if (fk.column === "candidate_id") {
          await executeQuery(
            `ALTER TABLE votes ADD CONSTRAINT \`${fk.name}\` FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE`,
          );
        } else if (fk.column === "voter_unique_id") {
          await executeQuery(
            `ALTER TABLE votes ADD CONSTRAINT \`${fk.name}\` FOREIGN KEY (voter_unique_id) REFERENCES voters(unique_id) ON DELETE CASCADE`,
          );
        }
      }
    };

    await ensureAutoIncrement("admins", "id");
    await ensureAutoIncrement("candidates", "id");
    await ensureAutoIncrement("voters", "id");
    await ensureAutoIncrement("votes", "id");

    // Create sessions table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT PRIMARY KEY DEFAULT 1,
        status ENUM('pending', 'active', 'paused', 'finished') DEFAULT 'pending',
        title VARCHAR(255) DEFAULT 'General Election',
        description TEXT,
        start_time DATETIME,
        end_time DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert default admin if not exists
    const adminExists = await executeQuery(
      "SELECT id FROM admins WHERE username = ?",
      ["admin"],
    );
    console.log(
      "Checking if admin exists:",
      adminExists.length > 0 ? "yes" : "no",
    );
    if (adminExists.length === 0) {
      const created_at = new Date();
      const created_at_timestamp = Math.floor(created_at.getTime() / 1000);

      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash("admin123", saltRounds);

      await executeQuery(
        `
        INSERT INTO admins (username, email, password_hash, created_at, created_at_timestamp)
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          "admin",
          "admin@voting.com",
          hashedPassword,
          created_at,
          created_at_timestamp,
        ],
      );

      console.log(
        "✅ Default admin created (username: admin, password: admin123)",
      );
    } else {
      console.log("Admin already exists, skipping creation");
    }

    // Insert default session if not exists
    const sessionExists = await executeQuery(
      "SELECT id FROM sessions WHERE id = 1",
    );
    if (sessionExists.length === 0) {
      const created_at = new Date();

      await executeQuery(
        `
        INSERT INTO sessions (id, status, title, description, created_at, updated_at)
        VALUES (1, 'pending', 'General Election', 'Main voting session', ?, ?)
      `,
        [created_at, created_at],
      );

      console.log("✅ Default session created");
    }

    console.log("✅ Database tables initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing database tables:", error);
    throw error;
  }
}
