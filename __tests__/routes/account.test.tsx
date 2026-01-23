/**
 * Account Settings Page Tests
 *
 * Tests for the account settings page showing user info and danger zone.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRoutesStub } from 'react-router'

// Mock Prisma - using inline functions to avoid hoisting issues
vi.mock('~/services/prisma.server', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    order: {
      count: vi.fn(),
    },
  },
}))

// Mock session service
vi.mock('~/services/session.server', () => ({
  getSession: vi.fn().mockResolvedValue({ get: vi.fn() }),
  commitSession: vi.fn().mockResolvedValue('session-cookie'),
  getUserIdFromSession: vi.fn(),
}))

// Import after mocks
import AccountPage, { loader } from '~/routes/account'
import { prisma } from '~/services/prisma.server'
import { getUserIdFromSession } from '~/services/session.server'

// Type-safe component wrapper for testing
const TestAccountPage = AccountPage as React.ComponentType<any>

describe('Account Settings Page', () => {
  const testUser = {
    id: 'test-user-id-123',
    email: 'test@example.com',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUserIdFromSession).mockResolvedValue(testUser.id)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(testUser as any)
    vi.mocked(prisma.order.count).mockResolvedValue(5)
  })

  describe('Loader', () => {
    it('should redirect unauthenticated users to login', async () => {
      vi.mocked(getUserIdFromSession).mockResolvedValue(null)

      const request = new Request('http://localhost/account')

      try {
        await loader({ request, params: {}, context: {} } as any)
        expect.fail('Should have redirected')
      } catch (response: any) {
        expect(response.status).toBe(302)
        expect(response.headers.get('Location')).toContain('/login')
      }
    })

    it('should return user data for authenticated users', async () => {
      const request = new Request('http://localhost/account')

      const response = await loader({ request, params: {}, context: {} } as any)

      expect(response).toHaveProperty('user')
      expect(response.user.email).toBe(testUser.email)
    })

    it('should return order count', async () => {
      const request = new Request('http://localhost/account')

      const response = await loader({ request, params: {}, context: {} } as any)

      expect(response).toHaveProperty('orderCount')
      expect(response.orderCount).toBe(5)
    })

    it('should format member since date', async () => {
      const request = new Request('http://localhost/account')

      const response = await loader({ request, params: {}, context: {} } as any)

      expect(response).toHaveProperty('memberSince')
      expect(typeof response.memberSince).toBe('string')
    })
  })

  describe('Component Rendering', () => {
    it('should display user email', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account',
          Component: TestAccountPage,
          loader: () => ({
            user: testUser,
            orderCount: 5,
            memberSince: 'January 2024',
          }),
        },
      ])

      render(<Stub initialEntries={['/account']} />)

      expect(await screen.findByText(testUser.email)).toBeInTheDocument()
    })

    it('should display member since date', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account',
          Component: TestAccountPage,
          loader: () => ({
            user: testUser,
            orderCount: 5,
            memberSince: 'January 2024',
          }),
        },
      ])

      render(<Stub initialEntries={['/account']} />)

      expect(await screen.findByText(/January 2024/)).toBeInTheDocument()
    })

    it('should display order count with link to order history', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account',
          Component: TestAccountPage,
          loader: () => ({
            user: testUser,
            orderCount: 5,
            memberSince: 'January 2024',
          }),
        },
      ])

      render(<Stub initialEntries={['/account']} />)

      expect(await screen.findByText(/5.*orders?/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /order/i })).toHaveAttribute(
        'href',
        expect.stringContaining('/orders')
      )
    })

    it('should display Account Settings heading', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account',
          Component: TestAccountPage,
          loader: () => ({
            user: testUser,
            orderCount: 5,
            memberSince: 'January 2024',
          }),
        },
      ])

      render(<Stub initialEntries={['/account']} />)

      expect(
        await screen.findByRole('heading', { name: /account settings/i })
      ).toBeInTheDocument()
    })

    it('should display Danger Zone section', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account',
          Component: TestAccountPage,
          loader: () => ({
            user: testUser,
            orderCount: 5,
            memberSince: 'January 2024',
          }),
        },
      ])

      render(<Stub initialEntries={['/account']} />)

      expect(
        await screen.findByRole('heading', { name: /danger zone/i })
      ).toBeInTheDocument()
    })

    it('should display delete account button in danger zone', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account',
          Component: TestAccountPage,
          loader: () => ({
            user: testUser,
            orderCount: 5,
            memberSince: 'January 2024',
          }),
        },
      ])

      render(<Stub initialEntries={['/account']} />)

      const deleteButton = await screen.findByRole('link', {
        name: /delete.*account/i,
      })
      expect(deleteButton).toBeInTheDocument()
      expect(deleteButton).toHaveAttribute('href', '/account/delete')
    })

    it('should display warning about deletion being permanent', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account',
          Component: TestAccountPage,
          loader: () => ({
            user: testUser,
            orderCount: 5,
            memberSince: 'January 2024',
          }),
        },
      ])

      render(<Stub initialEntries={['/account']} />)

      // Should mention permanent or cannot be undone
      const textContent = await screen.findByText(/cannot be undone/i)
      expect(textContent).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account',
          Component: TestAccountPage,
          loader: () => ({
            user: testUser,
            orderCount: 5,
            memberSince: 'January 2024',
          }),
        },
      ])

      render(<Stub initialEntries={['/account']} />)

      // Wait for page to load
      await screen.findByRole('heading', { name: /account settings/i })

      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThanOrEqual(2)
    })

    it('should have descriptive link text', async () => {
      const Stub = createRoutesStub([
        {
          path: '/account',
          Component: TestAccountPage,
          loader: () => ({
            user: testUser,
            orderCount: 5,
            memberSince: 'January 2024',
          }),
        },
      ])

      render(<Stub initialEntries={['/account']} />)

      // Links should have descriptive text
      const links = await screen.findAllByRole('link')
      links.forEach((link) => {
        expect(link.textContent?.trim()).not.toBe('')
      })
    })
  })
})
