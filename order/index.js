// order/index.js
// Lab 2: reads PORT, CATALOG_URL, PEER_ORDER_URL from env vars

const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = parseInt(process.env.PORT) || 3002;

// Set defaults here so routes can use process.env safely
if (!process.env.CATALOG_URL) process.env.CATALOG_URL = "http://localhost:3001";
if (!process.env.PEER_ORDER_URL)
  process.env.PEER_ORDER_URL = "http://localhost:3004";

const { purchaseBook } = require("./routes/purchase");
const ordersPath = path.join(__dirname, "data/orders.json");

app.use(bodyParser.json());

// Purchase route
app.post("/purchase/:id", purchaseBook);

// Sync endpoint: receives replicated order from peer replica
app.post("/sync/order", (req, res) => {
  const { order } = req.body;
  if (!order) {
    return res.status(400).json({ error: "Missing order in request body" });
  }

  try {
    const orders = fs.existsSync(ordersPath)
      ? JSON.parse(fs.readFileSync(ordersPath, "utf8"))
      : [];

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

app.listen(PORT, () => {
  console.log(`Order Server running on http://localhost:${PORT}`);
  console.log(`Catalog:      ${process.env.CATALOG_URL}`);
  console.log(`Peer replica: ${process.env.PEER_ORDER_URL}`);
});
