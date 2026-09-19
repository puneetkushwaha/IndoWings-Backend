import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import fleetRoutes from './routes/fleet.js';
import missionsRoutes from './routes/missions.js';
import auditRoutes from './routes/audit.js';
import contactRoutes from './routes/contact.js';
import statsRoutes from './routes/stats.js';
import deliveryRoutes from './routes/delivery.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/missions', missionsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/delivery', deliveryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    version: '3.4.4',
    service: 'IndoWings Flight Operations API & Command Center Gateway',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 IndoWings Enterprise Command Center Server running on port ${PORT}`);
  console.log(`📡 REST API available at: http://localhost:${PORT}/api`);
});
