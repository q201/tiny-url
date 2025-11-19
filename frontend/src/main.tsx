import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles.css'
import Dashboard from './pages/Dashboard'
import Stats from './pages/Stats'
import Health from './pages/Health'
import Header from './components/Header'
import Footer from './components/Footer'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/health" element={<Health />} />
            <Route path="/code/:short_code" element={<Stats />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
