import express from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import the image analysis service
import { processUploadedImage, textToImageWithAI } from './imageAnalysisService.js';

// Load environment variables
dotenv.config();

// Debug: Check if environment variables are loaded
console.log('Environment variables loaded:');
console.log('- PORT:', process.env.PORT);
console.log('- HUGGINGFACE_API_TOKEN exists:', !!process.env.HUGGINGFACE_API_TOKEN);

// Get current directory name (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;
const io = new Server(httpServer, {
  transports: ['polling'],
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('Client connected');
  
  // For practice: check API status every 5 seconds
  const interval = setInterval(async () => {
    try {
      const response = await fetch('https://api-inference.huggingface.co');
      const status = response.ok ? 'online' : 'offline';
      socket.emit('status_update', { status });
    } catch (error) {
      socket.emit('status_update', { 
        status: 'error', 
        message: error.message 
      });
    }
  }, 5000);
  
  socket.on('disconnect', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Add a simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend API is working!' });
});

// In development, Vite serves the frontend
// In production, we serve from the dist directory where Vite builds to
const frontendPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../dist')
  : path.join(__dirname, '../dist');  // Always use dist for simplicity

// Check if the frontend path exists
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  console.log(`Serving frontend from: ${frontendPath}`);
} else {
  console.log(`Warning: Frontend path not found: ${frontendPath}`);
  console.log('Make sure to build the frontend with: npm run build');
}

// Configure multer for handling image uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadsDir = path.join(__dirname, '../uploads');
    // Make sure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function(req, file, cb) {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// API endpoint for image analysis
app.post('/api/analyze-image', (req, res, next) => {
  console.log('API endpoint hit: /api/analyze-image');
  next();
}, upload.single('image'), async (req, res) => {
  try {
    console.log('Processing image upload');
    
    if (!req.file) {
      console.log('No file was uploaded');
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('File uploaded successfully:', req.file.originalname);
    
    try {
      // Process the image using our service
      console.log('Analyzing image...');
      const results = await processUploadedImage(req);
      console.log('Analysis complete');
      
      console.log('Sending response');
      res.json(results);
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze image' });
  }
});

app.post('/api/generate-image', async (req, res) => {
  console.log(req.body)
  const { prompt } = req.body;
  try {
    const imageBuffer = await textToImageWithAI(prompt);
    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (error) {
    res.status(500).send({ error: 'Failed to generate image' });
  }
});

// Serve the main app when a route doesn't match an API endpoint
app.get('*', (req, res, next) => {
  // Skip if it's an API route
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  const indexPath = path.join(frontendPath, 'index.html');
  
  // Check if the index.html file exists
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // If frontend isn't built yet, show a helpful message
    res.status(200).send(`
      <html>
        <head><title>Alt Text Generator API Server</title></head>
        <body>
          <h1>Alt Text Generator API Server is running</h1>
          <p>The backend API is running, but the frontend hasn't been built yet.</p>
          <p>To build the frontend:</p>
          <ol>
            <li>Run: <code>npm run build</code></li>
            <li>Restart the server</li>
          </ol>
          <p>For development with hot reloading, run:</p>
          <code>npm run dev</code>
          <p>The API is available at: <code>http://localhost:${port}/api/analyze-image</code></p>
        </body>
      </html>
    `);
  }
});

// Start the server
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API endpoint: http://localhost:${port}/api/analyze-image`);
  console.log(`Socket.IO server running and listening for connections`);
});