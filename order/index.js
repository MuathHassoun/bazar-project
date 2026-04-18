const express = require('express');
const bodyParser = require('body-parser');
const { purchaseBook } = require('./routes/purchase');

const app = express();
const PORT = 3002;

// Middleware
app.use(bodyParser.json());

// Route for purchase
app.post('/purchase/:id', purchaseBook);

// Start server
app.listen(PORT, () => {
  console.log(`Order Server running on http://localhost:${PORT}`);
});
