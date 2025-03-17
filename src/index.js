import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Text from './Text';
// import Image from './Image';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/text" element={<Text />} />
      {/* <Route path="/image" element={<Image />} /> */}
    </Routes>
  </Router>
);
