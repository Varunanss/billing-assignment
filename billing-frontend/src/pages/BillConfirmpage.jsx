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

    // Load Current Bill
    API.get(`/bill/${billId}`)
      .then((res) => {
        setBillData(res.data);

        // Load all bills of SAME customer
        const customer = res.data.bill.customer_name;
        API.get(`/bills/${customer}`).then((r) => {
          setPreviousBills(r.data.bills);
        });
      })
      .catch(() => alert("Failed to load bill"));
  }, [billId]);

  if (!billId)
    return (
      <div className="container">
        <div className="glass-card">
          <h2>No Bill Selected</h2>
          <button onClick={() => navigate("/")}>Back</button>
        </div>
      </div>
    );

  if (!billData)
    return (
      <div className="container">
        <div className="glass-card"><h2>Loading...</h2></div>
      </div>
    );

  const { bill, items } = billData;

  return (
    <div className="container">
      <div className="glass-card bill-confirm-card">

        <h1>Bills</h1>

        {/* CURRENT BILL SECTION */}
        <div className="invoice-header">
          <div><strong>Bill No:</strong> {bill.id}</div>
          <div><strong>Customer:</strong> {bill.customer_name}</div>
          <div><strong>Date:</strong> {new Date(bill.created_at).toLocaleString()}</div>
        </div>

        <h2>Purchased Items</h2>

        <div className="bill-table print-table">
          <div className="bill-table-header">
            <span>Item</span>
            <span>Qty</span>
            <span>Price</span>
            <span>Total</span>
          </div>

          {items.map((it) => (
            <div className="bill-table-row" key={it.id}>
              <span>{it.product_name}</span>
              <span>{it.quantity}</span>
              <span>₹{Number(it.price).toFixed(2)}</span>
              <span>₹{Number(it.total).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="invoice-total-bar">
          <h2>Total Amount</h2>
          <h1>₹{Number(bill.total_amount).toFixed(2)}</h1>
        </div>

        {/* PREVIOUS BILLS SECTION */}
        <h2 style={{ marginTop: "35px" }}>Previous Bills</h2>

        <div className="bill-table print-table">
          <div className="bill-table-header">
            <span>Bill No</span>
            <span>Date</span>
            <span>Total Amount</span>
            <span>View</span>
          </div>

          {previousBills.map((b) => (
            <div className="bill-table-row" key={b.id}>
              <span>{b.id}</span>
              <span>{new Date(b.created_at).toLocaleString()}</span>
              <span>₹{Number(b.total_amount).toFixed(2)}</span>
              <button
                className="remove-btn"
                onClick={() => navigate("/bill-confirm", { state: { billId: b.id } })}
                style={{ borderRadius: 6 }}
              >
                Open
              </button>
            </div>
          ))}
        </div>

        <button onClick={() => navigate("/")}>Create New Bill</button>

      </div>
    </div>
  );
}
