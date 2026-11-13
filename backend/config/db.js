const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

let pool;

/**
 * Configure MySQL connection pool.
 * Supports:
 * 1. DATABASE_URL / MYSQL_URL connection string (common on Railway, PlanetScale, Aiven, etc.)
 * 2. Individual environment variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT)
 * 3. Automatic SSL enablement for remote/cloud hosts
 */
function createDatabasePool() {
  const isProduction = process.env.NODE_ENV === 'production';
  const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;

  // Determine SSL configuration
  // Cloud providers (Aiven, TiDB, PlanetScale, AWS RDS, DigitalOcean) require SSL
  const dbHost = process.env.DB_HOST || 'localhost';
  const isRemoteHost = dbHost !== 'localhost' && dbHost !== '127.0.0.1';
  const requireSsl = process.env.DB_SSL === 'true' || (isProduction && isRemoteHost);

  const sslConfig = requireSsl
    ? {
        rejectUnauthorized: false, // Accepts hosted provider CA certs
      }
    : undefined;

  if (connectionUri) {
    console.log('[Database] Initializing MySQL pool from connection URI...');
    return mysql.createPool({
      uri: connectionUri,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      ssl: sslConfig,
    });
  }

  return mysql.createPool({
    host: dbHost,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'shelfshare_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: sslConfig,
  });
}

pool = createDatabasePool();

// Global pool error handler to avoid unhandled crash
pool.on('connection', (connection) => {
  connection.on('error', (err) => {
    console.error('[MySQL Connection Error]', err.code || err.message);
  });
});

/**
 * Safe connection test probe
 * @returns {Promise<{connected: boolean, message: string, database?: string, host?: string}>}
 */
async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS health_check, DATABASE() AS current_db');
    const currentDb = rows[0]?.current_db || process.env.DB_NAME || 'shelfshare_db';
    const dbHost = process.env.DB_HOST || 'localhost';
    console.log(`[Database] Connected successfully to MySQL database "${currentDb}" on ${dbHost}`);
    return {
      connected: true,
      message: 'Database connection is active and responsive.',
      database: currentDb,
      host: dbHost,
    };
  } catch (error) {
    console.error('[Database Error] Connection check failed:', error.message);
    return {
      connected: false,
      message: `Database unreachable: ${error.message}`,
      database: process.env.DB_NAME || 'shelfshare_db',
    };
  }
}

module.exports = {
  pool,
  testConnection,
};
