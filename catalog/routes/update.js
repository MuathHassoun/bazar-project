// catalog/routes/update.js
// Lab 2: before writing, invalidates the frontend cache,
// then syncs the update to the peer catalog replica.

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const catalogPath = path.join(__dirname, "../data/catalog.json");

function readCatalog() {
  return JSON.parse(fs.readFileSync(catalogPath, "utf8"));
}

function writeCatalog(data) {
  fs.writeFileSync(catalogPath, JSON.stringify(data, null, 2));
}

// PUT /update/:id
async function updateBook(req, res) {
  const id = parseInt(req.params.id);
  const { price, quantity } = req.body;

  // Hardcoded URLs — same fix as order server
  const FRONTEND_URL = "http://localhost:3000";
  const myPort = String(process.env.PORT || "3001").trim();
  const PEER_CATALOG_URL =
    myPort === "3003" ? "http://localhost:3001" : "http://localhost:3003";

  console.log(`[Catalog:${myPort}] Update request for book ${id}`);

  // Step 1: Invalidate cache BEFORE writing
  try {
    await axios.delete(`${FRONTEND_URL}/invalidate/${id}`);
    console.log(`[Catalog:${myPort}] Cache invalidated for book ${id}`);
  } catch (err) {
    console.warn(
      `[Catalog:${myPort}] Could not invalidate cache for book ${id}:`,
      err.message,
    );
  }

  // Step 2: Apply the write locally
  const catalog = readCatalog();
  const book = catalog.find((b) => b.id === id);

  if (!book) {
    return res.status(404).json({ error: "Book not found" });
  }

  if (price !== undefined) book.price = price;
  if (quantity !== undefined) book.quantity = quantity;

  writeCatalog(catalog);
  console.log(
    `[Catalog:${myPort}] Updated book ${id} locally, quantity: ${book.quantity}`,
  );

  // Step 3: Sync to peer replica
  if (!req.query.sync) {
    try {
      await axios.put(`${PEER_CATALOG_URL}/update/${id}?sync=true`, {
        price,
        quantity,
      });
      console.log(
        `[Catalog:${myPort}] Synced book ${id} to peer ${PEER_CATALOG_URL}`,
      );
    } catch (err) {
      console.warn(`[Catalog:${myPort}] Could not sync to peer:`, err.message);
    }
  }

  res.json({ message: "Book updated", book });
}

module.exports = { updateBook };
