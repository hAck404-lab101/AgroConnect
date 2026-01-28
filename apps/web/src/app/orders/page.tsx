'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'react-query';
import Link from 'next/link';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/BackButton';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

/**
 * Orders list (Algorithm §5–6): Cart → Checkout → Payment → Order.
 * Auth-gated.
 */
export default function OrdersPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) router.replace('/login?redirect=/orders');
  }, [user, router]);

  const { data, isLoading } = useQuery(
    'my-orders',
    async () => {
      const res = await api.get('/orders/my-orders');
      return res.data.data;
    },
    { enabled: !!user }
  );

  if (!user) return null;

  const orders = data?.orders ?? [];

  return (
    <div className="relative min-h-screen bg-gray-50">
      <AnimatedBackground />
      <div className="relative z-10">
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <BackButton label="Marketplace" href="/marketplace" />
          </div>
          <h1 className="text-3xl font-bold mb-6">My Orders</h1>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-600 mb-4">No orders yet.</p>
              <Link href="/marketplace">
                <Button>Browse Marketplace</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o: any) => (
                <div
                  key={o.id}
                  className="block p-4 bg-white rounded-xl border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">Order #{o.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(o.createdAt).toLocaleDateString()} · GHS {o.totalAmount?.toFixed(2) ?? '0.00'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        o.status === 'DELIVERED'
                          ? 'bg-green-100 text-green-800'
                          : o.status === 'IN_TRANSIT'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      <div className="h-16 md:hidden" />
    </div>
  );
}
