const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

let connection;

const connectDB = async () => {
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'fine_user',
      password: process.env.DB_PASSWORD || 'fine_password',
      database: process.env.DB_NAME || 'fine_finance',
      charset: 'utf8mb4',
      timezone: '+00:00',
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true
    });

    await connection.execute('SELECT 1');
    logger.info('✅ MySQL database connected successfully');
    
    // Test the connection
    const [rows] = await connection.execute('SELECT VERSION() as version');
    logger.info(`📊 MySQL Version: ${rows[0].version}`);
    
    return connection;
  } catch (error) {
    logger.error('❌ MySQL connection failed:', error.message);
    throw error;
  }
};

const getConnection = () => {
  if (!connection) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return connection;
};

const closeConnection = async () => {
  if (connection) {
    await connection.end();
    logger.info('🔌 MySQL connection closed');
  }
};

// Database query helper
const query = async (sql, params = []) => {
  try {
    const conn = getConnection();
    const [rows] = await conn.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const conn = getConnection();
  await conn.beginTransaction();
  
  try {
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  }
};

module.exports = {
  connectDB,
  getConnection,
  closeConnection,
  query,
  transaction
};
