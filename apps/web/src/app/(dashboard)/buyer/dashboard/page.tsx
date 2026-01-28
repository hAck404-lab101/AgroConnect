'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * BUYER-FIRST (Algorithm §2): Buyer dashboard = Marketplace.
 * Redirect /buyer/dashboard → /marketplace.
 */
export default function BuyerDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/marketplace');
  }, [router]);

  return null;
}
