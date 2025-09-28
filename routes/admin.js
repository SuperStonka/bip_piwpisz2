const express = require('express');
const path = require('path');
const router = express.Router();
const Page = require('../models/Page');
const News = require('../models/News');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/admin/login');
  }
};

// Login page
router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/admin');
  }
  res.render('admin/login', { title: 'Logowanie - Panel administracyjny' });
});

// Login handler
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Nazwa użytkownika jest wymagana'),
  body('password').notEmpty().withMessage('Hasło jest wymagane')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('admin/login', {
        title: 'Logowanie - Panel administracyjny',
        errors: errors.array(),
        username: req.body.username
      });
    }

    const { username, password } = req.body;
    
    if (!res.locals.db) {
      return res.render('admin/login', {
        title: 'Logowanie - Panel administracyjny',
        error: 'Baza danych jest niedostępna',
        username
      });
    }
    
    const user = await User.findByUsername(res.locals.db, username);
    
    if (!user || !(await user.comparePassword(password))) {
      return res.render('admin/login', {
        title: 'Logowanie - Panel administracyjny',
        error: 'Nieprawidłowa nazwa użytkownika lub hasło',
        username
      });
    }

    req.session.userId = user.id;
    await user.updateLastLogin(res.locals.db);
    
    res.redirect('/admin');
  } catch (error) {
    console.error('Login error:', error);
    res.render('admin/login', {
      title: 'Logowanie - Panel administracyjny',
      error: 'Wystąpił błąd podczas logowania',
      username: req.body.username
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/admin/login');
  });
});

// Admin dashboard
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!res.locals.db) {
      return res.status(503).render('error', {
        title: 'Baza danych niedostępna',
        message: 'Baza danych jest obecnie niedostępna. Spróbuj ponownie później.',
        error: {}
      });
    }

    const pages = await Page.findAll(res.locals.db);
    const news = await News.findAll(res.locals.db);
    const totalPages = pages.length;
    const totalNews = news.length;
    const publishedPages = pages.filter(p => p.isPublished).length;
    const publishedNews = news.filter(n => n.isPublished).length;

    res.render('admin/dashboard', {
      title: 'Panel administracyjny',
      pages: pages.slice(0, 5),
      news: news.slice(0, 5),
      stats: {
        totalPages,
        totalNews,
        publishedPages,
        publishedNews
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', {
      title: 'Błąd serwera',
      message: 'Wystąpił błąd podczas ładowania panelu administracyjnego.',
      error: {}
    });
  }
});

// Pages management
router.get('/pages', requireAuth, async (req, res) => {
  try {
    if (!res.locals.db) {
      return res.status(503).render('error', {
        title: 'Baza danych niedostępna',
        message: 'Baza danych jest obecnie niedostępna. Spróbuj ponownie później.',
        error: {}
      });
    }

    const pages = await Page.findAll(res.locals.db);
    res.render('admin/pages', {
      title: 'Zarządzanie stronami',
      pages
    });
  } catch (error) {
    console.error('Pages error:', error);
    res.status(500).render('error', {
      title: 'Błąd serwera',
      message: 'Wystąpił błąd podczas ładowania stron.',
      error: {}
    });
  }
});

// News management
router.get('/news', requireAuth, async (req, res) => {
  try {
    if (!res.locals.db) {
      return res.status(503).render('error', {
        title: 'Baza danych niedostępna',
        message: 'Baza danych jest obecnie niedostępna. Spróbuj ponownie później.',
        error: {}
      });
    }

    const news = await News.findAll(res.locals.db);
    res.render('admin/news', {
      title: 'Zarządzanie aktualnościami',
      news
    });
  } catch (error) {
    console.error('News error:', error);
    res.status(500).render('error', {
      title: 'Błąd serwera',
      message: 'Wystąpił błąd podczas ładowania aktualności.',
      error: {}
    });
  }
});

module.exports = router;
