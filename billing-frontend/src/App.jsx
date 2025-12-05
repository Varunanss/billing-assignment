import { Routes, Route } from "react-router-dom";
import BillingPage from "./pages/BillingPage";
import BillConfirmPage from "./pages/BillConfirmPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<BillingPage />} />
      <Route path="/bill-confirm" element={<BillConfirmPage />} />
    </Routes>
  );
}

export default App;
