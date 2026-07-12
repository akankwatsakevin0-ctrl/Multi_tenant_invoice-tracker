// =============================================================================
// Privacy Policy Page — Mock / Informational
// =============================================================================

import React from 'react';
import { Shield, Calendar, Mail } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useTranslation } from '../hooks/useTranslation';

export const Privacy: React.FC = () => {
  const t = useTranslation();

  return (
    <div className="page-container max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.gdpr.privacyPolicy}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.gdpr.privacyUpdated}</p>
        </div>
      </div>

      <Card className="prose prose-gray max-w-none">
        <div className="space-y-6">
          <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-xl">
            <Shield className="h-6 w-6 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Our Commitment</h2>
              <p className="text-sm text-gray-600 mt-1">
                Invoice Tracker is committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your personal data in compliance with the General Data Protection Regulation (GDPR).
              </p>
            </div>
          </div>

          <Section title="1. Data We Collect">
            <p>
              We collect only the data necessary to provide our invoicing service:
            </p>
            <ul>
              <li><strong>Account Data:</strong> Email address, password (hashed), company name, and role.</li>
              <li><strong>Business Data:</strong> Client names, email addresses, invoice details, payment statuses, and amounts.</li>
              <li><strong>Technical Data:</strong> Cookies (essential only), IP address (in server logs), and browser user-agent.</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Data">
            <p>Your data is used exclusively for:</p>
            <ul>
              <li>Providing and improving the invoicing platform.</li>
              <li>Generating, sending, and tracking invoices.</li>
              <li>Customer support and account management.</li>
              <li>Complying with legal obligations (tax reporting, record-keeping).</li>
            </ul>
            <p className="mt-2">
              We never sell your personal data to third parties. We never use your data for advertising or profiling.
            </p>
          </Section>

          <Section title="3. Data Storage & Security">
            <p>
              Your data is stored on encrypted servers in secure data centers within the European Union. We use industry-standard security measures including:
            </p>
            <ul>
              <li>Encryption at rest (AES-256) and in transit (TLS 1.3).</li>
              <li>Regular security audits and penetration testing.</li>
              <li>Strict access controls with multi-factor authentication for administrative access.</li>
            </ul>
          </Section>

          <Section title="4. Your GDPR Rights">
            <p>Under the GDPR, you have the following rights:</p>
            <ul>
              <li><strong>Right to Access:</strong> Request a copy of all personal data we hold about you.</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data.</li>
              <li><strong>Right to Erasure (Right to be Forgotten):</strong> Request deletion of your account and associated data.</li>
              <li><strong>Right to Data Portability:</strong> Export your data in a machine-readable format (JSON).</li>
              <li><strong>Right to Object:</strong> Object to processing of your personal data for certain purposes.</li>
            </ul>
          </Section>

          <Section title="5. Data Retention">
            <p>
              We retain your data for as long as your account is active. Upon account deletion, all personal data is permanently erased within 30 days. Anonymized transaction records may be retained for tax compliance purposes as required by law.
            </p>
          </Section>

          <Section title="6. Cookies">
            <p>
              We use only essential cookies required for authentication and platform functionality. No tracking or advertising cookies are used. You can manage cookie preferences via the cookie consent banner.
            </p>
          </Section>

          <Section title="7. Contact Us">
            <p>
              For any privacy-related inquiries or to exercise your GDPR rights, please contact our Data Protection Officer:
            </p>
            <div className="flex items-center gap-2 mt-2 text-primary-600">
              <Mail className="h-4 w-4" />
              <a href="mailto:privacy@invoicetrack.com" className="text-sm font-medium hover:underline">
                privacy@invoicetrack.com
              </a>
            </div>
          </Section>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>{t.gdpr.privacyUpdated}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Section sub-component
// ---------------------------------------------------------------------------

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
    <div className="text-sm text-gray-600 space-y-2 leading-relaxed">{children}</div>
  </section>
);
