import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function BillingPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [billItems, setBillItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [qtyInputs, setQtyInputs] = useState({});
  const [billHistory, setBillHistory] = useState([]);
  const [customerStatus, setCustomerStatus] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const [toasts, setToasts] = useState([]);

  // --------------------------
  // SHOW TOAST FUNCTION
  // --------------------------
  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2200);
  };

  // --------------------------
  // THEME TOGGLE
  // --------------------------
  const toggleTheme = () => {
    document.body.classList.toggle("light");

    // Save preference
    const isLight = document.body.classList.contains("light");
    localStorage.setItem("theme", isLight ? "light" : "dark");
  };

  // Apply theme from storage
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") document.body.classList.add("light");
  }, []);

  // ------------------------------
  // RESET STOCK
  // ------------------------------
  const resetStock = async () => {
    try {
      await API.post("/reset-stock");
      const res = await API.get("/products");
      setProducts(res.data);
      showToast("Stock reset!", "success");
    } catch {
      showToast("Failed to reset stock", "error");
    }
  };

  // ------------------------------
  // LOAD PRODUCTS
  // ------------------------------
  useEffect(() => {
    API.get("/products")
      .then((res) => setProducts(res.data))
      .catch(() => showToast("Backend not running!", "error"));
  }, []);

  // ------------------------------
  // CHECK CUSTOMER HISTORY
  // ------------------------------
  const checkCustomer = async () => {
    if (!customerName.trim()) return showToast("Enter customer name", "warning");

    try {
      const res = await API.get(`/bills/${customerName}`);
      setCustomerStatus(res.data.exists ? "Existing User ✓" : "New User");
      setBillHistory(res.data.bills);
      setShowHistory(true);
    } catch {
      showToast("Error retrieving history", "error");
    }
  };

  // ------------------------------
  // ADD TO BILL
  // ------------------------------
  const addToBill = (product) => {
    const qty = Number(qtyInputs[product.id] || 0);

    if (!qty || qty <= 0) return showToast("Enter valid qty", "warning");
    if (qty > product.stock) return showToast("Not enough stock!", "error");

    setBillItems((prev) => [
      ...prev,
      {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        qty,
        total: qty * product.price,
      },
    ]);

    showToast("Added to bill!", "success");
  };

  const removeItem = (index) => {
    setBillItems((prev) => prev.filter((_, i) => i !== index));
    showToast("Item removed", "warning");
  };

  const grandTotal = billItems.reduce((s, it) => s + it.total, 0);

  // ------------------------------
  // SAVE BILL
  // ------------------------------
  const saveBill = async () => {
    if (!customerName) return showToast("Enter customer name", "warning");
    if (billItems.length === 0) return showToast("No items added!", "warning");

    const payload = {
      customer_name: customerName,
      items: billItems.map((i) => ({
        product_id: i.id,
        quantity: i.qty,
      })),
    };

    try {
      const res = await API.post("/bill", payload);
      navigate("/bill-confirm", { state: { billId: res.data.bill_id } });
    } catch (err) {
      showToast("Failed to save bill", "error");
    }
  };

  return (
    <div className="container">
      <div className="glass-card">



        {/* Top Right Buttons */}
        <div className="top-actions">
          <button className="show-bills-btn" onClick={checkCustomer}>
            Show Bills
          </button>
          <button className="reset-stock-btn" onClick={resetStock}>
            Reset Stock
          </button>
        </div>

        <h1>Billing Application</h1>

        {/* Customer Input */}
        <input
          type="text"
          placeholder="Customer Name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="customer-input"
        />

        {customerStatus && <div className="customer-status">{customerStatus}</div>}

        {/* Bill History */}
        {showHistory && (
          <div className="bill-history">
            <h3>Bill History</h3>
            {billHistory.length === 0 ? (
              <p>No past bills</p>
            ) : (
              billHistory.map((b) => (
                <div className="bill-history-item" key={b.id}>
                  Bill #{b.id} — ₹{b.total_amount}
                </div>
              ))
            )}
            <button className="close-history-btn" onClick={() => setShowHistory(false)}>
              Close
            </button>
          </div>
        )}

        {/* Products */}
        <h2>Products</h2>
        <div className="scroll-container">
          {Array.from({ length: Math.ceil(products.length / 2) }).map((_, colIndex) => {
            const p1 = products[colIndex * 2];
            const p2 = products[colIndex * 2 + 1];

            return (
              <div className="scroll-column" key={colIndex}>
                {[p1, p2].map(
                  (p, i) =>
                    p && (
                      <div className="scroll-card" key={i}>
                        <div className="product-name">{p.name}</div>
                        <div className="product-price">₹{p.price}</div>
                        <div className="product-stock">Stock: {p.stock}</div>

                        <div className="product-actions">
                          <input
                            type="number"
                            min={1}
                            value={qtyInputs[p.id] || ""}
                            onChange={(e) =>
                              setQtyInputs({
                                ...qtyInputs,
                                [p.id]: e.target.value,
                              })
                            }
                            placeholder="Qty"
                          />
                          <button onClick={() => addToBill(p)}>Add</button>
                        </div>
                      </div>
                    )
                )}
              </div>
            );
          })}
        </div>

        {/* Bill Items Table */}
        <h2>Bill Items</h2>
        <div className="bill-table">
          <div className="bill-table-header">
            <span>Item</span><span>Qty</span><span>Price</span><span>Total</span><span>Remove</span>
          </div>

          {billItems.length === 0 && (
            <div className="bill-empty">No items added</div>
          )}

          {billItems.map((it, idx) => (
            <div className="bill-table-row" key={idx}>
              <span>{it.name}</span>
              <span>{it.qty}</span>
              <span>₹{it.price.toFixed(2)}</span>
              <span>₹{it.total.toFixed(2)}</span>
              <button className="remove-btn" onClick={() => removeItem(idx)}>
                ✖
              </button>
            </div>
          ))}
        </div>

        <h2>Grand Total: ₹{grandTotal.toFixed(2)}</h2>

        <button className="save-btn" onClick={saveBill}>
          Save Bill
        </button>
      </div>

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
