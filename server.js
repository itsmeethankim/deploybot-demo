const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Home route
app.get('/', (req, res) => {
  res.json({ message: 'Hello from DeployBot! 🚀' });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 DeployBot server running at http://localhost:${PORT}`);
});
