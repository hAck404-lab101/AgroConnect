'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';

/**
 * TRANSPORTER ALGORITHM (§10): Go Online/Offline, accept/reject jobs, track earnings, withdraw.
 * Placeholder until full transporter flow.
 */
export default function TransporterDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      router.replace('/login?redirect=/transporter/dashboard');
      return;
    }
    if (user.role !== 'TRANSPORTER') {
      router.replace('/marketplace');
    }
  }, [user, router]);

  if (!user || user.role !== 'TRANSPORTER') return null;

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10">
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">
            Transporter Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            Go online/offline, accept or reject delivery jobs, track earnings, and withdraw. (Full flow coming soon.)
          </p>
          <Link href="/marketplace">
            <Button variant="outline">Back to Marketplace</Button>
          </Link>
        </main>
      </div>
    </div>
  );
}
