import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { query } from './config/db.js';

// Route handlers
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import hostelsRoutes from './routes/hostels.routes.js';
import billsRoutes from './routes/bills.routes.js';
import boardersRoutes from './routes/boarders.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import rebatesRoutes from './routes/rebates.routes.js';

const app = express();

// Enable CORS for frontend clients (supports localhost & 127.0.0.1 on all ports)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Allow any localhost or 127.0.0.1 origin during development
      if (
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        origin === process.env.FRONTEND_URL
      ) {
        return callback(null, true);
      }

      return callback(null, true); // Dev-friendly fallback
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.options('*', cors());

// Body and Cookie parsing middlewares
// Preserve raw request buffer on req.rawBody for Razorpay webhook HMAC-SHA256 signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'MessLedger API Server',
    version: '1.0.0',
    status: 'online',
    documentation: '/api/health',
  });
});

// Health check endpoint (checks server & database)
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const dbRes = await query('SELECT NOW() AS current_time');
    if (dbRes && dbRes.rows.length > 0) {
      dbStatus = 'connected';
    }
  } catch (error) {
    dbStatus = `disconnected (${error.message})`;
  }

  res.json({
    status: 'ok',
    message: 'MessLedger API server is operational',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hostels', hostelsRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/boarders', boardersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/rebates', rebatesRoutes);

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`,
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[UNHANDLED ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
  });
});

export default app;
