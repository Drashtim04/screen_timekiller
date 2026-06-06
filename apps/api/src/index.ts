import dotenv from 'dotenv';
dotenv.config(); // Must be FIRST before any route imports that use process.env

// ---------------------------------------------------------------------------
// Startup environment validation — fail fast with a clear error message rather
// than starting a server that silently returns 500s or 401s for every request.
// ---------------------------------------------------------------------------
function validateEnv() {
  const isDemoMode = process.env.DEMO_MODE === 'true';

  const required: Record<string, string> = {
    SUPABASE_URL:  'Supabase project URL (e.g. https://xxxx.supabase.co)',
    SUPABASE_KEY:  'Supabase anon/service key',
  };

  // SUPABASE credentials are mandatory even in demo mode because the
  // requireAuth middleware still validates real JWTs for non-mock requests.
  const placeholders = ['placeholder', 'placeholder.supabase.co', 'placeholder-anon-key'];

  for (const [name, description] of Object.entries(required)) {
    const value = process.env[name];
    if (!value || value.trim() === '') {
      throw new Error(
        `[Startup] Missing required environment variable: ${name}\n` +
        `  What it is: ${description}\n` +
        `  Fix: add ${name}=<value> to apps/api/.env`
      );
    }
    if (placeholders.some(p => value.includes(p))) {
      throw new Error(
        `[Startup] ${name} is still set to a placeholder value: "${value}"\n` +
        `  Fix: replace it with a real value in apps/api/.env`
      );
    }
  }

  if (!isDemoMode) {
    // Non-demo mode: Cashfree credentials must also be real.
    // Warn (not throw) since sandbox test keys are legitimate for development.
    const cfId  = process.env.CASHFREE_APP_ID     || '';
    const cfKey = process.env.CASHFREE_SECRET_KEY  || '';
    if (!cfId || cfId.startsWith('TEST') || !cfKey || cfKey.startsWith('TEST')) {
      console.warn(
        '[Startup] CASHFREE_APP_ID / CASHFREE_SECRET_KEY appear to be sandbox/test values. ' +
        'Payment flows will not work in production until real Cashfree credentials are set.'
      );
    }
  }

  console.log(`[Startup] Environment validated. DEMO_MODE=${isDemoMode}`);
}

validateEnv(); // Throws and exits before any network binding if misconfigured.

import express from 'express';
import cors from 'cors';
import focusRoutes from './routes/focus';
import paymentRoutes from './routes/payments';
import authRoutes from './routes/auth';
import analyticsRoutes from './routes/analytics';
import webhookRoutes from './routes/webhook';
import aiRoutes from './routes/ai';


const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());

// ⚠️ IMPORTANT: The webhook route MUST be mounted BEFORE express.json().
// Cashfree's HMAC signature is computed over the original raw bytes from the network.
// express.json() parses → JS object → JSON.stringify() re-serialises with potentially
// different whitespace/key-order → signature mismatch for every production webhook.
// express.raw() gives us the original Buffer; we parse JSON ourselves inside the handler.
app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

// All other routes use the standard JSON body parser.
app.use(express.json());

// Root API Route
app.get('/', (req, res) => {
  res.json({
    service: 'DeepWork AI API',
    status: 'online',
    version: '1.0.0',
    payment_provider: 'Cashfree',
    frontend_url: process.env.FRONTEND_URL || 'http://localhost:5173',
    endpoints: ['/health', '/api/auth', '/api/focus', '/api/payments', '/api/analytics', '/api/webhook'],
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'deepwork-api' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
// Note: /api/webhook is mounted above before express.json() — do NOT duplicate here.
app.use('/api/ai', aiRoutes);

app.listen(port, () => {
  console.log(`DeepWork API running on http://localhost:${port}`);
});
