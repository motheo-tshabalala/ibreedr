import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const lastUpdated = new Date().toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-warm-white pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>

        {/* Section 1 */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">What We Collect</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            iBreedr collects the following personal information to operate the livestock marketplace:
          </p>
          <ul className="text-sm text-gray-600 leading-relaxed list-disc pl-5 mt-2 space-y-1">
            <li>Name, email address, and phone number</li>
            <li>Farm name, location, and description</li>
            <li>Livestock listing information (breed, age, price, photos)</li>
            <li>ID documents and selfie photos for farm verification</li>
            <li>Chat messages between buyers and sellers</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Why We Collect It</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We collect your information to:
          </p>
          <ul className="text-sm text-gray-600 leading-relaxed list-disc pl-5 mt-2 space-y-1">
            <li>Operate the livestock marketplace and connect buyers with sellers</li>
            <li>Verify farm identities to build trust between users</li>
            <li>Facilitate communication between buyers and sellers</li>
            <li>Improve our platform and provide support</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">How We Store It</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your data is securely stored on Supabase cloud servers. Data is encrypted in transit and at rest.
            We retain your information for as long as your account is active, or as needed to provide you with our services.
            You may request deletion of your account at any time.
          </p>
        </div>

        {/* Section 4 */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Who Can See Your Data</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong>Public information:</strong> Your farm name, location, listings, and profile are visible to all iBreedr users.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            <strong>Contact information:</strong> Phone numbers are only visible to logged-in users.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            <strong>Verification documents:</strong> ID documents and selfie photos are only accessible to iBreedr administrators
            for the purpose of verifying your identity.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            <strong>Messages:</strong> Chat messages are visible only to the participants of the conversation.
          </p>
        </div>

        {/* Section 5 */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Your Rights Under POPIA</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Under South Africa's Protection of Personal Information Act (POPIA), you have the right to:
          </p>
          <ul className="text-sm text-gray-600 leading-relaxed list-disc pl-5 mt-2 space-y-1">
            <li>Access the personal information we hold about you</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Request deletion of your account and personal data</li>
            <li>Object to the processing of your personal information</li>
            <li>Withdraw consent for data processing</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            To exercise these rights, please contact us at privacy@ibreedr.co.za.
          </p>
        </div>

        {/* Section 6 */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Contact</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            If you have any questions about this privacy policy or your personal data, please contact us at:
          </p>
          <p className="text-sm text-primary-green font-medium mt-1">privacy@ibreedr.co.za</p>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            iBreedr is committed to protecting your privacy and complying with POPIA regulations.
          </p>
        </div>
      </div>
    </div>
  );
}