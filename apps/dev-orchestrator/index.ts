import express from 'express';
import cors from 'cors';
import path from 'path';
import { Orchestrator } from './orchestrator';
import { DevOrchestratorTelegramAlert } from './telegram-alert';

const app = express();
const PORT = process.env.PORT || 6050; // New port for the orchestrator itself

// --- Setup ---
app.use(cors());
app.use(express.json());

const orchestrator = new Orchestrator(path.join(__dirname, 'services.config.json'));
const telegramAlert = new DevOrchestratorTelegramAlert();

// --- API Endpoints ---

// GET /api/dev/status -> status of all services
app.get('/api/dev/status', (req, res) => {
  const status = orchestrator.getStatus();
  res.json({ success: true, data: status });
});

// POST /api/dev/start-all -> start all services
app.post('/api/dev/start-all', async (req, res) => {
  try {
    const started = await orchestrator.startAll();
    res.json({ success: true, message: 'All services are being started.', started });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/dev/stop-all -> stop all services
app.post('/api/dev/stop-all', (req, res) => {
  try {
    const stopped = orchestrator.stopAll();
    res.json({ success: true, message: 'All services are being stopped.', stopped });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/dev/start/:serviceName -> start a specific service
app.post('/api/dev/start/:serviceName', async (req, res) => {
  const { serviceName } = req.params;
  const success = await orchestrator.startService(serviceName);
  if (success) {
    res.json({ success: true, message: `Service '${serviceName}' is being started.` });
  } else {
    res.status(404).json({ success: false, error: `Service '${serviceName}' not found in config.` });
  }
});

// POST /api/dev/stop/:serviceName -> stop a specific service
app.post('/api/dev/stop/:serviceName', (req, res) => {
  const { serviceName } = req.params;
  const success = orchestrator.stopService(serviceName);
  if (success) {
    res.json({ success: true, message: `Service '${serviceName}' has been stopped.` });
  } else {
    res.status(404).json({ success: false, error: `Service '${serviceName}' not found or not running.` });
  }
});

// POST /api/dev/restart/:serviceName -> restart a specific service
app.post('/api/dev/restart/:serviceName', async (req, res) => {
    const { serviceName } = req.params;
    orchestrator.stopService(serviceName);
    // Give it a moment to die before restarting
    setTimeout(async () => {
        const success = await orchestrator.startService(serviceName);
        if (success) {
            res.json({ success: true, message: `Service '${serviceName}' is being restarted.` });
        } else {
            res.status(404).json({ success: false, error: `Service '${serviceName}' not found in config.` });
        }
    }, 1000);
});

// GET /api/dev/telegram/status -> status of Telegram alerts
app.get('/api/dev/telegram/status', (req, res) => {
  const status = telegramAlert.getStatus();
  res.json({ success: true, data: status });
});

// POST /api/dev/telegram/test -> send test Telegram message
app.post('/api/dev/telegram/test', async (req, res) => {
  try {
    const success = await telegramAlert.sendTestMessage();
    res.json({
      success,
      message: success ? 'Test message sent successfully' : 'Failed to send test message'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// --- Server Start ---
app.listen(PORT, async () => {
  console.log(`🚀 Dev Orchestrator Service started on http://localhost:${PORT}`);
  try {
    await orchestrator.loadConfig();

    // Инициализируем Telegram алерты с Orchestrator
    telegramAlert.initializeWithOrchestrator(orchestrator);

    // Optional: auto-start all services on orchestrator boot
    // orchestrator.startAll();
  } catch (error) {
    console.error("❌ Orchestrator failed to initialize. Please check the config file.");
    process.exit(1);
  }
});
