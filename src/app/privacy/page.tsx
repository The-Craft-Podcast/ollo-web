import React from 'react';

const PrivacyPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Welcome to OllO's Privacy Policy</h2>
        <p className="mb-4">At OllO, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information when you use our service. By using OllO, you agree to the collection and use of information in accordance with this policy.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
        <p className="mb-4">We collect various types of information to provide and improve our service:</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">Account Information</h3>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Basic profile information (name, email, etc.)</li>
          <li className="mb-2">Authentication data from third-party services (Google, Apple)</li>
          <li className="mb-2">Profile preferences and settings</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">Usage Information</h3>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Interaction data (likes, shares, listening history)</li>
          <li className="mb-2">Search queries and content preferences</li>
          <li className="mb-2">Device information and identifiers</li>
          <li className="mb-2">Usage patterns and feature interaction</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">Technical Information</h3>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">IP addresses and location data</li>
          <li className="mb-2">Device specifications and settings</li>
          <li className="mb-2">Operating system and app version</li>
          <li className="mb-2">Error reports and performance data</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
        <p className="mb-4">We use the collected information for various purposes:</p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">To provide and maintain our service</li>
          <li className="mb-2">To personalize your experience and content recommendations</li>
          <li className="mb-2">To improve our AI algorithms and features</li>
          <li className="mb-2">To communicate with you about updates and changes</li>
          <li className="mb-2">To detect and prevent technical issues or abuse</li>
          <li className="mb-2">To comply with legal obligations</li>
          <li className="mb-2">To analyze usage patterns and improve our service</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Data Sharing and Third Parties</h2>
        <p className="mb-4">We may share your information with:</p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Service providers who assist in operating our platform</li>
          <li className="mb-2">Analytics providers to help us improve our service</li>
          <li className="mb-2">Law enforcement when required by law</li>
          <li className="mb-2">Business partners with your consent</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Data Storage and Security</h2>
        <p className="mb-4">We implement appropriate security measures to protect your information, but no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of your data.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">AI and Machine Learning</h2>
        <p className="mb-4">Our service uses AI and machine learning technologies to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Process and analyze audio content</li>
          <li className="mb-2">Generate personalized recommendations</li>
          <li className="mb-2">Improve service functionality</li>
          <li className="mb-2">Train and enhance our AI models</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Rights and Choices</h2>
        <p className="mb-4">You have certain rights regarding your personal information:</p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Access your personal data</li>
          <li className="mb-2">Request corrections or deletion</li>
          <li className="mb-2">Object to certain processing</li>
          <li className="mb-2">Opt-out of marketing communications</li>
        </ul>
        <p className="mb-4">Contact us at contact@ollo.audio to exercise these rights.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
        <p className="mb-4">Our service is not intended for users under 13 years of age. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
        <p className="mb-4">We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
        <p className="mb-4">If you have any questions about this Privacy Policy, please contact us at:</p>
        <p className="mb-2">Email: contact@ollo.audio</p>
      </section>

      <footer className="text-sm text-gray-600">
        <p>Last Updated: January 1, 2025</p>
      </footer>
    </div>
  );
};

export default PrivacyPage;