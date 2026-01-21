import * as React from 'react';
import { Link, Form } from 'react-router';
import { Menu, ShoppingCart, User, LogOut } from 'lucide-react';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import {
  DesktopNavigation,
  MobileNavigation,
  defaultNavLinks,
  type NavLink,
} from './Navigation';

interface HeaderProps {
  /** Whether the user is authenticated */
  isAuthenticated?: boolean;
  /** User information for displaying in the header */
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
  /** Number of items in the cart */
  cartItemCount?: number;
  /** Navigation links to display */
  navLinks?: NavLink[];
  /** Additional class name for the header */
  className?: string;
}

/**
 * Site header component
 * Contains logo, navigation, cart, and authentication controls
 */
export function Header({
  isAuthenticated = false,
  user = null,
  cartItemCount = 0,
  navLinks = defaultNavLinks,
  className,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-sky-600 focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <header
        className={cn(
          'sticky top-0 z-40 w-full',
          'bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60',
          'dark:bg-gray-950/95 dark:supports-[backdrop-filter]:bg-gray-950/60',
          'border-b border-gray-200 dark:border-gray-800',
          className
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 text-xl font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colours"
            >
              AIPrintly
            </Link>

            {/* Desktop Navigation */}
            <DesktopNavigation links={navLinks} />

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Cart button - always visible */}
              <Button variant="ghost" size="icon" asChild className="relative" data-testid="cart-button">
                <Link to="/cart" aria-label="Shopping cart">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white" data-testid="cart-count">
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </span>
                  )}
                </Link>
              </Button>

              {/* Auth section - desktop only */}
              <div className="hidden md:flex items-center gap-2">
                {isAuthenticated && user ? (
                  // Authenticated user menu
                  <>
                    <Button variant="ghost" size="icon" asChild data-testid="user-menu">
                      <Link to="/account" aria-label="My account">
                        <User className="h-5 w-5" />
                      </Link>
                    </Button>
                    <Form method="post" action="/logout">
                      <Button variant="ghost" size="icon" type="submit" aria-label="Log out" data-testid="logout-button">
                        <LogOut className="h-5 w-5" />
                      </Button>
                    </Form>
                  </>
                ) : (
                  // Unauthenticated - show login/register
                  <>
                    <Button variant="ghost" asChild data-testid="login-link">
                      <Link to="/login">Login</Link>
                    </Button>
                    <Button asChild data-testid="register-link">
                      <Link to="/register">Register</Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={toggleMobileMenu}
                aria-label="Open menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation overlay */}
      <MobileNavigation
        links={navLinks}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
    </>
  );
}

export { type HeaderProps };
