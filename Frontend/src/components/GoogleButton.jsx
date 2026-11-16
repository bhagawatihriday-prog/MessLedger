import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

export const GoogleButton = ({
  onSuccess,
  onError,
  loading = false,
  text = 'Continue with Google',
  className = '',
}) => {
  const containerRef = useRef(null);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isClientConfigured = Boolean(
    clientId &&
    clientId.trim() !== '' &&
    !clientId.includes('mock_google_client_id')
  );

  useEffect(() => {
    // Check if Google Identity Services script is available
    const checkGsi = () => {
      if (window.google?.accounts?.id) {
        setIsGsiLoaded(true);
        return true;
      }
      return false;
    };

    if (checkGsi()) return;

    // Retry checking if script is loading asynchronously
    const interval = setInterval(() => {
      if (checkGsi()) {
        clearInterval(interval);
      }
    }, 200);

    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!isGsiLoaded || !isClientConfigured || !containerRef.current) return;

    try {
      const isDark = document.documentElement.classList.contains('dark');

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) {
            onSuccess?.(response.credential);
          } else {
            onError?.(new Error('Google authentication did not return a valid credential.'));
          }
        },
      });

      // Render official Google button inside container
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: isDark ? 'filled_black' : 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: containerRef.current.clientWidth || 380,
      });
    } catch (err) {
      console.warn('Failed to render Google Identity Services button:', err);
    }
  }, [isGsiLoaded, isClientConfigured, clientId, onSuccess, onError]);

  const handleCustomClick = () => {
    if (!isClientConfigured) {
      const msg = 'Google Client ID is not configured yet. Please set VITE_GOOGLE_CLIENT_ID in Frontend/.env with your Google Cloud Console credentials.';
      console.warn(msg);
      onError?.(new Error(msg));
      return;
    }

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onSuccess?.(response.credential);
            } else {
              onError?.(new Error('Google authentication did not return a credential.'));
            }
          },
        });
        window.google.accounts.id.prompt();
      } catch (err) {
        onError?.(err);
      }
    } else {
      onError?.(new Error('Google Sign-In SDK is still loading. Please try again in a moment.'));
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* If Google GIS is ready and Client ID is configured, render official Google button */}
      {isGsiLoaded && isClientConfigured ? (
        <div className="w-full flex justify-center items-center min-h-[42px] overflow-hidden rounded-lg">
          <div ref={containerRef} className="w-full flex justify-center" />
        </div>
      ) : (
        /* Fallback branded Google button with immediate guidance */
        <button
          type="button"
          onClick={handleCustomClick}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 dark:focus:ring-zinc-100/20 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors shadow-xs ${
            loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>{text}</span>
        </button>
      )}
    </div>
  );
};
