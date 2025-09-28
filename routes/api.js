const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const News = require('../models/News');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Brak autoryzacji' });
  }
};

// Pages API
router.get('/pages', requireAuth, async (req, res) => {
  try {
    const pages = await Page.find().sort({ updatedAt: -1 });
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: 'Błąd podczas pobierania stron' });
  }
});

router.post('/pages', requireAuth, [
  body('title').trim().notEmpty().withMessage('Tytuł jest wymagany'),
  body('content').notEmpty().withMessage('Treść jest wymagana'),
  body('slug').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pageData = {
      ...req.body,
      createdBy: req.session.userId
    };

    const page = new Page(pageData);
    await page.save();
    res.status(201).json(page);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Strona o tym adresie już istnieje' });
    } else {
      res.status(500).json({ error: 'Błąd podczas tworzenia strony' });
    }
  }
});

router.put('/pages/:id', requireAuth, [
  body('title').trim().notEmpty().withMessage('Tytuł jest wymagany'),
  body('content').notEmpty().withMessage('Treść jest wymagana')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = await Page.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!page) {
      return res.status(404).json({ error: 'Strona nie znaleziona' });
    }

    res.json(page);
  } catch (error) {
    res.status(500).json({ error: 'Błąd podczas aktualizacji strony' });
  }
});

router.delete('/pages/:id', requireAuth, async (req, res) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.id);
    if (!page) {
      return res.status(404).json({ error: 'Strona nie znaleziona' });
    }
    res.json({ message: 'Strona została usunięta' });
  } catch (error) {
    res.status(500).json({ error: 'Błąd podczas usuwania strony' });
  }
});

// News API
router.get('/news', requireAuth, async (req, res) => {
  try {
    const news = await News.find().sort({ updatedAt: -1 });
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: 'Błąd podczas pobierania aktualności' });
  }
});

router.post('/news', requireAuth, [
  body('title').trim().notEmpty().withMessage('Tytuł jest wymagany'),
  body('content').notEmpty().withMessage('Treść jest wymagana'),
  body('category').notEmpty().withMessage('Kategoria jest wymagana')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const newsData = {
      ...req.body,
      createdBy: req.session.userId
    };

    const news = new News(newsData);
    await news.save();
    res.status(201).json(news);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Aktualność o tym adresie już istnieje' });
    } else {
      res.status(500).json({ error: 'Błąd podczas tworzenia aktualności' });
    }
  }
});

router.put('/news/:id', requireAuth, [
  body('title').trim().notEmpty().withMessage('Tytuł jest wymagany'),
  body('content').notEmpty().withMessage('Treść jest wymagana'),
  body('category').notEmpty().withMessage('Kategoria jest wymagana')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const news = await News.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!news) {
      return res.status(404).json({ error: 'Aktualność nie znaleziona' });
    }

    res.json(news);
  } catch (error) {
    res.status(500).json({ error: 'Błąd podczas aktualizacji aktualności' });
  }
});

router.delete('/news/:id', requireAuth, async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) {
      return res.status(404).json({ error: 'Aktualność nie znaleziona' });
    }
    res.json({ message: 'Aktualność została usunięta' });
  } catch (error) {
    res.status(500).json({ error: 'Błąd podczas usuwania aktualności' });
  }
});

// Test endpoint for debugging
router.get('/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// Update article view count with IP rate limiting
router.post('/article/:id/view', async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                    req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    
    console.log(`View request for article ${articleId} from IP: ${clientIP}`);
    
    if (!req.app.locals.articleViews) {
      req.app.locals.articleViews = new Map();
    }
    
    const viewKey = `${articleId}_${clientIP}`;
    const now = Date.now();
    const lastView = req.app.locals.articleViews.get(viewKey);
    
    // Check if this IP viewed this article in the last hour (3600000 ms)
    const oneHour = 60 * 60 * 1000;
    if (lastView && (now - lastView) < oneHour) {
      return res.json({ 
        success: false, 
        message: 'View already counted from this IP within the last hour',
        viewCount: null
      });
    }
    
    // Update view count in database
    const Article = require('../models/Article');
    await Article.incrementViewCount(res.locals.db, articleId);
    
    // Store this view time for this IP
    req.app.locals.articleViews.set(viewKey, now);
    
    // Get updated view count
    const article = await Article.findById(res.locals.db, articleId);
    const newViewCount = article ? article.viewCount : 0;
    
    console.log(`View count updated for article ${articleId}: ${newViewCount}`);
    
    res.json({ 
      success: true, 
      message: 'View count updated',
      viewCount: newViewCount
    });
    
  } catch (error) {
    console.error('Error updating view count:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update view count' 
    });
  }
});

module.exports = router;
