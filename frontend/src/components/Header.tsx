import React from 'react'
import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto p-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold">TinyLink</Link>
        <nav>
          <a className="text-sm text-gray-600" href="/">Dashboard</a>
        </nav>
      </div>
    </header>
  )
}
