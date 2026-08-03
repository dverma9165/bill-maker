import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CreateBill from './pages/CreateBill';
import ViewBills from './pages/ViewBills';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/create" replace />} />
          <Route path="create" element={<CreateBill />} />
          <Route path="view" element={<ViewBills />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
