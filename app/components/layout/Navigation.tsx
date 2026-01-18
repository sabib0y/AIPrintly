import * as React from 'react';
import { Link, useLocation } from 'react-router';
import { X } from 'lucide-react';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';

/**
 * Navigation link configuration
 */
export interface NavLink {
  label: string;
  href: string;
}

/**
 * Default navigation links for the site
 */
export const defaultNavLinks: NavLink[] = [
  { label: 'Products', href: '/products' },
  { label: 'Create', href: '/create' },
  { label: 'Cart', href: '/cart' },
];

interface NavigationProps {
  /** Navigation links to display */
  links?: NavLink[];
  /** Whether the mobile menu is open */
  isMobileMenuOpen?: boolean;
  /** Callback to close the mobile menu */
  onCloseMobileMenu?: () => void;
  /** Additional class name for the navigation container */
  className?: string;
}

/**
 * Desktop navigation component
 * Renders horizontal navigation links for larger screens
 */
export function DesktopNavigation({
  links = defaultNavLinks,
  className,
}: NavigationProps) {
  const location = useLocation();

  return (
    <nav className={cn('hidden md:flex items-center gap-1', className)}>
      {links.map((link) => {
        const isActive = location.pathname === link.href;
        return (
          <Link
            key={link.href}
            to={link.href}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colours',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              isActive
                ? 'text-sky-600 dark:text-sky-400'
                : 'text-gray-700 dark:text-gray-300'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Mobile navigation component
 * Renders a full-screen overlay menu for smaller screens
 */
export function MobileNavigation({
  links = defaultNavLinks,
  isMobileMenuOpen = false,
  onCloseMobileMenu,
  className,
}: NavigationProps) {
  const location = useLocation();

  // Close menu when route changes
  React.useEffect(() => {
    if (isMobileMenuOpen && onCloseMobileMenu) {
      onCloseMobileMenu();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!isMobileMenuOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 md:hidden',
        'bg-white dark:bg-gray-950',
        className
      )}
    >
      {/* Header with close button */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 dark:border-gray-800">
        <span className="text-xl font-bold text-sky-600 dark:text-sky-400">
          AIPrintly
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCloseMobileMenu}
          aria-label="Close menu"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Navigation links */}
      <nav className="flex flex-col p-4 gap-2">
        {links.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'px-4 py-3 text-lg font-medium rounded-lg transition-colours',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                isActive
                  ? 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-950'
                  : 'text-gray-700 dark:text-gray-300'
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Auth section in mobile menu */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex flex-col gap-2">
          <Button variant="outline" className="w-full" asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button className="w-full" asChild>
            <Link to="/register">Register</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export { type NavigationProps };
