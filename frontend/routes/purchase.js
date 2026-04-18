const axios = require('axios');

const ORDER_URL = process.env.ORDER_URL || 'http://localhost:3002';

// POST /purchase/:id - proxy call to order service
async function purchaseBook(req, res) {
  const bookId = req.params.id;
  
  try {
    const orderRes = await axios.post(`${ORDER_URL}/purchase/${bookId}`);
    res.json(orderRes.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: 'Book not found' });
    }
    if (error.response && error.response.status === 400) {
      return res.status(400).json({ error: error.response.data.error });
    }
    res.status(500).json({ error: 'Purchase failed', details: error.message });
  }
}

module.exports = { purchaseBook };
