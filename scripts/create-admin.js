const mysql = require('mysql2/promise');
const User = require('../models/User');
const dbConfig = require('../config/database');

// Connect to MySQL
let db = null;

async function createAdmin() {
  try {
    console.log('🔗 Łączenie z bazą danych...');
    console.log('🌐 Host: arstudio.atthost24.pl');
    console.log('📊 Baza danych: 9518_piwpisz');
    
    // Connect to MySQL
    db = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port,
      ...dbConfig.options
    });
    
    // Create tables if they don't exist
    await createTables();
    
    // Check if admin already exists
    const existingAdmin = await User.findByRole(db, 'admin');
    if (existingAdmin.length > 0) {
      console.log('✅ Administrator już istnieje:', existingAdmin[0].username);
      console.log('📧 Email:', existingAdmin[0].email);
      process.exit(0);
    }

    // Create admin user
    const adminId = await User.create(db, {
      username: 'admin',
      email: 'admin@weterynaria-pisz.pl',
      password: 'admin123', // Change this in production!
      role: 'admin',
      isActive: true
    });

    console.log('✅ Administrator utworzony pomyślnie!');
    console.log('👤 Nazwa użytkownika: admin');
    console.log('🔑 Hasło: admin123');
    console.log('⚠️  UWAGA: Zmień hasło po pierwszym logowaniu!');
    console.log('🌐 Panel administracyjny: http://localhost:3000/admin');
    
  } catch (error) {
    console.error('❌ Błąd podczas tworzenia administratora:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Sprawdź połączenie internetowe i dostępność serwera bazy danych');
    }
  } finally {
    if (db) {
      await db.end();
    }
  }
}

async function createTables() {
  // Create users table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(30) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'editor') DEFAULT 'editor',
      isActive BOOLEAN DEFAULT TRUE,
      lastLogin DATETIME NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create pages table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      content TEXT NOT NULL,
      metaDescription TEXT NULL,
      metaKeywords TEXT NULL,
      isPublished BOOLEAN DEFAULT FALSE,
      isHomepage BOOLEAN DEFAULT FALSE,
      menuOrder INT DEFAULT 0,
      showInMenu BOOLEAN DEFAULT TRUE,
      parentPage INT NULL,
      createdBy INT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (createdBy) REFERENCES users(id),
      FOREIGN KEY (parentPage) REFERENCES pages(id)
    )
  `);

  // Create news table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS news (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      excerpt TEXT NULL,
      content TEXT NOT NULL,
      featuredImage JSON NULL,
      category VARCHAR(100) DEFAULT 'Aktualności',
      isPublished BOOLEAN DEFAULT FALSE,
      isFeatured BOOLEAN DEFAULT FALSE,
      publishDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      views INT DEFAULT 0,
      createdBy INT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (createdBy) REFERENCES users(id)
    )
  `);

  // Create articles table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS articles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT NULL,
      status ENUM('draft', 'published') DEFAULT 'draft',
      menu_category VARCHAR(100) NULL,
      responsible_person VARCHAR(255) NULL,
      created_by INT NULL,
      published_by INT NULL,
      updated_by INT NULL,
      published_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      view_count INT DEFAULT 0,
      menu_item_id INT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (published_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id)
    )
  `);

  // Create menu_items table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      url VARCHAR(500) NULL,
      parent_id INT NULL,
      order_index INT DEFAULT 0,
      display_mode ENUM('page', 'list', 'article') DEFAULT 'page',
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES menu_items(id)
    )
  `);

  // Create site_settings table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

createAdmin();
