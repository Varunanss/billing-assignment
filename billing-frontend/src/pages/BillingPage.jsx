import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function BillingPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("");
  const [qtyInputs, setQtyInputs] = useState({});
  const [billItems, setBillItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [toasts, setToasts] = useState([]);

  const TAX_PERCENT = 10;

  // Toast Function
  const showToast = (message, kind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
  };

  // Load Products
  useEffect(() => {
    API.get("/products")
      .then((r) => setProducts(r.data))
      .catch(() => showToast("Backend not running!", "error"));
  }, []);

  // Reset Stock
  const resetStock = async () => {
    try {
      await API.post("/reset-stock");
      const res = await API.get("/products");
      setProducts(res.data);
      showToast("Stock Reset Successfully!", "success");
    } catch {
      showToast("Failed to reset stock", "error");
    }
  };

  // Placeholder for “Show Bills”
  const showBills = () => {
    showToast("Show Bills UI coming soon!", "info");
  };

  const formatINR = (n) => `₹${Number(n).toFixed(2)}`;
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  const setQty = (productId, qty) => {
    if (qty === "" || qty === null) {
      setQtyInputs((s) => ({ ...s, [productId]: "" }));
      return;
    }
    const n = Number(qty);
    if (!Number.isNaN(n) && n >= 0) setQtyInputs((s) => ({ ...s, [productId]: n }));
  };

  const increment = (id) =>
    setQtyInputs((s) => ({ ...s, [id]: (Number(s[id] || 0) + 1) }));

  const decrement = (id) =>
    setQtyInputs((s) => {
      const cur = Number(s[id] || 0);
      const next = Math.max(0, cur - 1);
      return { ...s, [id]: next === 0 ? "" : next };
    });

  // Add to bill
  const addToBill = (p) => {
    const qty = Number(qtyInputs[p.id] || 0);

    if (!qty || qty <= 0) return showToast("Enter quantity", "warning");
    if (qty > p.stock) return showToast("Not enough stock", "error");

    setBillItems((prev) => [
      ...prev,
      {
        product_id: p.id,
        name: p.name,
        price: Number(p.price),
        qty,
        total: qty * p.price,
      },
    ]);

    setProducts((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, stock: x.stock - qty } : x))
    );

    showToast(`${p.name} added`, "success");
  };

  const removeBillRow = (idx) => {
    const item = billItems[idx];

    setProducts((prev) =>
      prev.map((p) =>
        p.id === item.product_id ? { ...p, stock: p.stock + item.qty } : p
      )
    );

    setBillItems((prev) => prev.filter((_, i) => i !== idx));
    showToast("Removed", "warning");
  };

  const subtotal = billItems.reduce((s, it) => s + it.total, 0);
  const tax = subtotal * (TAX_PERCENT / 100);
  const grandTotal = subtotal + tax;

  const saveBill = async () => {
    if (!customerName.trim()) return showToast("Enter customer name", "warning");
    if (billItems.length === 0) return showToast("Add items first", "warning");

    const payload = {
      customer_name: customerName,
      items: billItems.map((it) => ({
        product_id: it.product_id,
        quantity: it.qty,
      })),
    };

    try {
      const res = await API.post("/bill", payload);
      navigate("/bill-confirm", { state: { billId: res.data.bill_id } });
    } catch {
      showToast("Failed to save bill", "error");
    }
  };

  return (
    <div className="pos-root">
      {/* LEFT SECTION */}
      <div className="pos-left">

        {/* HEADER with Reset Stock button */}
        <header className="pos-header">
          <div className="brand">
            <div className="brand-name">Billing Assesment</div>
          </div>

          <div className="header-right">
            <button className="header-btn" onClick={resetStock}>Reset Stock</button>
            <span className="date">{new Date().toLocaleString()}</span>
          </div>
        </header>

        {/* SEARCH */}
        <div className="pos-search">
          <input
            type="search"
            placeholder="Search products..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        {/* PRODUCTS GRID */}
        <main className="product-grid">
          {filteredProducts.length === 0 ? (
            <div className="empty-grid">No products found</div>
          ) : (
            filteredProducts.map((p) => (
              <article className="product-card" key={p.id}>
                <div className="product-top">
                  <div className="product-name">{p.name}</div>
                  <div className={`stock-badge ${p.stock === 0 ? "out" : ""}`}>
                    {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                  </div>
                </div>

                <div className="product-mid">
                  <div className="price">{formatINR(p.price)}</div>
                </div>

                <div className="product-actions">
                  <div className="qty-controls">
                    <button className="qty-btn" onClick={() => decrement(p.id)}>-</button>
                    <input
                      className="qty-input"
                      type="number"
                      value={qtyInputs[p.id] ?? ""}
                      onChange={(e) =>
                        setQty(p.id, e.target.value === "" ? "" : Number(e.target.value))
                      }
                    />
                    <button className="qty-btn" onClick={() => increment(p.id)}>+</button>
                  </div>

                  <button
                    className="add-btn"
                    disabled={p.stock === 0}
                    onClick={() => addToBill(p)}
                  >
                    Add
                  </button>
                </div>
              </article>
            ))
          )}
        </main>
      </div>

      {/* RIGHT BILL PANEL */}
      <aside className="pos-right">
        <div className="bill-panel">
          <h2 className="panel-title">Current Bill</h2>

          <label className="customer-label">Customer</label>
          <input
            className="customer-field"
            placeholder="Enter customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <div className="cart-area">
            {billItems.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-emoji">🧾</div>
                <div>No items yet — add products</div>
              </div>
            ) : (
              <>
                <div className="cart-list">
                  {billItems.map((it, idx) => (
                    <div className="cart-row" key={`${it.product_id}-${idx}`}>
                      <div className="cart-name">{it.name}</div>
                      <div className="cart-qty">x{it.qty}</div>
                      <div className="cart-price">{formatINR(it.total)}</div>
                      <button className="cart-remove" onClick={() => removeBillRow(idx)}>✖</button>
                    </div>
                  ))}
                </div>

                <div className="summary">
                  <div className="summary-row">
                    <div>Subtotal</div>
                    <div>{formatINR(subtotal)}</div>
                  </div>
                  <div className="summary-row">
                    <div>Tax ({TAX_PERCENT}%)</div>
                    <div>{formatINR(tax)}</div>
                  </div>
                  <div className="summary-row grand">
                    <div>Grand Total</div>
                    <div className="grand-amount">{formatINR(grandTotal)}</div>
                  </div>
                </div>

                <button className="save-bill-btn" onClick={saveBill}>
                  Save Bill
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* TOASTS */}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>{t.message}</div>
        ))}
      </div>
    </div>
  );
}
