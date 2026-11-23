import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-gray-100">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children || <Outlet />}
      </main>
    </div>
  )
}
