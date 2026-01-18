import { Link } from 'react-router';
import { Button } from '~/components/ui/button';

/**
 * Catch-all route for 404 pages.
 * This route matches any path that doesn't match other routes.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md text-center">
        <p className="mb-2 text-6xl font-bold text-sky-600 dark:text-sky-400">404</p>
        <h1 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Page not found
        </h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          Sorry, we couldn't find the page you're looking for. The page may have been moved,
          deleted, or never existed.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/">Go back home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/" onClick={() => window.history.back()}>
              Go back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
