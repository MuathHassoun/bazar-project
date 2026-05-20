// frontend/routes/purchase.js
// Lab 2: routes purchase requests to order replicas using round-robin load balancing.

const axios = require("axios");

// POST /purchase/:id
async function purchaseBook(req, res) {
  const bookId = req.params.id;

  // Pick an order replica using round-robin
  const orderUrl = req.app.locals.getNextReplica("order");

  try {
    const orderRes = await axios.post(`${orderUrl}/purchase/${bookId}`);
    return res.json(orderRes.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: "Book not found" });
    }
    if (error.response && error.response.status === 400) {
      return res.status(400).json({ error: error.response.data.error });
    }
    res.status(500).json({ error: "Purchase failed", details: error.message });
  }
}

module.exports = { purchaseBook };
