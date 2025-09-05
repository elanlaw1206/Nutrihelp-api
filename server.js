// server.js
require('dotenv').config();
const express = require('express');

const FRONTEND_ORIGIN = 'http://localhost:3000';

const helmet = require('helmet');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const { exec } = require('child_process');
const rateLimit = require('express-rate-limit');
const uploadRoutes = require('./routes/uploadRoutes');
const fs = require('fs');
const path = require('path');
const consentRoutes = require('./routes/consent');

const app = express();
const port = process.env.PORT || 80;

// Keep DB require (will be mocked in tests if needed)
require('./dbConnection');

// --- Files / cleanup helpers ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir, { recursive: true }); console.log('Created uploads directory'); }
  catch (err) { console.error('Error creating uploads directory:', err); }
}

const tempDir = path.join(__dirname, 'uploads', 'temp');
if (!fs.existsSync(tempDir)) {
  try { fs.mkdirSync(tempDir, { recursive: true }); console.log('Created temp uploads directory'); }
  catch (err) { console.error('Error creating temp uploads directory:', err); }
}

function cleanupOldFiles() {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  try {
    const tempFiles = fs.readdirSync(tempDir);
    console.log(`Checking ${tempFiles.length} temporary files for cleanup`);
    let deleted = 0;
    for (const f of tempFiles) {
      const p = path.join(tempDir, f);
      try {
        const st = fs.statSync(p);
        if (now - st.mtimeMs > ONE_DAY) { fs.unlinkSync(p); deleted++; }
      } catch (e) { console.error(`Error checking file ${p}:`, e); }
    }
    if (deleted > 0) console.log(`Cleaned up ${deleted} old temporary files`);
  } catch (e) {
    console.error('Error during file cleanup:', e);
  }
}

function startBackgroundJobsIfNeeded() {
  try { cleanupOldFiles(); } catch (e) { console.warn('cleanupOldFiles at start failed:', e.message); }
  global.__nutrihelp_cleanup_handle = setInterval(cleanupOldFiles, 3 * 60 * 60 * 1000);
}

// --- Security / middleware ---
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.options('*', cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use((req, res, next) => { res.header('Access-Control-Allow-Credentials', 'true'); next(); });
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: 'Too many requests, please try again later.' },
});
app.use(limiter);

const swaggerDocument = yaml.load('./index.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Routes ---
const routes = require('./routes');
routes(app);

app.use('/api', uploadRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/signup', require('./routes/signup'));
app.use('/api', consentRoutes);

// Errors
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Health (for tests/CI)
app.get('/_health', (req, res) => res.json({ status: 'ok' }));

// Start only when run directly (NOT when required by Jest)
if (require.main === module) {
  startBackgroundJobsIfNeeded();
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    if (process.platform === 'win32') {
      try { exec(`start http://localhost:${port}/api-docs`); }
      catch (e) { console.warn('Could not open browser:', e.message); }
    }
  });
}

module.exports = app;
