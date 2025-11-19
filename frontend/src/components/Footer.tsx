import React from 'react'

export default function Footer(){
  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto p-4 text-sm text-center text-gray-500">TinyLink © {new Date().getFullYear()}</div>
    </footer>
  )
}
