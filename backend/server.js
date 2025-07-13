const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));

// Rate limiting for chat endpoint
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many chat requests, please try again later.'
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/grounding', require('./routes/grounding'));
app.use('/prompts', require('./routes/prompts'));
app.use('/api/chat', chatLimiter, require('./routes/chat'));
app.use('/api/visual', require('./routes/visual'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
