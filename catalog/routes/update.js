const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../data/catalog.json');

// Helper function to read catalog
function readCatalog() {
  return JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
}

// Helper function to write catalog
function writeCatalog(data) {
  fs.writeFileSync(catalogPath, JSON.stringify(data, null, 2));
}

// PUT /update/:id - update price or quantity
function updateBook(req, res) {
  const id = parseInt(req.params.id);
  const { price, quantity } = req.body;
  
  const catalog = readCatalog();
  const book = catalog.find(b => b.id === id);
  
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  
  // Update only provided fields
  if (price !== undefined) {
    book.price = price;
  }
  if (quantity !== undefined) {
    book.quantity = quantity;
  }
  
  writeCatalog(catalog);
  
  res.json({ message: 'Book updated', book });
}

module.exports = { updateBook };
