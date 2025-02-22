import React from 'react';

const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Terms & Conditions</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Welcome to OllO!</h2>
        <p className="mb-4">These Terms of Service constitute a legally binding agreement between Ollo Labs Inc. ("Company," "we," "us," or "our") and each user ("you" or "your"). By using OllO, you're agreeing to these terms, so please read them carefully. To use OllO, you must be at least thirteen (13) years old (or any greater age required in your location).</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
        <p className="mb-4">By downloading, accessing, or using the OllO app or website (the "Service"), creating an account, or clicking "I agree," you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you don't agree with these terms, please don't use our Service.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">About Our Service</h2>
        <p className="mb-4">OllO is an innovative AI-powered platform designed to help you discover, learn from, and share audio content. While we strive to provide a great experience, please understand that:</p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Our Service is provided "as is" and may change over time</li>
          <li className="mb-2">We may add, remove, or modify features at any time</li>
          <li className="mb-2">We may experience occasional downtime or technical issues</li>
          <li className="mb-2">Content recommendations are algorithmic and may not always match your preferences</li>
        </ul>
        <p className="mb-4">You can manage your account information by emailing us at contact@ollo.audio.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Service Options</h2>
        <h3 className="text-xl font-semibold mt-6 mb-3">Free Service</h3>
        <p className="mb-4">We offer certain features at no cost. We may change, limit, or discontinue any aspect of the free service at our discretion.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">Premium Features</h3>
        <p className="mb-4">Additional features may be available through premium subscriptions. Subscription terms, pricing, and features may change. Cancellation policies and payment terms are handled through your platform's app store or our payment processor.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Content and Intellectual Property</h2>
        <p className="mb-4">OllO uses advanced AI technology to enhance the audio content experience. By using our Service, you acknowledge that:</p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">We may process, analyze, and transform content using AI technology</li>
          <li className="mb-2">Content may be used for service improvement and feature development</li>
          <li className="mb-2">We respect intellectual property rights and expect users to do the same</li>
          <li className="mb-2">We may remove content that violates these terms or applicable laws</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">User Responsibilities</h2>
        <p className="mb-4">While using OllO, you agree to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Provide accurate account information</li>
          <li className="mb-2">Use the Service in compliance with applicable laws</li>
          <li className="mb-2">Not attempt to reverse engineer or bypass security features</li>
          <li className="mb-2">Not use the Service to distribute harmful content or malware</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Termination</h2>
        <p className="mb-4">We reserve the right to suspend or terminate access to the Service at our discretion, with or without notice. You may stop using the Service at any time. Upon termination, relevant terms of this agreement will continue to apply.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Disclaimers and Limitations</h2>
        <p className="mb-4">TO THE FULLEST EXTENT PERMITTED BY LAW:</p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">THE SERVICE IS PROVIDED "AS IS" WITHOUT ANY WARRANTIES</li>
          <li className="mb-2">WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
          <li className="mb-2">OUR TOTAL LIABILITY SHALL NOT EXCEED THE GREATER OF $100 OR THE AMOUNT PAID FOR THE SERVICE IN THE PAST SIX MONTHS</li>
          <li className="mb-2">WE ARE NOT LIABLE FOR ANY THIRD-PARTY SERVICES OR CONTENT</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
        <p className="mb-4">We may update these terms at any time. We'll notify you of significant changes through the app or email. Continued use of the Service after changes constitutes acceptance of the updated terms.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
        <p className="mb-4">These terms are governed by Delaware law. Any disputes shall be subject to the exclusive jurisdiction of the courts in Delaware, without regard to conflicts of law principles.</p>
      </section>

      <footer className="text-sm text-gray-600">
        <p>Last Updated: January 1, 2025</p>
        <p className="mt-2">Questions? Contact us at contact@ollo.audio</p>
      </footer>
    </div>
  );
};

export default TermsPage;