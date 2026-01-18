import { Link } from 'react-router';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { cn } from '~/lib/utils';
import { Separator } from '~/components/ui/separator';

/**
 * Footer link configuration
 */
interface FooterLink {
  label: string;
  href: string;
}

/**
 * Default footer links
 */
const footerLinks: FooterLink[] = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Returns', href: '/returns' },
  { label: 'Delivery', href: '/delivery' },
  { label: 'Contact', href: '/contact' },
];

/**
 * Social media link configuration
 */
interface SocialLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Default social media links (placeholder URLs)
 */
const socialLinks: SocialLink[] = [
  { label: 'Facebook', href: '#', icon: Facebook },
  { label: 'Instagram', href: '#', icon: Instagram },
  { label: 'Twitter', href: '#', icon: Twitter },
];

interface FooterProps {
  /** Additional class name for the footer */
  className?: string;
}

/**
 * Site footer component
 * Contains copyright text, legal links, and social media links
 */
export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'mt-auto border-t border-gray-200 dark:border-gray-800',
        'bg-gray-50 dark:bg-gray-900',
        className
      )}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Logo and copyright */}
          <div className="flex flex-col gap-2">
            <Link
              to="/"
              className="text-lg font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colours"
            >
              AIPrintly
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &copy; {currentYear} AIPrintly. All rights reserved.
            </p>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colours"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Social media links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colours"
                  aria-label={social.label}
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Bottom section */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-500">
          <p>
            Made with AI-powered creativity. Transform your ideas into stunning
            prints.
          </p>
        </div>
      </div>
    </footer>
  );
}

export { type FooterProps };
