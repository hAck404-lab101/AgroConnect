'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'react-query';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/BackButton';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

/**
 * AUTH GATE: No marketplace, prices, or add-to-cart before login.
 * Product detail (and prices) require authentication.
 */
export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const user = useAuthStore((state) => state.user);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (user === null) {
      router.replace(`/login?redirect=${encodeURIComponent(`/products/${productId}`)}`);
    }
  }, [user, router, productId]);

  const { data: product, isLoading } = useQuery(
    ['product', productId],
    async () => {
      const response = await api.get(`/products/${productId}`);
      return response.data.data;
    },
    { enabled: !!productId && !!user }
  );

  const addToCart = async () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${productId}`)}`);
      return;
    }

    setAddingToCart(true);
    try {
      const response = await api.post('/orders', {
        items: [
          {
            productId: productId,
            quantity: quantity,
          },
        ],
        deliveryAddress: 'To be provided',
        deliveryCity: 'Accra',
        deliveryRegion: 'Greater Accra',
      });

      router.push(`/checkout?orderId=${response.data.data.id}`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (user === null) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Product not found</p>
          <BackButton label="Marketplace" href="/marketplace" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      <AnimatedBackground />
      <div className="relative z-10">
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <BackButton label="Marketplace" href="/marketplace" />
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Images */}
            <div>
              <div className="relative h-96 bg-gray-100 rounded-xl overflow-hidden mb-4 border border-gray-200">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <span className="text-6xl">🌾</span>
                  </div>
                )}
              </div>
              {product.images?.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1, 5).map((img: any, idx: number) => (
                    <div key={idx} className="relative h-20 bg-gray-100 rounded overflow-hidden border border-gray-200">
                      <Image
                        src={img.url}
                        alt={`${product.title} ${idx + 2}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h1 className="text-3xl font-bold mb-4 text-gray-900">{product.title}</h1>
                <p className="text-3xl font-bold text-primary-600 mb-4">
                  GHS {product.price.toFixed(2)} / {product.unit}
                </p>

                <div className="mb-6">
                  <p className="text-gray-700 mb-4 leading-relaxed">{product.description}</p>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-semibold text-gray-700">Category:</span>{' '}
                      <span className="text-gray-600">{product.category}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Available:</span>{' '}
                      <span className="text-gray-600">{product.quantity} {product.unit}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Seller:</span>{' '}
                      <span className="text-gray-600">
                        {product.seller.profile.firstName} {product.seller.profile.lastName}
                      </span>
                    </p>
                  </div>
                </div>

                {product.isAvailable && (
                  <div className="border-t pt-6">
                    <div className="flex items-center gap-4 mb-4">
                      <label className="font-semibold text-gray-700">Quantity:</label>
                      <input
                        type="number"
                        min="1"
                        max={product.quantity}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <Button
                      onClick={addToCart}
                      disabled={addingToCart}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3"
                      size="lg"
                    >
                      {addingToCart ? 'Adding...' : 'Add to Cart'}
                    </Button>
                  </div>
                )}

                {!product.isAvailable && (
                  <div className="p-4 bg-gray-100 rounded-lg text-center border border-gray-200">
                    <p className="text-gray-600">This product is currently unavailable</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Add padding bottom on mobile to account for bottom nav */}
      <div className="h-16 md:hidden"></div>
    </div>
  );
}
