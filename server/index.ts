import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { EventEmitter } from 'events';
import { sentinelMiddleware } from './middleware';
import { closeDatabase, getAlerts, initializeDatabase } from './db';

const app = express();
const port = process.env.PORT || 3000;

// Setup in-memory event emitter for SSE
const eventBus = new EventEmitter();
// @ts-ignore
app.on('new-alert', () => {
  eventBus.emit('alert');
});

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const upload = multer({ storage: multer.memoryStorage() });

// Multipart bodies must be parsed before Sentinel so the upload detector can inspect req.file.
app.use('/upload', upload.single('file'));

// --- SENTINEL MIDDLEWARE PIPELINE ---
app.use(sentinelMiddleware);

// --- TOY API ENDPOINTS ---

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password123') {
    res.json({ success: true, token: 'fake-jwt-token' });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

app.get('/search', (req: Request, res: Response) => {
  const q = req.query.q || '';
  // Simulate DB search
  res.json({ results: [`Result for ${q}`] });
});

app.get('/fetch', (req: Request, res: Response) => {
  const url = req.query.url;
  // Simulate fetching a remote resource
  res.json({ message: `Fetched from ${url} successfully.` });
});

app.post('/upload', (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ message: `File ${req.file.originalname} uploaded successfully.` });
});

app.get('/profile/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  // Simulate profile lookup
  res.json({ id, name: `User ${id}` });
});

// --- DASHBOARD API ENDPOINTS ---

// Fetch past alerts
app.get('/alerts', async (req: Request, res: Response) => {
  try {
    const alerts = await getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Server-Sent Events for real-time dashboard
app.get('/alerts/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE

  const onAlert = async () => {
    // Just fetch the latest 10 and send them, frontend can deduplicate
    // or just fetch the most recent 1.
    const alerts = await getAlerts();
    res.write(`data: ${JSON.stringify(alerts[0])}\n\n`);
  };

  eventBus.on('alert', onAlert);

  req.on('close', () => {
    eventBus.off('alert', onAlert);
    res.end();
  });
});

async function startServer() {
  try {
    await initializeDatabase();
    const server = app.listen(port, () => {
      console.log(`SentinelAPI server listening on http://localhost:${port}`);
      console.log('PostgreSQL connection and alerts table are ready.');
    });

    const shutdown = () => {
      server.close(() => {
        closeDatabase()
          .catch(err => console.error('Failed to close PostgreSQL pool:', err))
          .finally(() => process.exit(0));
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Failed to initialize PostgreSQL:', err);
    process.exit(1);
  }
}

startServer();
