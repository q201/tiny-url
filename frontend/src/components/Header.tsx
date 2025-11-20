import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const { pathname } = useLocation()

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto p-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold">TinyLink</Link>
        <nav>
          {pathname === '/' ? (
            <Link to="/healthz" className="text-sm text-gray-600">Health</Link>
          ) : (
            <Link to="/" className="text-sm text-gray-600">Dashboard</Link>
          )}
        </nav>
      </div>
    </header>
  )
}
