// =============================================================================
// Terms of Service Page — Mock / Informational
// =============================================================================

import React from 'react';
import { Scale, Calendar, Mail } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useTranslation } from '../hooks/useTranslation';

export const Terms: React.FC = () => {
  const t = useTranslation();

  return (
    <div className="page-container max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.gdpr.termsOfService}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.gdpr.termsUpdated}</p>
        </div>
      </div>

      <Card className="prose prose-gray max-w-none">
        <div className="space-y-6">
          <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-xl">
            <Scale className="h-6 w-6 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Terms of Service</h2>
              <p className="text-sm text-gray-600 mt-1">
                By using Invoice Tracker, you agree to the following terms and conditions. Please read them carefully.
              </p>
            </div>
          </div>

          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using Invoice Tracker ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to all the terms, you may not access or use the Service.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              Invoice Tracker is a multi-tenant invoice management platform that allows businesses to create, send, and manage invoices, track payments, and organize client information. The Service is provided on a Software-as-a-Service (SaaS) basis.
            </p>
          </Section>

          <Section title="3. User Accounts & Responsibilities">
            <ul>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>You must provide accurate, current, and complete information during registration.</li>
              <li>You must not use the Service for any illegal or unauthorized purpose.</li>
              <li>You must not attempt to access another user's account or tenant data.</li>
            </ul>
          </Section>

          <Section title="4. Multi-Tenant Data Isolation">
            <p>
              The Service implements strict multi-tenant architecture. Your data is isolated from other tenants. You agree not to attempt to bypass tenant isolation mechanisms or access data belonging to other tenants.
            </p>
          </Section>

          <Section title="5. Data Ownership">
            <p>
              You retain full ownership of all data you enter into the Service. We claim no intellectual property rights over your data. You grant us a limited license to process your data solely for the purpose of providing the Service to you.
            </p>
          </Section>

          <Section title="6. Billing & Payments">
            <p>
              Currently, the Service is provided free of charge. If paid tiers are introduced in the future, you will be notified in advance and given the option to continue on a free tier (if available) or cancel your account.
            </p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, Invoice Tracker shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service.
            </p>
          </Section>

          <Section title="8. Termination">
            <p>
              You may terminate your account at any time via the Profile page. We reserve the right to suspend or terminate access to the Service for violations of these terms. Upon termination, your data will be handled in accordance with our Privacy Policy.
            </p>
          </Section>

          <Section title="9. Changes to Terms">
            <p>
              We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the Service. Continued use of the Service after changes constitutes acceptance of the new terms.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              For questions about these terms, please contact us:
            </p>
            <div className="flex items-center gap-2 mt-2 text-primary-600">
              <Mail className="h-4 w-4" />
              <a href="mailto:support@invoicetrack.com" className="text-sm font-medium hover:underline">
                support@invoicetrack.com
              </a>
            </div>
          </Section>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>{t.gdpr.termsUpdated}</span>
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
