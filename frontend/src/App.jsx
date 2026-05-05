import React, { useEffect, useState } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import Menu from './components/Menu'
import Home from './components/Home'
import ItemDetail from './components/ItemDetail'
import Cart from './components/Cart'
import About from './components/About'
import Reservation from './components/Reservation'
import NewsletterSignup from './components/NewsletterSignup'
import Gallery from './components/Gallery'
// lazy-load admin dashboard
const AdminDashboardLazy = React.lazy(() => import('./components/AdminDashboard'))
import { CartProvider, useCart } from './context/CartContext'
import { apiFetch } from './utils/api'

function HeaderBar({ searchQuery, onSearchChange }) {
  const { items } = useCart()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const total = items.reduce((s, i) => s + (i.qty || 0), 0)
  const badgeStyle = {
    display: 'inline-block',
    minWidth: 20,
    padding: '2px 6px',
    borderRadius: 12,
    background: '#ff6b6b',
    color: 'white',
    fontSize: 12,
    marginLeft: 6,
    WebkitTextFillColor: 'white',
    textFillColor: 'white'
  }

  const handleSearchChange = (e) => {
    onSearchChange(e.target.value)
    // navigate to menu when user starts searching
    if (e.target.value && window.location.pathname !== '/menu' && window.location.pathname !== '/') {
      navigate('/menu')
    }
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          ☰
        </button>
        <nav className={`nav-links${menuOpen ? ' open' : ''}`}>
          <NavLink onClick={() => setMenuOpen(false)} to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Home</NavLink>
          <NavLink onClick={() => setMenuOpen(false)} to="/menu" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Menu</NavLink>
          <NavLink onClick={() => setMenuOpen(false)} to="/cart" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Cart{total > 0 && <span style={badgeStyle}>{total}</span>}
          </NavLink>
          <NavLink onClick={() => setMenuOpen(false)} to="/reserve" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Reservation</NavLink>
          <NavLink onClick={() => setMenuOpen(false)} to="/gallery" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Gallery</NavLink>
          <NavLink onClick={() => setMenuOpen(false)} to="/about" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>About Us</NavLink>
        </nav>
      </div>

      <div className="header-center">
        <div className="header-brand">GOSH CAFE</div>
      </div>

      <div className="header-right">
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={handleSearchChange}
          style={{
            padding: '10px 14px',
            fontSize: 14,
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 999,
            width: 260,
            maxWidth: '100%',
            background: 'rgba(255,255,255,0.14)',
            color: 'white'
          }}
        />
        <NavLink to="/admin" className={({ isActive }) => `nav-link admin-link${isActive ? ' active' : ''}`}>Admin</NavLink>
      </div>
    </header>
  )
}

function App() {
  const [categories, setCategories] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    apiFetch('menu')
      .then((r) => r.json())
      .then((data) => {
        // new /api/menu returns { categories: [...], promotions: [...] }
        const cats = Array.isArray(data) ? data : (data.categories || [])
        setCategories(cats)
      })
      .catch((err) => console.error('Failed to load menu:', err))
  }, [])

  return (
    <CartProvider>
      <HeaderBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu categories={categories} searchQuery={searchQuery} onSearchChange={setSearchQuery} />} />
          <Route path="/about" element={<About />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/reserve" element={<Reservation />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/admin"
            element={
              // lazy import AdminDashboard to avoid loading admin code in normal user flows
              <React.Suspense fallback={<div>Loading admin…</div>}>
                <AdminDashboardLazy />
              </React.Suspense>
            }
          />
        </Routes>
      </main>
    </CartProvider>
  )
}

export default App

