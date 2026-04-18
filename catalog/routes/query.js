const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../data/catalog.json');

// Helper function to read catalog fresh each time
function readCatalog() {
  return JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
}

// GET /search/:topic - returns all books in a topic
function searchByTopic(req, res) {
  const topic = req.params.topic;
  const catalog = readCatalog();
  const books = catalog.filter(book => book.topic === topic);
  
  if (books.length === 0) {
    return res.status(404).json({ error: 'No books found for this topic' });
  }
  
  res.json(books);
}

// GET /info/:id - returns details for a single book
function getBookInfo(req, res) {
  const catalog = readCatalog();
  const id = parseInt(req.params.id);
  const book = catalog.find(b => b.id === id);
  
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  
  res.json(book);
}

module.exports = { searchByTopic, getBookInfo };
