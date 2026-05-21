// order/routes/purchase.js
// Lab 2: after logging an order locally, syncs it to the peer order replica.

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const ordersPath = path.join(__dirname, "../data/orders.json");

function readOrders() {
  if (!fs.existsSync(ordersPath)) return [];
  return JSON.parse(fs.readFileSync(ordersPath, "utf8"));
}

function writeOrders(data) {
  fs.writeFileSync(ordersPath, JSON.stringify(data, null, 2));
}

// POST /purchase/:id
async function purchaseBook(req, res) {
  const bookId = parseInt(req.params.id);

  const CATALOG_URL = "http://localhost:3001";

  // Determine peer based on which port we are listening on
  const myPort = String(process.env.PORT || "3002").trim();
  const PEER_ORDER_URL =
    myPort === "3004" ? "http://localhost:3002" : "http://localhost:3004";

  console.log(
    `[Order:${myPort}] Purchase request for book ${bookId}, peer → ${PEER_ORDER_URL}`,
  );

  try {
    // Step 1: Get book info from catalog
    const catalogRes = await axios.get(`${CATALOG_URL}/info/${bookId}`);
    const book = catalogRes.data;
    console.log(
      `[Order:${myPort}] Got book: ${book.title}, quantity: ${book.quantity}`,
    );

    // Step 2: Check stock
    if (book.quantity <= 0) {
      return res.status(400).json({ error: "Book out of stock" });
    }

    // Step 3: Decrement quantity in catalog
    const newQuantity = book.quantity - 1;
    await axios.put(`${CATALOG_URL}/update/${bookId}`, {
      quantity: newQuantity,
    });

    // Step 4: Log order locally
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
    console.log(
      `[Order:${myPort}] Logged order ${order.orderId} for book ${bookId}`,
    );

    // Step 5: Sync to peer replica
    if (!req.query.sync) {
      try {
        await axios.post(`${PEER_ORDER_URL}/sync/order?sync=true`, { order });
        console.log(
          `[Order:${myPort}] Synced order ${order.orderId} to ${PEER_ORDER_URL}`,
        );
      } catch (err) {
        console.warn(`[Order:${myPort}] Could not sync to peer:`, err.message);
      }
    }

    res.json({ message: "Purchase successful", order });
  } catch (error) {
    console.error(`[Order:${myPort}] Error:`, error.message);
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.status(500).json({ error: "Purchase failed", details: error.message });
  }
}

module.exports = { purchaseBook };
