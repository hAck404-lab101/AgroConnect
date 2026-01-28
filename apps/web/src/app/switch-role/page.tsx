'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';

/**
 * ROLE SWITCHING (Algorithm §3): One account → multiple roles.
 * Switch Role: choose active context (Buyer / Farmer / Transporter) and go to respective dashboard.
 */
export default function SwitchRolePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      router.replace('/login?redirect=/switch-role');
    }
  }, [user, router]);

  if (!user) return null;

  const roles = [
    { id: 'BUYER', label: 'Buyer', desc: 'Browse marketplace, place orders', href: '/marketplace', icon: '🛒' },
    { id: 'FARMER', label: 'Seller (Farmer)', desc: 'Sell products, manage listings', href: '/farmer/dashboard', icon: '🌾' },
    { id: 'TRANSPORTER', label: 'Transporter', desc: 'Deliver orders, earn from logistics', href: '/transporter/dashboard', icon: '🚚' },
  ];

  return (
    <div className="relative min-h-screen bg-gray-50">
      <AnimatedBackground />
      <div className="relative z-10">
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <h1 className="text-3xl font-bold mb-2">Switch Role</h1>
          <p className="text-gray-600 mb-8">
            Choose how you want to use AgroConnect. One account, multiple roles.
          </p>

          <div className="space-y-4">
            {roles.map((r) => (
              <Link key={r.id} href={r.href}>
                <div
                  className={`block p-4 rounded-xl border-2 transition-colors ${
                    user.role === r.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{r.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{r.label}</p>
                      <p className="text-sm text-gray-600">{r.desc}</p>
                    </div>
                    {user.role === r.id && (
                      <span className="ml-auto text-sm font-medium text-primary-600">Current</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex gap-4">
            <Link href="/marketplace">
              <Button variant="outline">Back to Marketplace</Button>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
