'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function MobileBottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  // Never show on homepage, login, or signup (register) pages
  const hideNav =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    (!!pathname && (pathname.startsWith('/login') || pathname.startsWith('/register')));
  if (hideNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden shadow-lg">
      <div className="flex items-center justify-around h-16">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            pathname === '/' ? 'text-primary-600' : 'text-gray-500'
          }`}
        >
          <span className="text-2xl mb-0.5">🏠</span>
          <span className="text-xs font-medium">Home</span>
        </Link>

        <Link
          href={user ? '/marketplace' : '/login'}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            pathname === '/marketplace' || pathname?.startsWith('/products') ? 'text-primary-600' : 'text-gray-500'
          }`}
        >
          <span className="text-2xl mb-0.5">🛒</span>
          <span className="text-xs font-medium">Market</span>
        </Link>

        {user ? (
          <>
            <Link
              href={`/${user.role.toLowerCase()}/dashboard`}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                pathname?.includes('/dashboard') && !pathname?.includes('/switch-role') ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              <span className="text-2xl mb-0.5">📊</span>
              <span className="text-xs font-medium">Dashboard</span>
            </Link>

            <Link
              href="/orders"
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                pathname?.includes('/orders') ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              <span className="text-2xl mb-0.5">📋</span>
              <span className="text-xs font-medium">Orders</span>
            </Link>

            <Link
              href="/chat"
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                pathname?.includes('/chat') ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              <span className="text-2xl mb-0.5">💬</span>
              <span className="text-xs font-medium">Chat</span>
            </Link>

            <Link
              href="/profile"
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                pathname?.includes('/profile') ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              <span className="text-2xl mb-0.5">👤</span>
              <span className="text-xs font-medium">Profile</span>
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                pathname?.includes('/login') ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              <span className="text-2xl mb-0.5">🔐</span>
              <span className="text-xs font-medium">Login</span>
            </Link>
            <Link
              href="/register"
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                pathname?.includes('/register') ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              <span className="text-2xl mb-0.5">📝</span>
              <span className="text-xs font-medium">Sign Up</span>
            </Link>
            <div className="flex flex-col items-center justify-center flex-1 h-full opacity-0 pointer-events-none">
              <span className="text-2xl mb-0.5">•</span>
              <span className="text-xs font-medium">•</span>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
