const axios = require('axios');

const CATALOG_URL = process.env.CATALOG_URL || 'http://localhost:3001';

// GET /search/:topic - proxy call to catalog service
async function searchBooks(req, res) {
  const topic = req.params.topic;
  
  try {
    const catalogRes = await axios.get(`${CATALOG_URL}/search/${topic}`);
    res.json(catalogRes.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: 'No books found for this topic' });
    }
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
}

module.exports = { searchBooks };
