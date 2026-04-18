const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ordersPath = path.join(__dirname, '../data/orders.json');
const CATALOG_URL = process.env.CATALOG_URL || 'http://localhost:3001';

// Helper to read orders
function readOrders() {
  return JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
}

// Helper to write orders
function writeOrders(data) {
  fs.writeFileSync(ordersPath, JSON.stringify(data, null, 2));
}

// POST /purchase/:id - process a book purchase
async function purchaseBook(req, res) {
  const bookId = parseInt(req.params.id);
  
  try {
    // Step 1: Get book info from Catalog service
    const catalogRes = await axios.get(`${CATALOG_URL}/info/${bookId}`);
    const book = catalogRes.data;
    
    // Step 2: Check if stock available
    if (book.quantity <= 0) {
      return res.status(400).json({ error: 'Book out of stock' });
    }
    
    // Step 3: Decrement quantity in Catalog
    const newQuantity = book.quantity - 1;
    const updateRes = await axios.put(`${CATALOG_URL}/update/${bookId}`, { quantity: newQuantity });
    
    if (!updateRes.data) {
      throw new Error('Catalog update failed');
    }
    
    // Step 4: Log order locally
    const orders = readOrders();
    const order = {
      orderId: orders.length + 1,
      bookId: bookId,
      title: book.title,
      price: book.price,
      timestamp: new Date().toISOString()
    };
    
    orders.push(order);
    writeOrders(orders);
    
    // Step 5: Return success
    res.json({
      message: 'Purchase successful',
      order: order
    });
    
  } catch (error) {
    // Catalog service error or other issue
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.status(500).json({ error: 'Purchase failed', details: error.message });
  }
}

module.exports = { purchaseBook };
