'use client';

import { useQuery } from 'react-query';
import Link from 'next/link';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [user, router]);

  const { data: analytics } = useQuery(
    'admin-analytics',
    async () => {
      const response = await api.get('/admin/analytics');
      return response.data.data;
    },
    { enabled: !!user && user.role === 'ADMIN' }
  );

  const { data: apiKeys } = useQuery(
    'api-keys',
    async () => {
      const response = await api.get('/admin/api-keys');
      return response.data.data;
    },
    { enabled: !!user && user.role === 'ADMIN' }
  );

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10">
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

          {analytics && (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Total Users</h3>
                <p className="text-3xl font-bold text-primary-600">
                  {analytics.stats.totalUsers}
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Products</h3>
                <p className="text-3xl font-bold text-primary-600">
                  {analytics.stats.totalProducts}
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Orders</h3>
                <p className="text-3xl font-bold text-primary-600">
                  {analytics.stats.totalOrders}
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Revenue</h3>
                <p className="text-3xl font-bold text-primary-600">
                  GHS {analytics.stats.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">API Keys</h2>
              {apiKeys?.length > 0 ? (
                <div className="space-y-2">
                  {apiKeys.map((key: any) => (
                    <div key={key.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-semibold">{key.name}</p>
                        <p className="text-sm text-gray-600">{key.service}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${key.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {key.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No API keys configured</p>
              )}
            </div>

            <div className="bg-white/80 backdrop-blur p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link href="/admin/users">
                  <Button className="w-full" variant="outline">Manage Users</Button>
                </Link>
                <Link href="/admin/api-keys">
                  <Button className="w-full" variant="outline">Manage API Keys</Button>
                </Link>
                <Link href="/admin/orders">
                  <Button className="w-full" variant="outline">View All Orders</Button>
                </Link>
                <Link href="/admin/products">
                  <Button className="w-full" variant="outline">Moderate Products</Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
