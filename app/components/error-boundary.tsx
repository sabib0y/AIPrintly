import { Link, useRouteError, isRouteErrorResponse } from 'react-router';
import { Button } from '~/components/ui/button';

interface ErrorBoundaryProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

/**
 * A reusable error boundary component that displays a user-friendly
 * error message with optional stack trace in development mode.
 */
export function ErrorBoundary({ error, resetErrorBoundary }: ErrorBoundaryProps) {
  const routeError = useRouteError();
  const errorToDisplay = error || routeError;

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred. Please try again later.';
  let statusCode: number | null = null;
  let stack: string | undefined;

  if (isRouteErrorResponse(errorToDisplay)) {
    statusCode = errorToDisplay.status;
    title = errorToDisplay.status === 404 ? 'Page not found' : `Error ${errorToDisplay.status}`;
    message =
      errorToDisplay.status === 404
        ? "Sorry, we couldn't find the page you're looking for."
        : errorToDisplay.statusText || message;
  } else if (errorToDisplay instanceof Error) {
    message = errorToDisplay.message || message;
    // Only show stack trace in development
    if (import.meta.env.DEV) {
      stack = errorToDisplay.stack;
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md text-center">
        {statusCode && (
          <p className="mb-2 text-6xl font-bold text-sky-600 dark:text-sky-400">
            {statusCode}
          </p>
        )}
        <h1 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">{message}</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/">Go back home</Link>
          </Button>
          {resetErrorBoundary && (
            <Button variant="outline" onClick={resetErrorBoundary}>
              Try again
            </Button>
          )}
        </div>

        {stack && (
          <div className="mt-8 text-left">
            <details className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                Stack trace (development only)
              </summary>
              <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words text-xs text-red-600 dark:text-red-400">
                <code>{stack}</code>
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

export default ErrorBoundary;
