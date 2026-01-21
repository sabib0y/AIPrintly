import * as React from 'react';
import { cn } from '~/lib/utils';
import { Header, type HeaderProps } from './Header';
import { Footer, type FooterProps } from './Footer';

interface LayoutProps {
  /** Content to render within the layout */
  children: React.ReactNode;
  /** Props to pass to the Header component */
  headerProps?: Omit<HeaderProps, 'className'>;
  /** Props to pass to the Footer component */
  footerProps?: Omit<FooterProps, 'className'>;
  /** Whether to show the header */
  showHeader?: boolean;
  /** Whether to show the footer */
  showFooter?: boolean;
  /** Additional class name for the main content area */
  mainClassName?: string;
  /** Additional class name for the layout container */
  className?: string;
}

/**
 * Main layout wrapper component
 * Combines Header, main content area, and Footer into a cohesive page structure
 */
export function Layout({
  children,
  headerProps,
  footerProps,
  showHeader = true,
  showFooter = true,
  mainClassName,
  className,
}: LayoutProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col',
        'bg-white dark:bg-gray-950',
        'text-gray-900 dark:text-gray-100',
        className
      )}
    >
      {/* Header */}
      {showHeader && <Header {...headerProps} />}

      {/* Main content */}
      <main id="main-content" className={cn('flex-1', mainClassName)}>{children}</main>

      {/* Footer */}
      {showFooter && <Footer {...footerProps} />}
    </div>
  );
}

export { type LayoutProps };
