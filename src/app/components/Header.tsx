"use client";

import Image from 'next/image'
import Link from 'next/link'

const Header = () => {
  return (
    <header className="w-full bg-[#e41e57] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="relative w-48 h-16">
                <Image
                  src="/ceylon_logo_final_final.png"
                  alt="CeylonStay Logo"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 192px"
                  className="object-contain"
                />
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