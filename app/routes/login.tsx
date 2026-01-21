import { data, redirect, Link, Form, useActionData, useNavigation, useSearchParams } from 'react-router';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator';
import { prisma } from '~/services/prisma.server';
import { getSession, linkUserToSession } from '~/services/session.server';
import { migrateSessionToUser } from '~/services/session-migration.server';
import { checkAuthRateLimit, getClientIp } from '~/services/rate-limiter.server';
import type { Route } from './+types/login';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export function meta() {
  return [
    { title: 'Login - AIPrintly' },
    {
      name: 'description',
      content: 'Sign in to your AIPrintly account to manage your creations and orders.',
    },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  // Check rate limit
  const ip = getClientIp(request);
  const rateLimitResult = await checkAuthRateLimit(ip);
  if (!rateLimitResult.allowed) {
    return data(
      {
        errors: {},
        formError: 'Too many login attempts. Please try again later.',
        values: {},
      },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const rawData = Object.fromEntries(formData);

  // Validate form data
  const result = loginSchema.safeParse(rawData);
  if (!result.success) {
    const errors = result.error.flatten();
    return data(
      {
        errors: errors.fieldErrors,
        formError: errors.formErrors[0] || null,
        values: { email: rawData.email as string },
      },
      { status: 400 }
    );
  }

  const { email, password } = result.data;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      passwordHash: true,
    },
  });

  // Check user exists and has a password (not magic link only)
  if (!user || !user.passwordHash) {
    return data(
      {
        errors: {},
        formError: 'Invalid email or password',
        values: { email },
      },
      { status: 400 }
    );
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return data(
      {
        errors: {},
        formError: 'Invalid email or password',
        values: { email },
      },
      { status: 400 }
    );
  }

  // Get current session for migration
  const session = await getSession(request);
  const sessionId = session.get('id');

  // Migrate any guest session data (assets, cart items, etc.)
  if (sessionId) {
    await migrateSessionToUser(sessionId, user.id);
  }

  // Link user to session
  const { header } = await linkUserToSession(request, user.id);

  // Check for redirect URL
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirectTo') || '/create';

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': header,
    },
  });
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === 'submitting';
  const redirectTo = searchParams.get('redirectTo');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your account to continue creating
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form method="post" className="space-y-4">
            {actionData?.formError && (
              <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400" data-testid="form-error">
                {actionData.formError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                defaultValue={actionData?.values?.email}
                aria-invalid={!!actionData?.errors?.email}
                aria-describedby={actionData?.errors?.email ? 'email-error' : undefined}
                data-testid="email-input"
              />
              {actionData?.errors?.email && (
                <p id="email-error" role="alert" data-testid="email-error" className="text-sm text-red-600 dark:text-red-400">
                  {actionData.errors.email[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-sky-600 hover:underline dark:text-sky-400"
                  data-testid="forgot-password-link"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={!!actionData?.errors?.password}
                aria-describedby={actionData?.errors?.password ? 'password-error' : undefined}
                data-testid="password-input"
              />
              {actionData?.errors?.password && (
                <p id="password-error" role="alert" data-testid="password-error" className="text-sm text-red-600 dark:text-red-400">
                  {actionData.errors.password[0]}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="login-button">
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full" disabled>
            <svg
              className="mr-2 h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"
                fill="currentColor"
              />
            </svg>
            Sign in with Magic Link (Coming Soon)
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link
              to={redirectTo ? `/register?redirectTo=${encodeURIComponent(redirectTo)}` : '/register'}
              className="font-medium text-sky-600 hover:underline dark:text-sky-400"
              data-testid="go-to-register-link"
            >
              Create one
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
