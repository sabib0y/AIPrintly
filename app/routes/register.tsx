import { data, redirect, Link, Form, useActionData, useNavigation } from 'react-router';
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
import { prisma } from '~/services/prisma.server';
import { getSession, linkUserToSession } from '~/services/session.server';
import { migrateSessionToUser } from '~/services/session-migration.server';
import { initCreditsForUser } from '~/services/credits.server';
import { checkAuthRateLimit, getClientIp } from '~/services/rate-limiter.server';
import type { Route } from './+types/register';

const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password is too long'),
    confirmPassword: z.string(),
    terms: z.literal('on', {
      errorMap: () => ({ message: 'You must accept the terms and conditions' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export function meta() {
  return [
    { title: 'Create Account - AIPrintly' },
    {
      name: 'description',
      content:
        'Join AIPrintly and start creating custom print products with AI-powered design tools.',
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
        formError: 'Too many registration attempts. Please try again later.',
        values: {},
      },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const rawData = Object.fromEntries(formData);

  // Validate form data
  const result = registerSchema.safeParse(rawData);
  if (!result.success) {
    const errors = result.error.flatten();
    return data(
      {
        errors: errors.fieldErrors,
        formError: errors.formErrors[0],
        values: { email: rawData.email as string },
      },
      { status: 400 }
    );
  }

  const { email, password } = result.data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    return data(
      {
        errors: { email: ['An account with this email already exists'] },
        formError: null,
        values: { email },
      },
      { status: 400 }
    );
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
    },
  });

  // Get current session for migration
  const session = await getSession(request);
  const sessionId = session.get('id');

  // Initialise credits for new user (10 credits signup bonus)
  await initCreditsForUser(user.id);

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

export default function RegisterPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>
            Join AIPrintly and start creating amazing products
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                autoComplete="new-password"
                aria-invalid={!!actionData?.errors?.password}
                aria-describedby={actionData?.errors?.password ? 'password-error' : undefined}
                data-testid="password-input"
              />
              {actionData?.errors?.password ? (
                <p id="password-error" role="alert" data-testid="password-error" className="text-sm text-red-600 dark:text-red-400">
                  {actionData.errors.password[0]}
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Must be at least 8 characters long
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                autoComplete="new-password"
                aria-invalid={!!actionData?.errors?.confirmPassword}
                aria-describedby={
                  actionData?.errors?.confirmPassword ? 'confirm-password-error' : undefined
                }
                data-testid="confirm-password-input"
              />
              {actionData?.errors?.confirmPassword && (
                <p id="confirm-password-error" role="alert" data-testid="confirm-password-error" className="text-sm text-red-600 dark:text-red-400">
                  {actionData.errors.confirmPassword[0]}
                </p>
              )}
            </div>
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                aria-invalid={!!actionData?.errors?.terms}
                aria-describedby={actionData?.errors?.terms ? 'terms-error' : undefined}
              />
              <div>
                <Label htmlFor="terms" className="text-sm font-normal leading-5">
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    className="text-sky-600 hover:underline dark:text-sky-400"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy"
                    className="text-sky-600 hover:underline dark:text-sky-400"
                  >
                    Privacy Policy
                  </Link>
                </Label>
                {actionData?.errors?.terms && (
                  <p id="terms-error" className="text-sm text-red-600 dark:text-red-400">
                    {actionData.errors.terms[0]}
                  </p>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="register-button">
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-sky-600 hover:underline dark:text-sky-400"
              data-testid="go-to-login-link"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
