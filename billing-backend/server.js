// server.js - SQLite backend loading schema.sql
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
app.use(cors());
app.use(express.json());

// DB path
const dbPath = path.join(__dirname, "database", "billing.db");
const db = new Database(dbPath);

// Load schema.sql
const schemaPath = path.join(__dirname, "database", "schema.sql");
const schemaSql = fs.readFileSync(schemaPath, "utf8");

// Run schema if tables missing
const tableCheck = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='products'")
  .get();

if (!tableCheck) {
  console.log("⚡ Running schema.sql to initialize DB...");
  db.exec(schemaSql);
  console.log("✔ Database initialized from schema.sql");
}

/* GET /products */
app.get("/products", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM products ORDER BY id").all();
    res.json(rows);
  } catch (err) {
    console.error("GET /products error", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* POST /bill */
app.post("/bill", (req, res) => {
  const { customer_name, items } = req.body;
  if (!customer_name || !items || items.length === 0) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const doBill = db.transaction(() => {
      let totalAmount = 0;
      const billResult = db
        .prepare("INSERT INTO bills (customer_name, total_amount) VALUES (?, ?)")
        .run(customer_name, 0);
      const billId = billResult.lastInsertRowid;

      const getProduct = db.prepare("SELECT * FROM products WHERE id = ?");
      const insertItem = db.prepare(
        "INSERT INTO bill_items (bill_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)"
      );
      const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

      for (const item of items) {
        const product = getProduct.get(item.product_id);
        if (!product) throw new Error("Product not found");
        if (item.quantity > product.stock) throw new Error(`Not enough stock for ${product.name}`);
        const lineTotal = product.price * item.quantity;
        totalAmount += lineTotal;

        insertItem.run(billId, item.product_id, item.quantity, product.price, lineTotal);
        updateStock.run(item.quantity, item.product_id);
      }

      db.prepare("UPDATE bills SET total_amount = ? WHERE id = ?").run(totalAmount, billId);
      return billId;
    });

    const newBillId = doBill();
    res.status(201).json({ bill_id: newBillId });
  } catch (err) {
    console.error("POST /bill error", err);
    res.status(500).json({ error: err.message });
  }
});

/* GET /bill/:id */
app.get("/bill/:id", (req, res) => {
  const billId = req.params.id;
  const bill = db.prepare("SELECT * FROM bills WHERE id = ?").get(billId);
  if (!bill) return res.status(404).json({ error: "Bill not found" });

  const items = db.prepare(`
    SELECT bi.*, p.name AS product_name
    FROM bill_items bi
    JOIN products p ON bi.product_id = p.id
    WHERE bi.bill_id = ?
  `).all(billId);

  res.json({ bill, items });
});

/* GET /customer/:name/bills */
app.get("/customer/:name/bills", (req, res) => {
  const name = req.params.name;
  const bills = db.prepare("SELECT id, total_amount, created_at FROM bills WHERE customer_name = ? ORDER BY id DESC").all(name);
  res.json({ customer: name, bills });
});

// GET BILLS OF A CUSTOMER
app.get("/bills/:customerName", (req, res) => {
  const { customerName } = req.params;

  const bills = db.prepare(
    "SELECT * FROM bills WHERE customer_name = ? ORDER BY id DESC"
  ).all(customerName);

  if (!bills.length) {
    return res.json({ exists: false, bills: [] });
  }

  res.json({ exists: true, bills });
});

// GET all bills for a customer
app.get("/bills/:customer", (req, res) => {
  const customer = req.params.customer;

  const bills = db.prepare(
    `SELECT id, total_amount, created_at
     FROM bills
     WHERE customer_name = ?
     ORDER BY id DESC`
  ).all(customer);

  res.json({ bills });
});


/* Optional: PUT /products/:id/stock */
app.put("/products/:id/stock", (req, res) => {
  const id = Number(req.params.id);
  const { stock } = req.body;
  if (!Number.isInteger(stock) || stock < 0) return res.status(400).json({ error: "Invalid stock" });
  const result = db.prepare("UPDATE products SET stock = ? WHERE id = ?").run(stock, id);
  if (result.changes === 0) return res.status(404).json({ error: "Product not found" });
  res.json({ success: true });
});

// RESET ALL STOCKS TO DEFAULT VALUE
app.post("/reset-stock", (req, res) => {
  try {
    // Set default stock for ALL products (you can change 500 to any number)
    db.prepare("UPDATE products SET stock = 500").run();

    res.json({ message: "Stock reset successfully" });
  } catch (err) {
    console.error("Reset stock error:", err);
    res.status(500).json({ error: "Failed to reset stock" });
  }
});

/* Optional reset (testing) */
app.put("/reset-stock", (req, res) => {
  // reset stock to the values in schema.sql (quick hardcoded default)
  db.exec(`
    UPDATE products SET stock = CASE id
      WHEN 1 THEN 500
      WHEN 2 THEN 1000
      WHEN 3 THEN 950
      WHEN 4 THEN 600
      WHEN 5 THEN 450
      WHEN 6 THEN 800
      WHEN 7 THEN 700
      WHEN 8 THEN 400
      WHEN 9 THEN 300
      WHEN 10 THEN 500
      WHEN 11 THEN 220
      WHEN 12 THEN 600
      WHEN 13 THEN 350
      WHEN 14 THEN 650
      WHEN 15 THEN 720
      WHEN 16 THEN 300
      WHEN 17 THEN 480
      WHEN 18 THEN 900
      WHEN 19 THEN 260
      WHEN 20 THEN 200
      ELSE stock END;
  `);
  res.json({ message: "Stock reset to defaults" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running at http://localhost:${PORT}`));
