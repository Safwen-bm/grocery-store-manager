import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import ManageProducts from './pages/ManageProducts';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails'; 
import Login from './pages/Login';

import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => {
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
    }} />;
  }

  return (
    <Router>
      <div className="App">
        <Navbar onLogout={handleLogout} />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/manage-products" element={<ManageProducts />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetails />} /> {/* New route */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;