// frontend/routes/search.js
// Lab 2: routes search requests to catalog replicas using round-robin load balancing.
// Search results are NOT cached (caching is only for item-level info lookups).

const axios = require("axios");

// GET /search/:topic
async function searchBooks(req, res) {
  const topic = req.params.topic;

  // Pick a catalog replica using round-robin
  const catalogUrl = req.app.locals.getNextReplica("catalog");

  try {
    const catalogRes = await axios.get(`${catalogUrl}/search/${topic}`);
    return res.json(catalogRes.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: "No books found for this topic" });
    }
    res.status(500).json({ error: "Search failed", details: error.message });
  }
}

module.exports = { searchBooks };
