// frontend/server.js
// Lab 2: added /invalidate/:id endpoint + load balancer config
// The front-end is NOT replicated; it receives all client requests.

const express = require("express");
const bodyParser = require("body-parser");
const { searchBooks } = require("./routes/search");
const { getBookInfo } = require("./routes/info");
const { purchaseBook } = require("./routes/purchase");
const cache = require("./cache");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// ─── Load balancer config ────────────────────────────────────────────────────
// Round-robin counters (one per service)
const lb = {
  catalog: {
    replicas: ["http://localhost:3001", "http://localhost:3003"],
    index: 0,
  },
  order: {
    replicas: ["http://localhost:3002", "http://localhost:3004"],
    index: 0,
  },
};

/**
 * Returns the next replica URL for the given service using round-robin.
 * Usage: getNextReplica('catalog')  →  'http://localhost:3001' or '...3003'
 */
function getNextReplica(service) {
  const entry = lb[service];
  const url = entry.replicas[entry.index];
  entry.index = (entry.index + 1) % entry.replicas.length;
  console.log(`[LB] Routing ${service} request to ${url}`);
  return url;
}

// Export so route files can call it
app.locals.getNextReplica = getNextReplica;

// ─── Client-facing routes (unchanged from Lab 1) ─────────────────────────────
app.get("/search/:topic", searchBooks);
app.get("/info/:id", getBookInfo);
app.post("/purchase/:id", purchaseBook);

// ─── Cache invalidation endpoint (called by catalog/order replicas) ──────────
// When a replica is about to write (buy or update), it calls:
//   DELETE http://localhost:3000/invalidate/:id
app.delete("/invalidate/:id", (req, res) => {
  const bookId = req.params.id;
  const removed = cache.invalidate(bookId);
  res.json({ invalidated: removed, bookId });
});

// ─── Cache stats endpoint (useful for measurements/debugging) ─────────────────
app.get("/cache/stats", (req, res) => {
  res.json(cache.stats());
});

// Start server
app.listen(PORT, () => {
  console.log(`Frontend Server running on http://localhost:${PORT}`);
  console.log(`Catalog replicas: ${lb.catalog.replicas.join(", ")}`);
  console.log(`Order replicas:   ${lb.order.replicas.join(", ")}`);
});
