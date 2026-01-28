'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  label?: string;
  href?: string;
  className?: string;
  /** When true, minimal nav-bar style (chevron only, compact) */
  minimal?: boolean;
}

export function BackButton({
  label,
  href,
  className = '',
  minimal = false,
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        inline-flex items-center gap-1.5 rounded-md transition-colors
        text-gray-900 hover:text-gray-700 hover:bg-gray-100
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
        ${minimal ? 'p-2 -ml-2' : 'py-2 px-3'}
        ${className}
      `}
    >
      {/* Apple-style chevron */}
      <svg
        className="w-5 h-5 shrink-0"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {label && !minimal && (
        <span className="text-sm font-medium">{label}</span>
      )}
    </button>
  );
}
