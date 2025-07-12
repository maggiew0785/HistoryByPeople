const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/grounding', require('./routes/grounding'));
app.use('/prompts', require('./routes/prompts'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
