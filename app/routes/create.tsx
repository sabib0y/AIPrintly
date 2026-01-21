import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

export function meta() {
  return [
    { title: 'Create - AIPrintly' },
    {
      name: 'description',
      content:
        'Create custom print products by uploading your own images or generating unique designs with AI.',
    },
  ];
}

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Create Your Design
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Choose how you&apos;d like to create your custom product
          </p>
        </div>

        {/* Creation Options */}
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {/* Upload Option */}
          <Card className="relative overflow-hidden transition-all hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent" />
            <CardHeader className="relative">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-400">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <CardTitle className="text-2xl">Upload Your Image</CardTitle>
              <CardDescription className="text-base">
                Already have a design or photo? Upload it and we&apos;ll help you
                turn it into a beautiful print product.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <ul className="mb-6 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-sky-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Supports JPG, PNG, and WebP formats
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-sky-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Automatic image enhancement
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-sky-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Preview on multiple products
                </li>
              </ul>
              <Button asChild className="w-full" size="lg" data-testid="upload-option">
                <Link to="/create/upload">Upload Image</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Generate Option */}
          <Card className="relative overflow-hidden transition-all hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
            <CardHeader className="relative">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <CardTitle className="text-2xl">Generate with AI</CardTitle>
              <CardDescription className="text-base">
                Describe what you want and let our AI create unique, stunning
                designs just for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <ul className="mb-6 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-indigo-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Unlimited creative possibilities
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-indigo-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Multiple style options
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-indigo-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Regenerate until perfect
                </li>
              </ul>
              <Button
                asChild
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                size="lg"
                data-testid="generate-option"
              >
                <Link to="/create/generate">Start Generating</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Not sure where to start?{' '}
            <Link
              to="/products"
              className="font-medium text-sky-600 hover:underline dark:text-sky-400"
            >
              Browse our products
            </Link>{' '}
            for inspiration.
          </p>
        </div>
      </div>
    </div>
  );
}
