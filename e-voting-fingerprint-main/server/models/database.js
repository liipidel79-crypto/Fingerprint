/**
 * Database Connection Module
 * MySQL Database Configuration
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "voting_system",
  port: parseInt(process.env.DB_PORT || "3306"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
export const testConnection = async () => {
  try {
    // First try to connect without specifying database
    const tempPool = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port,
    });

    // Create database if it doesn't exist
    await tempPool.execute(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``,
    );
    await tempPool.end();

    // Now connect to the database
    const connection = await pool.getConnection();
    console.log("✅ Database connected successfully");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
};

// Execute query with error handling
export const executeQuery = async (query, params = []) => {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
};

// Get single row
export const getRow = async (query, params = []) => {
  const rows = await executeQuery(query, params);
  return rows.length > 0 ? rows[0] : null;
};

// Get multiple rows
export const getRows = async (query, params = []) => {
  return await executeQuery(query, params);
};

// Insert and return insert ID
export const insertRow = async (query, params = []) => {
  const result = await executeQuery(query, params);
  return result.insertId;
};

// Update rows and return affected rows
export const updateRows = async (query, params = []) => {
  const result = await executeQuery(query, params);
  return result.affectedRows;
};

export default pool;
