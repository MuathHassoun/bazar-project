// order/server.js
// Lab 2: added PEER_ORDER_URL env var and POST /sync/order endpoint
// so replicas can receive synced order logs from each other.

const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { purchaseBook } = require("./routes/purchase");

const app = express();

// Replica 1 runs on 3002, Replica 2 runs on 3004
const PORT = process.env.PORT || 3002;

const ordersPath = path.join(__dirname, "data/orders.json");

// Middleware
app.use(bodyParser.json());

// ── Existing route (unchanged from Lab 1) ─────────────────────────────────────
app.post("/purchase/:id", purchaseBook);

// ── Sync endpoint: receives a replicated order from the peer replica ──────────
// The peer calls POST /sync/order?sync=true with { order } in the body.
// We simply append it to our local orders.json to stay in sync.
app.post("/sync/order", (req, res) => {
  const { order } = req.body;
  if (!order) {
    return res.status(400).json({ error: "Missing order in request body" });
  }

  try {
    const orders = fs.existsSync(ordersPath)
      ? JSON.parse(fs.readFileSync(ordersPath, "utf8"))
      : [];

    // Avoid duplicates if sync is called more than once
    const exists = orders.some((o) => o.orderId === order.orderId);
    if (!exists) {
      orders.push(order);
      fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
      console.log(`[Order] Received synced order ${order.orderId} from peer`);
    }

    res.json({ message: "Order synced", orderId: order.orderId });
  } catch (err) {
    res.status(500).json({ error: "Sync failed", details: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Order Server running on http://localhost:${PORT}`);
  console.log(
    `Peer replica: ${process.env.PEER_ORDER_URL || "none (set PEER_ORDER_URL)"}`,
  );
  console.log(
    `Catalog:      ${process.env.CATALOG_URL || "http://localhost:3001 (default)"}`,
  );
});
