import React, { useEffect, useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Menu from './components/Menu'
import ItemDetail from './components/ItemDetail'
import Cart from './components/Cart'
import { CartProvider } from './context/CartContext'

function App() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetch('/api/menu')
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('Failed to load menu:', err))
  }, [])

  return (
    <CartProvider>
      <header className="app-header">
        <Link to="/">Home</Link>
        <Link to="/cart">Cart</Link>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Menu categories={categories} />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </main>
    </CartProvider>
  )
}

export default App
