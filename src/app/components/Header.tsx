"use client";

import Image from 'next/image'
import Link from 'next/link'

const Header = () => {
  return (
    <header className="w-full bg-[#FFFFFF] shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/ceylon_stay_logo_red.png"
                alt="CeylonStay Logo"
                width={200}
                height={50}
                className="h-12 w-auto"
                priority
              />
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