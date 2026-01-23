/**
 * Privacy Policy Page
 *
 * Comprehensive privacy policy with GDPR compliance and dedicated
 * children's data handling section.
 */

import { Link } from 'react-router';
import { AlertTriangle, Shield, ExternalLink } from 'lucide-react';
import { cn } from '~/lib/utils';
import { Separator } from '~/components/ui/separator';

/**
 * Meta tags for the privacy policy page
 */
export function meta() {
  return [
    { title: 'Privacy Policy - AIPrintly' },
    {
      name: 'description',
      content:
        'Learn how AIPrintly collects, uses, and protects your personal data. GDPR compliant privacy policy.',
    },
  ];
}

/**
 * Table of contents sections
 */
const sections = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'information-we-collect', label: 'Information We Collect' },
  { id: 'how-we-use', label: 'How We Use Your Information' },
  { id: 'childrens-data', label: "Children's Data" },
  { id: 'data-retention', label: 'Data Retention' },
  { id: 'your-rights', label: 'Your Rights (GDPR)' },
  { id: 'data-security', label: 'Data Security' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'third-parties', label: 'Third Parties' },
  { id: 'contact', label: 'Contact Us' },
];

/**
 * Table of Contents Component
 */
function TableOfContents() {
  return (
    <nav
      aria-label="Table of contents"
      className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Contents
      </h2>
      <ol className="space-y-2">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={cn(
                'text-sm transition-colours hover:text-sky-600 dark:hover:text-sky-400',
                section.id === 'childrens-data'
                  ? 'font-medium text-amber-600 dark:text-amber-400'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              {index + 1}. {section.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Section heading component with anchor link
 */
function SectionHeading({
  id,
  children,
  isHighlighted = false,
}: {
  id: string;
  children: React.ReactNode;
  isHighlighted?: boolean;
}) {
  return (
    <h2
      id={id}
      className={cn(
        'scroll-mt-8 text-xl font-semibold',
        isHighlighted
          ? 'text-amber-700 dark:text-amber-400'
          : 'text-gray-900 dark:text-white'
      )}
    >
      {children}
    </h2>
  );
}

/**
 * Privacy Policy Page Component
 */
export default function PrivacyPolicyPage() {
  const lastUpdated = '23 January 2026';

  return (
    <div className="min-h-screen bg-white py-12 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-sky-600 dark:text-sky-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Privacy Policy
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdated}
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* Main Content */}
          <article className="prose prose-gray dark:prose-invert max-w-none">
            {/* Introduction */}
            <section className="mb-10">
              <SectionHeading id="introduction">1. Introduction</SectionHeading>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Welcome to AIPrintly. We are AIPrintly Ltd, a company registered
                in the United Kingdom. This privacy policy explains how we
                collect, use, store, and protect your personal information when
                you use our website and services.
              </p>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                This policy applies to all users of our platform, including
                those who upload images, use our AI generation features, and
                purchase products through our site.
              </p>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                By using AIPrintly, you agree to the collection and use of
                information in accordance with this policy. If you do not agree
                with our practices, please do not use our services.
              </p>
            </section>

            <Separator className="my-8" />

            {/* Information We Collect */}
            <section className="mb-10">
              <SectionHeading id="information-we-collect">
                2. Information We Collect
              </SectionHeading>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                We collect several types of information to provide and improve
                our services:
              </p>

              <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
                Account Information
              </h3>
              <ul className="mt-2 list-disc pl-6 text-gray-600 dark:text-gray-300">
                <li>Email address (required for account creation)</li>
                <li>
                  Password (stored securely using industry-standard hashing)
                </li>
                <li>Account creation and last login dates</li>
              </ul>

              <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
                Order Information
              </h3>
              <ul className="mt-2 list-disc pl-6 text-gray-600 dark:text-gray-300">
                <li>
                  Shipping address (name, street address, city, postcode,
                  country)
                </li>
                <li>
                  Payment information (processed securely through Stripe — we do
                  not store your card details)
                </li>
                <li>Order history and transaction records</li>
              </ul>

              <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
                Uploaded Content
              </h3>
              <ul className="mt-2 list-disc pl-6 text-gray-600 dark:text-gray-300">
                <li>Images you upload for product customisation</li>
                <li>AI-generated images created through our platform</li>
                <li>Product configurations and customisation preferences</li>
              </ul>

              <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
                Usage Data
              </h3>
              <ul className="mt-2 list-disc pl-6 text-gray-600 dark:text-gray-300">
                <li>
                  Device information (browser type, operating system, device
                  type)
                </li>
                <li>IP address and approximate location</li>
                <li>
                  Pages visited, features used, and time spent on our platform
                </li>
                <li>Referral sources</li>
              </ul>
            </section>

            <Separator className="my-8" />

            {/* How We Use Your Information */}
            <section className="mb-10">
              <SectionHeading id="how-we-use">
                3. How We Use Your Information
              </SectionHeading>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                We use your information for the following purposes:
              </p>

              <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
                To Fulfil Orders
              </h3>
              <ul className="mt-2 list-disc pl-6 text-gray-600 dark:text-gray-300">
                <li>Processing and shipping your orders</li>
                <li>
                  Sharing necessary information with fulfilment partners
                  (Printful, Blurb)
                </li>
                <li>Handling returns and refunds</li>
              </ul>

              <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
                To Provide AI Generation Services
              </h3>
              <ul className="mt-2 list-disc pl-6 text-gray-600 dark:text-gray-300">
                <li>Processing your text prompts to generate images</li>
                <li>Managing your AI credit balance</li>
                <li>Improving generation quality (anonymised, aggregated data only)</li>
              </ul>

              <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
                To Communicate With You
              </h3>
              <ul className="mt-2 list-disc pl-6 text-gray-600 dark:text-gray-300">
                <li>Sending order confirmations and shipping updates</li>
                <li>Responding to your support enquiries</li>
                <li>Notifying you of important account or service changes</li>
              </ul>

              <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
                To Improve Our Services
              </h3>
              <ul className="mt-2 list-disc pl-6 text-gray-600 dark:text-gray-300">
                <li>Analysing usage patterns to enhance user experience</li>
                <li>Identifying and fixing technical issues</li>
                <li>Developing new features and products</li>
              </ul>
            </section>

            <Separator className="my-8" />

            {/* Children's Data — IMPORTANT SECTION */}
            <section className="mb-10">
              <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-6 dark:border-amber-600 dark:bg-amber-900/20">
                <div className="mb-4 flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  <SectionHeading id="childrens-data" isHighlighted>
                    4. Children's Data
                  </SectionHeading>
                </div>

                <p className="text-gray-700 dark:text-gray-200">
                  We take the protection of children's data extremely seriously.
                  Please read this section carefully if you are uploading photos
                  that include children.
                </p>

                <h3 className="mt-6 text-lg font-medium text-amber-800 dark:text-amber-300">
                  Age Requirements
                </h3>
                <ul className="mt-2 list-disc pl-6 text-gray-700 dark:text-gray-200">
                  <li>
                    <strong>We do not knowingly collect personal data from children under 13.</strong>
                  </li>
                  <li>
                    Our services are intended for users aged 16 and over, or
                    users aged 13-15 with parental consent.
                  </li>
                  <li>
                    If we discover we have collected data from a child under 13,
                    we will delete it immediately.
                  </li>
                </ul>

                <h3 className="mt-6 text-lg font-medium text-amber-800 dark:text-amber-300">
                  Photos Containing Children
                </h3>
                <ul className="mt-2 list-disc pl-6 text-gray-700 dark:text-gray-200">
                  <li>
                    <strong>
                      If you upload photos featuring children, you confirm you
                      have parental or guardian consent to do so.
                    </strong>
                  </li>
                  <li>
                    Photos are processed solely for the purpose of creating your
                    custom products.
                  </li>
                  <li>
                    Photos are stored temporarily and{' '}
                    <strong>automatically deleted within 30 days</strong> if not
                    used in a completed order.
                  </li>
                </ul>

                <h3 className="mt-6 text-lg font-medium text-amber-800 dark:text-amber-300">
                  AI Training Commitment
                </h3>
                <div className="mt-2 rounded-md bg-white/60 p-4 dark:bg-gray-800/60">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Your photos are NEVER used to train AI models.
                  </p>
                  <p className="mt-2 text-gray-700 dark:text-gray-200">
                    We do not use any uploaded images — including those
                    featuring children — to train, fine-tune, or improve AI
                    image generation systems. Your photos are used exclusively
                    to fulfil your product orders.
                  </p>
                </div>

                <h3 className="mt-6 text-lg font-medium text-amber-800 dark:text-amber-300">
                  Parental Rights
                </h3>
                <ul className="mt-2 list-disc pl-6 text-gray-700 dark:text-gray-200">
                  <li>
                    Parents or guardians may request{' '}
                    <strong>immediate deletion</strong> of any photos containing
                    their children.
                  </li>
                  <li>
                    Contact us at{' '}
                    <a
                      href="mailto:privacy@aiprintly.com"
                      className="font-medium text-amber-700 underline hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                    >
                      privacy@aiprintly.com
                    </a>{' '}
                    for urgent deletion requests.
                  </li>
                  <li>
                    We aim to process deletion requests within 24 hours.
                  </li>
                </ul>

                <h3 className="mt-6 text-lg font-medium text-amber-800 dark:text-amber-300">
                  ICO Children's Code
                </h3>
                <p className="mt-2 text-gray-700 dark:text-gray-200">
                  We are committed to following the UK Information
                  Commissioner's Office (ICO) Age Appropriate Design Code
                  (Children's Code). For more information about children's data
                  protection rights, visit the{' '}
                  <a
                    href="https://ico.org.uk/for-organisations/childrens-code-hub/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-amber-700 underline hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                  >
                    ICO Children's Code Hub
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  .
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Data Retention */}
            <section className="mb-10">
              <SectionHeading id="data-retention">
                5. Data Retention
              </SectionHeading>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                We retain your data for different periods depending on its type
                and purpose:
              </p>

              <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        Data Type
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        Retention Period
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        Uploaded images (unused)
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        30 days (automatically deleted)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        Order images
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        90 days after order completion
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        AI generation jobs
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        90 days
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        Order records
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        6 years (HMRC legal requirement)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        Account data
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        Until you request deletion
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Your Rights (GDPR) */}
            <section className="mb-10">
              <SectionHeading id="your-rights">
                6. Your Rights (GDPR)
              </SectionHeading>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Under the UK General Data Protection Regulation (UK GDPR), you
                have the following rights:
              </p>

              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Right to Access
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    You can request a copy of all personal data we hold about
                    you.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Right to Rectification
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    You can request that we correct any inaccurate or incomplete
                    data.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Right to Erasure
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    You can request deletion of your personal data. Note: some
                    data must be retained for legal purposes.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Right to Data Portability
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    You can request your data in a machine-readable format for
                    transfer to another service.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Right to Object
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    You can object to certain types of processing, including
                    direct marketing.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Right to Withdraw Consent
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Where we rely on consent, you can withdraw it at any time.
                  </p>
                </div>
              </div>

              <p className="mt-6 text-gray-600 dark:text-gray-300">
                To exercise any of these rights, please contact us at{' '}
                <a
                  href="mailto:privacy@aiprintly.com"
                  className="font-medium text-sky-600 underline hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                >
                  privacy@aiprintly.com
                </a>
                . We will respond within one month.
              </p>
            </section>

            <Separator className="my-8" />

            {/* Data Security */}
            <section className="mb-10">
              <SectionHeading id="data-security">
                7. Data Security
              </SectionHeading>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                We implement appropriate technical and organisational measures
                to protect your data:
              </p>

              <ul className="mt-4 list-disc pl-6 text-gray-600 dark:text-gray-300">
                <li>
                  <strong>Encryption in Transit:</strong> All data transmitted
                  to and from our servers is encrypted using HTTPS/TLS.
                </li>
                <li className="mt-2">
                  <strong>Secure Payment Processing:</strong> All payments are
                  processed through Stripe, which is PCI DSS Level 1 compliant.
                  We never store your card details.
                </li>
                <li className="mt-2">
                  <strong>Encrypted Storage:</strong> Sensitive data is
                  encrypted at rest using industry-standard encryption.
                </li>
                <li className="mt-2">
                  <strong>Access Controls:</strong> Only authorised personnel
                  have access to personal data, on a need-to-know basis.
                </li>
                <li className="mt-2">
                  <strong>Data Location:</strong> Your data is stored on servers
                  located in the European Union and United Kingdom.
                </li>
              </ul>
            </section>

            <Separator className="my-8" />

            {/* Cookies */}
            <section className="mb-10">
              <SectionHeading id="cookies">8. Cookies</SectionHeading>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                We use cookies to provide and improve our services:
              </p>

              <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
                Essential Cookies
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                These are necessary for the website to function properly. They
                include:
              </p>
              <ul className="mt-2 list-disc pl-6 text-gray-600 dark:text-gray-300">
                <li>Session cookies (to keep you logged in)</li>
                <li>Shopping cart cookies</li>
                <li>Security cookies (CSRF protection)</li>
              </ul>

              <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
                Analytics Cookies
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                We may use analytics cookies to understand how visitors use our
                site. These collect anonymous, aggregated data. You can opt out
                of analytics cookies through your browser settings.
              </p>

              <p className="mt-6 text-gray-600 dark:text-gray-300">
                You can control cookies through your browser settings. Note that
                disabling essential cookies may affect site functionality.
              </p>
            </section>

            <Separator className="my-8" />

            {/* Third Parties */}
            <section className="mb-10">
              <SectionHeading id="third-parties">
                9. Third Parties
              </SectionHeading>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                We share your data with the following third parties to provide
                our services:
              </p>

              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Stripe
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Payment processing. Stripe processes your payment
                    information securely. See{' '}
                    <a
                      href="https://stripe.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 underline hover:text-sky-700 dark:text-sky-400"
                    >
                      Stripe's Privacy Policy
                    </a>
                    .
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Printful
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Product fulfilment for prints, mugs, and apparel. We share
                    your shipping address and order details. See{' '}
                    <a
                      href="https://www.printful.com/policies/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 underline hover:text-sky-700 dark:text-sky-400"
                    >
                      Printful's Privacy Policy
                    </a>
                    .
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Blurb
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Storybook printing and fulfilment. We share your shipping
                    address and book content. See{' '}
                    <a
                      href="https://www.blurb.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 underline hover:text-sky-700 dark:text-sky-400"
                    >
                      Blurb's Privacy Policy
                    </a>
                    .
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    AI Image Provider
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    For AI image generation, we send your text prompts to our AI
                    provider. We do not send personal information or uploaded
                    images to AI providers. Generated images are stored on our
                    servers, not by the AI provider.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Cloudflare
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Content delivery and image storage. Images are stored
                    securely on Cloudflare R2. See{' '}
                    <a
                      href="https://www.cloudflare.com/privacypolicy/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 underline hover:text-sky-700 dark:text-sky-400"
                    >
                      Cloudflare's Privacy Policy
                    </a>
                    .
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Contact Us */}
            <section className="mb-10">
              <SectionHeading id="contact">10. Contact Us</SectionHeading>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                If you have any questions about this privacy policy or wish to
                exercise your rights, please contact us:
              </p>

              <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Privacy Enquiries
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Email:{' '}
                  <a
                    href="mailto:privacy@aiprintly.com"
                    className="font-medium text-sky-600 underline hover:text-sky-700 dark:text-sky-400"
                  >
                    privacy@aiprintly.com
                  </a>
                </p>

                <h3 className="mt-6 font-medium text-gray-900 dark:text-white">
                  Data Protection Contact
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  For data protection matters, including Subject Access Requests
                  (SARs), please email{' '}
                  <a
                    href="mailto:dpo@aiprintly.com"
                    className="font-medium text-sky-600 underline hover:text-sky-700 dark:text-sky-400"
                  >
                    dpo@aiprintly.com
                  </a>
                  .
                </p>

                <h3 className="mt-6 font-medium text-gray-900 dark:text-white">
                  Complaints
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  If you are not satisfied with our response to your enquiry,
                  you have the right to lodge a complaint with the UK
                  Information Commissioner's Office (ICO):
                </p>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Website:{' '}
                  <a
                    href="https://ico.org.uk/make-a-complaint/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-sky-600 underline hover:text-sky-700 dark:text-sky-400"
                  >
                    ico.org.uk/make-a-complaint
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
                <p className="mt-1 text-gray-600 dark:text-gray-300">
                  Telephone: 0303 123 1113
                </p>
              </div>
            </section>
          </article>

          {/* Sidebar - Table of Contents (Desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <TableOfContents />
            </div>
          </aside>
        </div>

        {/* Mobile Table of Contents */}
        <div className="mb-8 lg:hidden">
          <TableOfContents />
        </div>

        {/* Back to Home Link */}
        <div className="mt-12 text-center">
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
