'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/BackButton';
import { useAuthStore } from '@/store/auth.store';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
    setShowMobileMenu(false);
  };

  // Don't show navbar on auth pages
  if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
    return null;
  }

  const isSubPage = pathname && pathname !== '/' && pathname !== '/marketplace' && !pathname.startsWith('/login') && !pathname.startsWith('/register');

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Back button (sub-pages) or Logo */}
          <div className="flex items-center gap-2 min-w-0">
            {isSubPage ? (
              <BackButton minimal className="flex-shrink-0" />
            ) : null}
            <Link 
              href="/" 
              className={`text-2xl font-bold text-primary-600 flex items-center gap-2 hover:text-primary-700 transition-colors ${isSubPage ? 'hidden sm:flex' : ''}`}
            >
              <span>🌾</span>
              <span className="hidden sm:inline">AgroConnect</span>
              <span className="sm:hidden">AC</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href={user ? '/marketplace' : '/login'}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/marketplace' 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
              }`}
            >
              Marketplace
            </Link>

            {user ? (
              <>
                <Link 
                  href={user.role === 'FARMER' ? '/farmer/dashboard' : '/register?role=FARMER'}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  Become a Seller
                </Link>
                <Link 
                  href={user.role === 'TRANSPORTER' ? '/transporter/dashboard' : '/register?role=TRANSPORTER'}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  Become a Transporter
                </Link>
                <Link 
                  href="/switch-role"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/switch-role'
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  Switch Role
                </Link>
                <Link 
                  href={`/${user.role.toLowerCase()}/dashboard`}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname?.includes('/dashboard') && pathname !== '/switch-role'
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/chat"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname?.includes('/chat')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  Chat
                </Link>
                <Link 
                  href="/orders"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname?.includes('/orders')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  Orders
                </Link>
                <Link 
                  href="/profile"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname?.includes('/profile')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  {user.profile?.firstName || 'Profile'}
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {showMobileMenu ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="md:hidden border-t py-4 space-y-2">
            <Link
              href={user ? '/marketplace' : '/login'}
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/marketplace'
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
              }`}
            >
              Marketplace
            </Link>

            {user ? (
              <>
                <Link
                  href={user.role === 'FARMER' ? '/farmer/dashboard' : '/register?role=FARMER'}
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  Become a Seller
                </Link>
                <Link
                  href={user.role === 'TRANSPORTER' ? '/transporter/dashboard' : '/register?role=TRANSPORTER'}
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  Become a Transporter
                </Link>
                <Link
                  href="/switch-role"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === '/switch-role'
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  Switch Role
                </Link>
                <Link
                  href={`/${user.role.toLowerCase()}/dashboard`}
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname?.includes('/dashboard') && pathname !== '/switch-role'
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/chat"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname?.includes('/chat')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  Chat
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname?.includes('/orders')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  Orders
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname?.includes('/profile')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-primary-600 hover:bg-primary-50"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
