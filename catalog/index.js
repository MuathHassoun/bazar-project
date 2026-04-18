const express = require('express');
const bodyParser = require('body-parser');
const { searchByTopic, getBookInfo } = require('./routes/query');
const { updateBook } = require('./routes/update');

const app = express();
const PORT = 3001;

// Middleware
app.use(bodyParser.json());

// Routes for query
app.get('/search/:topic', searchByTopic);
app.get('/info/:id', getBookInfo);

// Route for update
app.put('/update/:id', updateBook);

// Start server
app.listen(PORT, () => {
  console.log(`Catalog Server running on http://localhost:${PORT}`);
});
