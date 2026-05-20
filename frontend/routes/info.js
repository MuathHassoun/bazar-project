// frontend/routes/info.js
// Lab 2: checks cache first, on miss fetches from a catalog replica (round-robin),
// then stores the result in cache for future requests.

const axios = require("axios");
const cache = require("../cache");

// GET /info/:id
async function getBookInfo(req, res) {
  const bookId = req.params.id;

  // ── Step 1: Check cache ───────────────────────────────────────────────────
  const cached = cache.get(bookId);
  if (cached) {
    return res.json({ ...cached, source: "cache" });
  }

  // ── Step 2: Cache miss → pick a catalog replica (round-robin) ────────────
  const catalogUrl = req.app.locals.getNextReplica("catalog");

  try {
    const catalogRes = await axios.get(`${catalogUrl}/info/${bookId}`);
    const data = catalogRes.data;

    // ── Step 3: Store result in cache for next request ────────────────────
    cache.set(bookId, data);

    return res.json({ ...data, source: "catalog" });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: "Book not found" });
    }
    res
      .status(500)
      .json({ error: "Info lookup failed", details: error.message });
  }
}

module.exports = { getBookInfo };
