'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';

/**
 * AUTH GATE (Algorithm §1–2):
 * - Unauthenticated → Landing (no marketplace, no prices, no cart).
 * - Authenticated → Redirect to Marketplace (buyer default).
 */
export default function LandingPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      router.replace('/marketplace');
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <div className="w-full max-w-2xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/80 px-8 py-12 md:px-12 md:py-16 text-center">
          <span className="text-6xl md:text-7xl mb-6 block">🌾</span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            AgroConnect
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-2">
            Connect farmers, buyers, transporters, and suppliers.
          </p>
          <p className="text-gray-600 mb-10">
            Sign in to browse the marketplace, view prices, and place orders.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto px-8">
                Sign up
              </Button>
            </Link>
          </div>

          <p className="mt-8 text-sm text-gray-500">
            Google Sign-in and Email + Password supported.
          </p>
        </div>

        <div className="h-16 md:hidden" />
      </div>
    </div>
  );
}
