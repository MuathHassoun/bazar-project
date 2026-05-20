// catalog/routes/update.js
// Lab 2: before writing, invalidates the frontend cache for this book,
// then syncs the update to the peer catalog replica to keep both in sync.

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const catalogPath = path.join(__dirname, "../data/catalog.json");

// Injected via environment variables so both replicas use the same code
// Replica 1: FRONTEND_URL=http://localhost:3000  PEER_CATALOG_URL=http://localhost:3003
// Replica 2: FRONTEND_URL=http://localhost:3000  PEER_CATALOG_URL=http://localhost:3001
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const PEER_CATALOG_URL = process.env.PEER_CATALOG_URL || null;

// Helper to read catalog
function readCatalog() {
  return JSON.parse(fs.readFileSync(catalogPath, "utf8"));
}

// Helper to write catalog
function writeCatalog(data) {
  fs.writeFileSync(catalogPath, JSON.stringify(data, null, 2));
}

// PUT /update/:id
async function updateBook(req, res) {
  const id = parseInt(req.params.id);
  const { price, quantity } = req.body;

  // ── Step 1: Invalidate cache BEFORE writing (strong consistency) ──────────
  try {
    await axios.delete(`${FRONTEND_URL}/invalidate/${id}`);
    console.log(`[Catalog] Cache invalidated for book ${id}`);
  } catch (err) {
    // Non-fatal: log and continue — cache miss is safe, stale data is not
    console.warn(
      `[Catalog] Could not invalidate cache for book ${id}:`,
      err.message,
    );
  }

  // ── Step 2: Apply the write locally ──────────────────────────────────────
  const catalog = readCatalog();
  const book = catalog.find((b) => b.id === id);

  if (!book) {
    return res.status(404).json({ error: "Book not found" });
  }

  if (price !== undefined) book.price = price;
  if (quantity !== undefined) book.quantity = quantity;

  writeCatalog(catalog);
  console.log(`[Catalog] Updated book ${id} locally`);

  // ── Step 3: Sync update to peer replica ───────────────────────────────────
  // The sync flag prevents an infinite loop (replica A → replica B → replica A)
  if (PEER_CATALOG_URL && !req.query.sync) {
    try {
      await axios.put(`${PEER_CATALOG_URL}/update/${id}?sync=true`, {
        price,
        quantity,
      });
      console.log(
        `[Catalog] Synced update for book ${id} to peer ${PEER_CATALOG_URL}`,
      );
    } catch (err) {
      console.warn(
        `[Catalog] Could not sync to peer for book ${id}:`,
        err.message,
      );
    }
  }

  res.json({ message: "Book updated", book });
}

module.exports = { updateBook };
