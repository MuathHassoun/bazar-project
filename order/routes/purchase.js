// order/routes/purchase.js
// Lab 2: after logging an order locally, syncs it to the peer order replica.
// Cache invalidation is handled by catalog/routes/update.js when stock is decremented.

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const ordersPath = path.join(__dirname, "../data/orders.json");

// Replica 1: CATALOG_URL=http://localhost:3001  PEER_ORDER_URL=http://localhost:3004
// Replica 2: CATALOG_URL=http://localhost:3003  PEER_ORDER_URL=http://localhost:3002
const CATALOG_URL = process.env.CATALOG_URL || "http://localhost:3001";
const PEER_ORDER_URL = process.env.PEER_ORDER_URL || null;

// Helper to read orders
function readOrders() {
  if (!fs.existsSync(ordersPath)) return [];
  return JSON.parse(fs.readFileSync(ordersPath, "utf8"));
}

// Helper to write orders
function writeOrders(data) {
  fs.writeFileSync(ordersPath, JSON.stringify(data, null, 2));
}

// POST /purchase/:id
async function purchaseBook(req, res) {
  const bookId = parseInt(req.params.id);

  try {
    // ── Step 1: Get book info from catalog ──────────────────────────────────
    const catalogRes = await axios.get(`${CATALOG_URL}/info/${bookId}`);
    const book = catalogRes.data;

    // ── Step 2: Check stock ─────────────────────────────────────────────────
    if (book.quantity <= 0) {
      return res.status(400).json({ error: "Book out of stock" });
    }

    // ── Step 3: Decrement quantity in catalog
    //    update.js will invalidate the cache and sync to the peer catalog replica
    const newQuantity = book.quantity - 1;
    const updateRes = await axios.put(`${CATALOG_URL}/update/${bookId}`, {
      quantity: newQuantity,
    });

    if (!updateRes.data) {
      throw new Error("Catalog update failed");
    }

    // ── Step 4: Log order locally ───────────────────────────────────────────
    const orders = readOrders();
    const order = {
      orderId: orders.length + 1,
      bookId: bookId,
      title: book.title,
      price: book.price,
      timestamp: new Date().toISOString(),
    };
    orders.push(order);
    writeOrders(orders);
    console.log(`[Order] Logged order ${order.orderId} for book ${bookId}`);

    // ── Step 5: Sync order log to peer order replica ────────────────────────
    // ?sync=true flag prevents the peer from syncing back (no infinite loop)
    if (PEER_ORDER_URL && !req.query.sync) {
      try {
        await axios.post(`${PEER_ORDER_URL}/sync/order?sync=true`, { order });
        console.log(
          `[Order] Synced order ${order.orderId} to peer ${PEER_ORDER_URL}`,
        );
      } catch (err) {
        console.warn(`[Order] Could not sync order to peer:`, err.message);
      }
    }

    // ── Step 6: Return success ──────────────────────────────────────────────
    res.json({ message: "Purchase successful", order });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.status(500).json({ error: "Purchase failed", details: error.message });
  }
}

module.exports = { purchaseBook };
