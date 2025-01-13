"use client";

import Image from 'next/image'
import Link from 'next/link'

const Header = () => {
  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex-shrink-0">
            {/* Logo with rounded corners */}
            <Link href="/" className="flex items-center">
              <div className="w-48 h-12 relative flex items-center">
                <div className="text-2xl font-bold text-gray-800">
                  Ceylon<span className="text-[#6474FC]">Stay</span>
                </div>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Navigation */}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 