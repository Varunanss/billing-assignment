import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/api";

export default function BillConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const billId = location.state?.billId;

  const [billData, setBillData] = useState(null);
  const [previousBills, setPreviousBills] = useState([]);

  useEffect(() => {
    if (!billId) return;

    // Load current bill first
    API.get(`/bill/${billId}`)
      .then((res) => {
        const data = res.data;
        setBillData(data);

        const customer = data.bill.customer_name;

        // Load all bills of same customer
        API.get(`/bills/${customer}`).then((r) => {
          const all = r.data.bills || [];

          // Exclude current bill → previous bills only
          const prev = all.filter((b) => b.id !== Number(billId));

          setPreviousBills(prev);
        });
      })
      .catch(() => alert("Failed to load bill"));
  }, [billId]);

  if (!billId)
    return (
      <div className="confirm-container">
        <div className="confirm-card">
          <h2>No Bill Selected</h2>
          <button className="new-bill-btn" onClick={() => navigate("/")}>
            Go Home
          </button>
        </div>
      </div>
    );

  if (!billData)
    return (
      <div className="confirm-container">
        <div className="confirm-card"><h2>Loading...</h2></div>
      </div>
    );

  const { bill, items } = billData;
  const subtotal = items.reduce((s, i) => s + Number(i.total), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="confirm-container">

      {/* Animated success icon */}
      <div className="success-icon">
        <div className="check">&#10003;</div>
      </div>

      <h1 className="success-title">Bill Saved!</h1>
      <p className="success-sub">Transaction completed successfully</p>

      <div className="confirm-card">

        {/* Bill Header */}
        <div className="bill-header">
          <span className="bill-id">📄 Bill #{bill.id.toString().padStart(4, "0")}</span>
          <span className="bill-date">{new Date(bill.created_at).toLocaleString()}</span>
        </div>

        <div className="bill-info">
          <strong>Customer:</strong> {bill.customer_name}
        </div>

        {/* ITEM TABLE */}
        <div className="confirm-table">
          <div className="confirm-row header">
            <span>Item</span>
            <span>Qty</span>
            <span>Price</span>
            <span>Total</span>
          </div>

          {items.map((it) => (
            <div className="confirm-row" key={it.id}>
              <span>{it.product_name}</span>
              <span>{it.quantity}</span>
              <span>₹{Number(it.price).toFixed(2)}</span>
              <span>₹{Number(it.total).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* TOTALS */}
        <div className="totals">
          <div className="tot-row">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="tot-row">
            <span>Tax (10%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>

          <div className="tot-row grand">
            <span>Grand Total</span>
            <span className="grand-amount">₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* PREVIOUS BILLS SECTION */}
        <h2 className="prev-title">Previous Bills</h2>

        <div className="confirm-table prev-table">
          <div className="confirm-row header">
            <span>Bill No</span>
            <span>Date</span>
            <span>Total</span>
            <span>Open</span>
          </div>

          {previousBills.length === 0 && (
            <div className="confirm-row" style={{ opacity: 0.7 }}>
              <span>No previous bills</span>
            </div>
          )}

          {previousBills.map((b) => (
            <div className="confirm-row" key={b.id}>
              <span>#{b.id}</span>
              <span>{new Date(b.created_at).toLocaleString()}</span>
              <span>₹{Number(b.total_amount).toFixed(2)}</span>
              <button
                className="open-btn"
                onClick={() =>
                  navigate("/bill-confirm", { state: { billId: b.id } })
                }
              >
                Open
              </button>
            </div>
          ))}
        </div>

        {/* ACTION BUTTONS */}
        <div className="confirm-actions">
          <button className="print-btn" onClick={() => window.print()}>
            🖨 Print
          </button>

          <button className="new-bill-btn" onClick={() => navigate("/")}>
            ➕ New Bill
          </button>
        </div>
      </div>
    </div>
  );
}
