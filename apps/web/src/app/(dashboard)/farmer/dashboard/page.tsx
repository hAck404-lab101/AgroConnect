'use client';

import { useQuery } from 'react-query';
import Link from 'next/link';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Note: logout is no longer needed here as it's in the Navbar

export default function FarmerDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const { data: products } = useQuery(
    'my-products',
    async () => {
      const response = await api.get('/products/my/listings');
      return response.data.data;
    },
    { enabled: !!user }
  );

  const { data: orders } = useQuery(
    'seller-orders',
    async () => {
      const response = await api.get('/orders/seller/my-orders');
      return response.data.data;
    },
    { enabled: !!user }
  );

  if (!user) return null;

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10">
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">
            Welcome, {user.profile?.firstName || 'Farmer'}!
          </h1>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">My Products</h3>
              <p className="text-3xl font-bold text-primary-600">
                {products?.products?.length || 0}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Orders</h3>
              <p className="text-3xl font-bold text-primary-600">
                {orders?.orders?.length || 0}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur p-6 rounded-lg shadow">
              <Link href="/farmer/products/new">
                <Button className="w-full">Add New Product</Button>
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">My Products</h2>
              {products?.products?.length > 0 ? (
                <div className="space-y-4">
                  {products.products.slice(0, 5).map((product: any) => (
                    <Link
                      key={product.id}
                      href={`/farmer/products/${product.id}`}
                      className="block border-b pb-4 last:border-0 hover:text-primary-600"
                    >
                      <p className="font-semibold">{product.title}</p>
                      <p className="text-sm text-gray-600">
                        GHS {product.price.toFixed(2)} • {product.quantity} {product.unit}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No products yet</p>
              )}
            </div>

            <div className="bg-white/80 backdrop-blur p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
              {orders?.orders?.length > 0 ? (
                <div className="space-y-4">
                  {orders.orders.slice(0, 5).map((order: any) => (
                    <div
                      key={order.id}
                      className="border-b pb-4 last:border-0 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">GHS {order.totalAmount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No orders yet</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
