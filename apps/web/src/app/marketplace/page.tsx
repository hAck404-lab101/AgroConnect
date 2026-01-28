'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'react-query';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
  images: Array<{ url: string }>;
  seller: {
    id: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
}

/**
 * MARKETPLACE (Algorithm §4): Auth-gated.
 * - No marketplace, prices, or cart before login.
 * - Filters: Price, Category, Availability. Location when available.
 */
export default function MarketplacePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [availability, setAvailability] = useState<string>('');

  useEffect(() => {
    if (user === null) {
      router.replace('/login?redirect=/marketplace');
    }
  }, [user, router]);

  const { data, isLoading } = useQuery(
    ['products', search, category, minPrice, maxPrice, availability],
    async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (availability === 'available') params.append('isAvailable', 'true');
      if (availability === 'unavailable') params.append('isAvailable', 'false');

      const response = await api.get(`/products?${params.toString()}`);
      return response.data.data;
    },
    { enabled: !!user }
  );

  if (user === null) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      <AnimatedBackground />
      <div className="relative z-10">
        {/* Filters - Hidden on mobile */}
        <div className="hidden md:block bg-white border-b sticky top-[73px] z-20 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="CROPS">Crops</option>
                <option value="LIVESTOCK">Livestock</option>
                <option value="INPUTS">Inputs</option>
              </select>
              <input
                type="number"
                placeholder="Min Price (GHS)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max Price (GHS)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Availability</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>
        </div>

        <div className="md:hidden bg-white border-b px-4 py-3">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <main className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {data?.products?.map((product: Product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 active:scale-95"
                >
                  <div className="relative h-48 bg-gray-100">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50">
                        <span className="text-4xl">🌾</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-semibold text-primary-700">
                      {product.category}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1 text-gray-900">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl font-bold text-primary-600">
                        GHS {product.price.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {product.quantity} {product.unit}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      By {product.seller.profile.firstName} {product.seller.profile.lastName}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {data?.products?.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌾</div>
              <p className="text-gray-600 text-lg">No products found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your search filters</p>
            </div>
          )}
        </main>
      </div>

      <div className="h-16 md:hidden" />
    </div>
  );
}
