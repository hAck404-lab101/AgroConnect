'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

interface GoogleSignInButtonProps {
  /** Redirect path after successful login (e.g. /marketplace or from ?redirect=) */
  redirect?: string;
  /** Optional role for new users (register flow). Default BUYER. */
  role?: 'FARMER' | 'BUYER' | 'TRANSPORTER' | 'SUPPLIER';
  /** Disable the button (e.g. during form submit) */
  disabled?: boolean;
  /** className for wrapper */
  className?: string;
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleSignInButton({
  redirect = '/marketplace',
  role,
  disabled = false,
  className = '',
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState('');

  const onSuccess = useCallback(
    async (credentialResponse: CredentialResponse) => {
      const idToken = credentialResponse.credential;
      if (!idToken) {
        setError('Google sign-in failed. No credential received.');
        return;
      }
      setError('');
      try {
        const payload: { idToken: string; role?: string } = { idToken };
        if (role) payload.role = role;
        const response = await api.post('/auth/google', payload);
        const { user, accessToken, refreshToken } = response.data.data;
        setAuth(user, accessToken, refreshToken);
        router.push(redirect);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Google sign-in failed. Please try again.';
        setError(msg);
      }
    },
    [redirect, role, setAuth, router]
  );

  const onError = useCallback(() => {
    setError('Google sign-in was cancelled or failed.');
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className={className}>
      <div
        className={`flex justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      >
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          useOneTap={false}
          theme="outline"
          size="large"
          type="standard"
          shape="rectangular"
          text="continue_with"
        />
      </div>
      {error && (
        <p className="mt-2 text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
