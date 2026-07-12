// =============================================================================
// Cookie Consent Banner — GDPR compliant
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const COOKIE_CONSENT_KEY = 'cookie_consent_accepted';

type CookieConsentStatus = 'accepted' | 'essential' | null;

export const CookieConsent: React.FC = () => {
  const t = useTranslation();
  const [consent, setConsent] = useState<CookieConsentStatus>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY) as CookieConsentStatus | null;
    if (!stored) {
      // Show the banner after a short delay for a smooth entrance
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
    setConsent(stored);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setConsent('accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'essential');
    setConsent('essential');
    setVisible(false);
  };

  if (consent || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="hidden sm:flex p-2.5 rounded-xl bg-primary-500/10 text-primary-400 flex-shrink-0">
            <Cookie className="h-6 w-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {t.gdpr.cookieTitle}
                </h3>
                <p className="text-sm text-gray-300 mt-1 max-w-2xl">
                  {t.gdpr.cookieMessage}
                </p>
              </div>
              <button
                onClick={() => setVisible(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Links */}
            <div className="flex gap-4 mt-2">
              <Link
                to="/privacy"
                className="text-xs text-primary-400 hover:text-primary-300 underline underline-offset-2"
              >
                {t.gdpr.privacyPolicy}
              </Link>
              <Link
                to="/terms"
                className="text-xs text-primary-400 hover:text-primary-300 underline underline-offset-2"
              >
                {t.gdpr.termsOfService}
              </Link>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleAccept}
                className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                {t.gdpr.cookieAccept}
              </button>
              <button
                onClick={handleDecline}
                className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                {t.gdpr.cookieDecline}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
