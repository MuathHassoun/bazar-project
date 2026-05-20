// catalog/server.js
// Lab 2: added PEER_CATALOG_URL env var and /sync/catalog endpoint
// so replicas can receive synced writes from each other.

const express = require("express");
const bodyParser = require("body-parser");
const { searchByTopic, getBookInfo } = require("./routes/query");
const { updateBook } = require("./routes/update");

const app = express();

// Replica 1 runs on 3001, Replica 2 runs on 3003
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());

// ── Existing routes (unchanged from Lab 1) ────────────────────────────────────
app.get("/search/:topic", searchByTopic);
app.get("/info/:id", getBookInfo);
app.put("/update/:id", updateBook);

// Start server
app.listen(PORT, () => {
  console.log(`Catalog Server running on http://localhost:${PORT}`);
  console.log(
    `Peer replica: ${process.env.PEER_CATALOG_URL || "none (set PEER_CATALOG_URL)"}`,
  );
  console.log(
    `Frontend:     ${process.env.FRONTEND_URL || "http://localhost:3000 (default)"}`,
  );
});
