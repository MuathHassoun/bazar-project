const express = require('express');
const bodyParser = require('body-parser');
const { searchBooks } = require('./routes/search');
const { getBookInfo } = require('./routes/info');
const { purchaseBook } = require('./routes/purchase');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Routes
app.get('/search/:topic', searchBooks);
app.get('/info/:id', getBookInfo);
app.post('/purchase/:id', purchaseBook);

// Start server
app.listen(PORT, () => {
  console.log(`Frontend Server running on http://localhost:${PORT}`);
});
