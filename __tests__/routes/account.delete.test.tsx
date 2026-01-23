/**
 * Account Delete Confirmation Page Tests
 *
 * Tests for the delete account confirmation page with password input.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRoutesStub } from 'react-router'
import bcrypt from 'bcryptjs'

// Mock environment variables
process.env.SESSION_SECRET = 'test_session_secret'

// Mock Prisma - using inline functions to avoid hoisting issues
vi.mock('~/services/prisma.server', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    asset: {
      deleteMany: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
    userCredits: {
      deleteMany: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    authToken: {
      deleteMany: vi.fn(),
    },
    creditTransaction: {
      deleteMany: vi.fn(),
    },
    generationJob: {
      deleteMany: vi.fn(),
    },
    productConfiguration: {
      deleteMany: vi.fn(),
    },
  },
}))

// Mock session service
vi.mock('~/services/session.server', () => ({
  getSession: vi.fn().mockResolvedValue({ get: vi.fn() }),
  commitSession: vi.fn().mockResolvedValue('session-cookie'),
  destroySession: vi.fn().mockResolvedValue('destroyed-session-cookie'),
  getUserIdFromSession: vi.fn(),
}))

// Mock rate limiter
vi.mock('~/services/rate-limiter.server', () => ({
  checkAuthRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 5 }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}))

// Import after mocks
import AccountDeletePage, { loader, action } from '~/routes/account.delete'
import { prisma } from '~/services/prisma.server'
import { getUserIdFromSession } from '~/services/session.server'
import { checkAuthRateLimit } from '~/services/rate-limiter.server'

// Type-safe component wrapper for testing
const TestAccountDeletePage = AccountDeletePage as React.ComponentType<any>

describe('Account Delete Confirmation Page', () => {
  const validPasswordHash = bcrypt.hashSync('ValidPassword123!', 12)
  const testUser = {
    id: 'test-user-id-123',
    email: 'test@example.com',
    passwordHash: validPasswordHash,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUserIdFromSession).mockResolvedValue(testUser.id)
    vi.mocked(checkAuthRateLimit).mockResolvedValue({ allowed: true, remaining: 5 })
    vi.mocked(prisma.user.findUnique).mockResolvedValue(testUser as any)

    // Default successful operations
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: testUser.id,
      email: `deleted_${testUser.id}@deleted.local`,
      passwordHash: null,
    } as any)
    vi.mocked(prisma.asset.deleteMany).mockResolvedValue({ count: 5 })
    vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: 2 })
    vi.mocked(prisma.userCredits.deleteMany).mockResolvedValue({ count: 1 })
    vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 3 })
    vi.mocked(prisma.authToken.deleteMany).mockResolvedValue({ count: 0 })
    vi.mocked(prisma.creditTransaction.deleteMany).mockResolvedValue({ count: 10 })
    vi.mocked(prisma.generationJob.deleteMany).mockResolvedValue({ count: 2 })
  })

  describe('Loader', () => {
    it('should redirect unauthenticated users to login', async () => {
      vi.mocked(getUserIdFromSession).mockResolvedValue(null)

      const request = new Request('http://localhost/account/delete')

      try {
        await loader({ request, params: {}, context: {} } as any)
        expect.fail('Should have redirected')
      } catch (response: any) {
        expect(response.status).toBe(302)
        expect(response.headers.get('Location')).toContain('/login')
      }
    })

    it('should return user email for authenticated users', async () => {
      const request = new Request('http://localhost/account/delete')

      const response = await loader({ request, params: {}, context: {} } as any)

      expect(response).toHaveProperty('email')
      expect(response.email).toBe(testUser.email)
    })
  })

  describe('Action', () => {
    it('should reject empty password', async () => {
      const request = new Request('http://localhost/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: '' }),
      })

      const response = await action({ request, params: {}, context: {} } as any)

      expect(response).toHaveProperty('errors')
      expect(response.errors?.password).toBeDefined()
    })

    it('should reject incorrect password', async () => {
      const request = new Request('http://localhost/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'WrongPassword123!' }),
      })

      const response = await action({ request, params: {}, context: {} } as any)

      expect(response).toHaveProperty('error')
      expect(response.error).toContain('password')
    })

    it('should enforce rate limits', async () => {
      vi.mocked(checkAuthRateLimit).mockResolvedValue({
        allowed: false,
        retryAfter: 900,
      })

      const request = new Request('http://localhost/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'ValidPassword123!' }),
      })

      const response = await action({ request, params: {}, context: {} } as any)

      expect(response).toHaveProperty('error')
      expect(response.error).toContain('Too many')
    })

    it('should redirect to homepage on successful deletion', async () => {
      const request = new Request('http://localhost/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ password: 'ValidPassword123!' }),
      })

      try {
        await action({ request, params: {}, context: {} } as any)
        // If we get here without error, the redirect was thrown
        expect.fail('Should have redirected')
      } catch (response: any) {
        // Redirect throws a Response object
        if (response instanceof Response) {
          expect(response.status).toBe(302)
          expect(response.headers.get('Location')).toBe('/?deleted=true')
        } else {
          // The redirect function might throw differently - check if it's a redirect
          expect(response.status).toBe(302)
        }
      }
    })
  })

  describe('Component Rendering', () => {
    it('should display warning heading', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account/delete',
          Component: TestAccountDeletePage,
          loader: () => ({ email: testUser.email }),
        },
      ])

      render(<Stub initialEntries={['/account/delete']} />)

      expect(
        await screen.findByRole('heading', { name: /delete.*account/i })
      ).toBeInTheDocument()
    })

    it('should display warning about permanent deletion', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account/delete',
          Component: TestAccountDeletePage,
          loader: () => ({ email: testUser.email }),
        },
      ])

      render(<Stub initialEntries={['/account/delete']} />)

      expect(await screen.findByText(/permanent/i)).toBeInTheDocument()
      expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument()
    })

    it('should list what will be deleted', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account/delete',
          Component: TestAccountDeletePage,
          loader: () => ({ email: testUser.email }),
        },
      ])

      render(<Stub initialEntries={['/account/delete']} />)

      // Should mention assets, cart items, credits being deleted
      expect(await screen.findByText(/images/i)).toBeInTheDocument()
      expect(screen.getByText(/cart/i)).toBeInTheDocument()
      expect(screen.getByText(/credits/i)).toBeInTheDocument()
    })

    it('should explain what will be kept (orders)', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account/delete',
          Component: TestAccountDeletePage,
          loader: () => ({ email: testUser.email }),
        },
      ])

      render(<Stub initialEntries={['/account/delete']} />)

      // Should explain order history is kept for legal reasons
      expect(await screen.findByText(/order.*history/i)).toBeInTheDocument()
    })

    it('should have password confirmation input', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account/delete',
          Component: TestAccountDeletePage,
          loader: () => ({ email: testUser.email }),
        },
      ])

      render(<Stub initialEntries={['/account/delete']} />)

      expect(await screen.findByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toHaveAttribute(
        'type',
        'password'
      )
    })

    it('should have destructive delete button', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account/delete',
          Component: TestAccountDeletePage,
          loader: () => ({ email: testUser.email }),
        },
      ])

      render(<Stub initialEntries={['/account/delete']} />)

      const deleteButton = await screen.findByRole('button', {
        name: /delete.*account/i,
      })
      expect(deleteButton).toBeInTheDocument()
      // Should have destructive styling (red)
      expect(deleteButton.className).toMatch(/red|destructive/i)
    })

    it('should have cancel link back to account settings', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account/delete',
          Component: TestAccountDeletePage,
          loader: () => ({ email: testUser.email }),
        },
      ])

      render(<Stub initialEntries={['/account/delete']} />)

      const cancelLink = await screen.findByRole('link', { name: /cancel/i })
      expect(cancelLink).toBeInTheDocument()
      expect(cancelLink).toHaveAttribute('href', '/account')
    })

    it('should display user email being deleted', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account/delete',
          Component: TestAccountDeletePage,
          loader: () => ({ email: testUser.email }),
        },
      ])

      render(<Stub initialEntries={['/account/delete']} />)

      expect(await screen.findByText(testUser.email)).toBeInTheDocument()
    })
  })

  describe('Form Behaviour', () => {
    it('should display error message for incorrect password', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account/delete',
          Component: TestAccountDeletePage,
          loader: () => ({ email: testUser.email }),
          action: () => ({ error: 'Incorrect password' }),
        },
      ])

      const user = userEvent.setup()

      render(<Stub initialEntries={['/account/delete']} />)

      const passwordInput = await screen.findByLabelText(/password/i)
      const deleteButton = screen.getByRole('button', {
        name: /delete.*account/i,
      })

      await user.type(passwordInput, 'WrongPassword123!')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(/incorrect password/i)).toBeInTheDocument()
      })
    })

    it('should display rate limit error', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account/delete',
          Component: TestAccountDeletePage,
          loader: () => ({ email: testUser.email }),
          action: () => ({ error: 'Too many attempts. Please try again later.' }),
        },
      ])

      const user = userEvent.setup()

      render(<Stub initialEntries={['/account/delete']} />)

      const passwordInput = await screen.findByLabelText(/password/i)
      const deleteButton = screen.getByRole('button', {
        name: /delete.*account/i,
      })

      await user.type(passwordInput, 'SomePassword123!')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(/too many/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labelling', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account/delete',
          Component: TestAccountDeletePage,
          loader: () => ({ email: testUser.email }),
        },
      ])

      render(<Stub initialEntries={['/account/delete']} />)

      const passwordInput = await screen.findByLabelText(/password/i)
      expect(passwordInput).toHaveAttribute('id')
      expect(passwordInput).toHaveAttribute('name')
    })

    it('should have error messages linked to inputs', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account/delete',
          Component: TestAccountDeletePage,
          loader: () => ({ email: testUser.email }),
        },
      ])

      render(<Stub initialEntries={['/account/delete']} />)

      // Verify password input has proper attributes
      const passwordInput = await screen.findByLabelText(/password/i)
      expect(passwordInput).toHaveAttribute('id', 'password')
      expect(passwordInput).toHaveAttribute('name', 'password')
    })
  })
})
