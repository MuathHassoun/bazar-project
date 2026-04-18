const axios = require('axios');

const CATALOG_URL = process.env.CATALOG_URL || 'http://localhost:3001';

// GET /info/:id - proxy call to catalog service
async function getBookInfo(req, res) {
  const bookId = req.params.id;
  
  try {
    const catalogRes = await axios.get(`${CATALOG_URL}/info/${bookId}`);
    res.json(catalogRes.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.status(500).json({ error: 'Info lookup failed', details: error.message });
  }
}

module.exports = { getBookInfo };
