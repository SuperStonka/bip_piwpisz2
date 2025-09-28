// Database configuration
module.exports = {
  // MySQL configuration - use environment variables with fallbacks
  host: process.env.DB_HOST || 'piwpisz.atthost24.pl',
  user: process.env.DB_USER || '22055_bippiwpisz2',
  password: process.env.DB_PASSWORD || 'Zb3*E63@8s*$T',
  database: process.env.DB_NAME || '22055_bippiwpisz2',
  port: process.env.DB_PORT || 3306,
  
  // Connection options
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4'
};
