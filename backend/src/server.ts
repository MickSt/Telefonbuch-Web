import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { Redis } from 'ioredis';
import { config } from './config/env.js';
import { CardDAVService } from './services/CardDAVService.js';
import { errorHandler } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import contactRoutes from './routes/contacts.js';

const app = express();
const redisClient = new Redis(config.session.valkeyUrl);

// Trust proxy for session cookies behind Nginx
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    skip: (req) => {
      // Hier können IPs von Uptime Kuma oder anderen Monitoring-Tools ausgeschlossen werden
      const whitelistedIps = process.env.WHITELISTED_IPS?.split(',') || [];
      const clientIp = req.ip || req.socket.remoteAddress;
      return whitelistedIps.includes(clientIp || '');
    },
  })
);

// Middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

app.use(express.json());

if (!config.session.secret) {
  throw new Error('SESSION_SECRET must be set in production');
}

app.use(
  session({
    store: new RedisStore({
      client: redisClient,
      prefix: 'sess:',
      serializer: JSON, // Expliziter Serializer, um das [object Object] Problem zu beheben
    }),
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    name: 'telefonbuch.sid',
    proxy: true,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    },
  })
);

// Initialize CardDAV
CardDAVService.initialize().catch((error) => {
  console.warn('⚠️  CardDAV initialization failed:', error.message);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.send('Telefonbuch API is running.');
});

// Error handler
app.use(errorHandler);

const port = typeof config.port === 'string' ? parseInt(config.port) : config.port;

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
