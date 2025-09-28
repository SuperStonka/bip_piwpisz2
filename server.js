// Load environment variables
require('dotenv').config();

// Fallback for Phusion Passenger
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Debug environment variables
console.log('🔍 Environment Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('APP_URL:', process.env.APP_URL);
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

const express = require('express');
const mysql = require('mysql2/promise');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const expressLayouts = require('express-ejs-layouts');
const dbConfig = require('./config/database');
const SiteSettings = require('./models/SiteSettings');
const MenuItems = require('./models/MenuItems');

// Helper function to generate breadcrumbs
function generateBreadcrumbs(path, query, menuStructure, articleTitle = null) {
  const breadcrumbs = [
    { title: 'Strona główna', url: '/', isActive: false }
  ];

  // Strona główna
  if (path === '/') {
    breadcrumbs[0].isActive = true;
    return breadcrumbs;
  }

  // Sprawdź czy to hierarchiczny URL (parent/child)
  const hierarchicalMatch = path.match(/^\/([^\/]+)\/(.+)$/);
  if (hierarchicalMatch) {
    const [, parentSlug, childSlug] = hierarchicalMatch;
    
    // Znajdź parent menu item
    const parentItem = menuStructure.find(item => item.slug === parentSlug);
    if (parentItem) {
      // Dodaj parent jako link
      breadcrumbs.push({
        title: parentItem.title,
        url: `/${parentItem.slug}`,
        isActive: false
      });
      
      // Najpierw sprawdź czy child to submenu item
      let childItem = null;
      if (parentItem.children) {
        childItem = parentItem.children.find(child => child.slug === childSlug);
      }
      
      if (childItem) {
        // To jest submenu item - dodaj go do breadcrumbs
        breadcrumbs.push({
          title: childItem.title,
          url: `/${parentItem.slug}/${childItem.slug}`,
          isActive: false
        });
        
        // Jeśli mamy tytuł artykułu, dodaj go jako aktywny
        if (articleTitle) {
          breadcrumbs.push({
            title: articleTitle,
            url: '',
            isActive: true
          });
        } else {
          // Jeśli nie ma tytułu artykułu, submenu item jest aktywny
          breadcrumbs[breadcrumbs.length - 1].isActive = true;
          breadcrumbs[breadcrumbs.length - 1].url = '';
        }
      } else {
        // Nie znaleziono submenu - może to jest bezpośredni artykuł
        let childTitle = childSlug;
        if (articleTitle) {
          childTitle = articleTitle;
        } else {
          // Fallback - formatuj slug
          childTitle = childSlug.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        }
        
        breadcrumbs.push({
          title: childTitle,
          url: '',
          isActive: true
        });
      }
      
      return breadcrumbs;
    }
  }

  // Znajdź odpowiedni element w menu (istniejąca logika)
  function findMenuItemByPath(items, searchPath, searchQuery = {}) {
    for (const item of items) {
      // Sprawdź czy to URL menu item (np. /menu/123)
      const menuMatch = searchPath.match(/^\/menu\/(\d+)$/);
      if (menuMatch) {
        const menuId = parseInt(menuMatch[1]);
        if (item.id === menuId) {
          return item;
        }
        // Sprawdź także w children
        if (item.children) {
          for (const child of item.children) {
            if (child.id === menuId) {
              return { parent: item, child: child };
            }
          }
        }
      }

      // NAJPIERW sprawdź dzieci (submenu) - to ma priorytet
      if (item.children && item.children.length > 0) {
        // Sprawdź czy to aktualności z parametrem kategoria
        if (item.slug === 'aktualnosci' && searchPath === '/aktualnosci' && searchQuery.kategoria) {
          // Dekoduj parametr kategoria z URL
          const decodedKategoria = decodeURIComponent(searchQuery.kategoria);
          const child = item.children.find(child => child.slug === decodedKategoria);
          if (child) {
            return { parent: item, child: child };
          }
        }
        
        // Sprawdź inne dzieci
        for (const child of item.children) {
          if (`/${child.slug}` === searchPath) {
            return { parent: item, child: child };
          }
        }
      }
      
      // DOPIERO POTEM sprawdź główną pozycję (tylko jeśli nie ma query parametrów)
      if (`/${item.slug}` === searchPath && Object.keys(searchQuery).length === 0) {
        return item;
      }
    }
    return null;
  }

  const foundItem = findMenuItemByPath(menuStructure, path, query);

  if (foundItem) {
    if (foundItem.parent && foundItem.child) {
      // Submenu - dodaj rodzica i dziecko
      breadcrumbs.push({
        title: foundItem.parent.title,
        url: `/${foundItem.parent.slug}`,
        isActive: false
      });
      breadcrumbs.push({
        title: foundItem.child.title,
        url: '',
        isActive: true
      });
    } else {
      // Główna pozycja
      breadcrumbs.push({
        title: foundItem.title,
        url: '',
        isActive: true
      });
    }
  } else {
    // Fallback - spróbuj na podstawie slug
    const slug = path.substring(1); // usuń '/' z początku
    
    if (slug) {
      // Capitalize pierwszą literę i zamień myślniki na spacje
      const title = slug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      breadcrumbs.push({
        title: title,
        url: '',
        isActive: true
      });
    }
  }

  return breadcrumbs;
}

const app = express();
const PORT = process.env.PORT || 3000;
const APP_URL = process.env.APP_URL || process.env.BASE_URL || `http://localhost:${PORT}`;

// Trust proxy for correct IP detection (important for view tracking)
app.set('trust proxy', true);

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Use EJS layouts
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Make database and site settings available to all views
app.use(async (req, res, next) => {
  res.locals.db = db; // Używaj globalnej zmiennej db bezpośrednio
  res.locals.appUrl = APP_URL; // URL aplikacji dla linków absolutnych
  
  // Dodaj ustawienia strony i menu do wszystkich widoków
  if (db) {
    try {
      // SiteSettings
      const siteSettings = new SiteSettings(db);
      const settings = await siteSettings.getAll();
      res.locals.siteSettings = settings;
      
      // MenuItems
      const menuItems = new MenuItems(db);
      const menuStructure = await menuItems.getMenuStructure();
      res.locals.menuStructure = menuStructure;
      res.locals.menuItems = menuItems; // Helper dla generowania URL
      
      // Breadcrumbs - przekaż articleTitle jeśli dostępny
      res.locals.breadcrumbs = generateBreadcrumbs(req.path, req.query, menuStructure, res.locals.articleTitle);
      
      // Log tylko pierwszy raz
      if (Object.keys(settings).length > 0 && !req.app.locals.dataLogged) {
        console.log(`✅ SiteSettings załadowane: ${Object.keys(settings).length} ustawień`);
        console.log(`✅ Menu załadowane: ${menuStructure.length} pozycji głównych`);
        req.app.locals.dataLogged = true;
      }
    } catch (error) {
      console.error('Błąd ładowania danych strony:', error);
      res.locals.siteSettings = {};
      res.locals.menuStructure = [];
      res.locals.menuItems = null;
      res.locals.breadcrumbs = generateBreadcrumbs(req.path, req.query, [], res.locals.articleTitle);
    }
  } else {
    console.log('Brak połączenia z bazą - używam pustych ustawień');
    res.locals.siteSettings = {};
    res.locals.menuStructure = [];
    res.locals.menuItems = null;
    res.locals.breadcrumbs = generateBreadcrumbs(req.path, req.query, []);
  }
  
  next();
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
    },
  },
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Use FileStore for production, MemoryStore for development
if (process.env.NODE_ENV === 'production') {
  try {
    const FileStore = require('session-file-store')(session);
    sessionConfig.store = new FileStore({
      path: './sessions',
      ttl: 24 * 60 * 60, // 24 hours
      retries: 5
    });
    console.log('✅ Using FileStore for sessions (production)');
  } catch (error) {
    console.log('⚠️  FileStore not available, using MemoryStore (not recommended for production)');
  }
} else {
  console.log('✅ Using MemoryStore for sessions (development)');
}

app.use(session(sessionConfig));

// Database connection
let db = null;

async function connectToDatabase() {
  try {
    db = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port,
      connectionLimit: dbConfig.connectionLimit || 10,
      charset: dbConfig.charset || 'utf8mb4'
    });
    
    // Test connection
    const connection = await db.getConnection();
    console.log('✅ Połączono z bazą danych MySQL');
    console.log('📊 Baza danych:', dbConfig.database);
    console.log('🌐 Host:', dbConfig.host);
    console.log('👤 Użytkownik:', dbConfig.user);
    console.log('🔌 Port:', dbConfig.port);
    connection.release();
  } catch (err) {
    console.error('❌ Błąd połączenia z MySQL:', err.message);
    console.log('⚠️  Aplikacja będzie działać bez bazy danych (tryb offline)');
  }
}

// Initialize database connection
connectToDatabase();

// Routes
app.use('/', require('./routes/main'));
app.use('/admin', require('./routes/admin'));
app.use('/api', require('./routes/api'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Błąd serwera',
    message: 'Wystąpił błąd serwera. Spróbuj ponownie później.',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Strona nie znaleziona',
    message: 'Strona, której szukasz, nie została znaleziona.',
    error: {}
  });
});

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
  console.log(`Aplikacja dostępna pod adresem: http://localhost:${PORT}`);
});

module.exports = app;
