/**
 * Auth Service Tests
 *
 * Tests for authentication utilities including requireAuth, getUser, isAuthenticated.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirect } from 'react-router';
import { requireAuth, getUser, isAuthenticated, getUserWithCredits } from '../auth.server';
import { prisma } from '../prisma.server';

// Mock dependencies
vi.mock('../prisma.server', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../session.server', () => ({
  getSession: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('mock-user-id'),
  }),
  getUserIdFromSession: vi.fn().mockResolvedValue('mock-user-id'),
  commitSession: vi.fn().mockResolvedValue('mock-cookie'),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    redirect: vi.fn().mockImplementation((url) => {
      const error = new Error('Redirect');
      (error as unknown as { url: string }).url = url;
      throw error;
    }),
  };
});

const mockRequest = new Request('http://localhost:3000/protected');

describe('Auth Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('returns user when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const user = await requireAuth(mockRequest);

      expect(user).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'mock-user-id' },
        select: {
          id: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('throws redirect when user not found in database', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(requireAuth(mockRequest)).rejects.toThrow();
      expect(redirect).toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('returns user when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const user = await getUser(mockRequest);

      expect(user).toEqual(mockUser);
    });

    it('returns null when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const user = await getUser(mockRequest);

      expect(user).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when user exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await isAuthenticated(mockRequest);

      expect(result).toBe(true);
    });

    it('returns false when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await isAuthenticated(mockRequest);

      expect(result).toBe(false);
    });
  });

  describe('getUserWithCredits', () => {
    it('returns user with credits when authenticated', async () => {
      const mockUserWithCredits = {
        id: 'user-123',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        credits: {
          balance: 10,
          totalUsed: 5,
        },
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserWithCredits);

      const user = await getUserWithCredits(mockRequest);

      expect(user).toEqual(mockUserWithCredits);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'mock-user-id' },
        select: {
          id: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          credits: {
            select: {
              balance: true,
              totalUsed: true,
            },
          },
        },
      });
    });

    it('returns null when not authenticated', async () => {
      // Mock no user ID in session
      const { getUserIdFromSession } = await import('../session.server');
      vi.mocked(getUserIdFromSession).mockResolvedValueOnce(null);

      const user = await getUserWithCredits(mockRequest);

      expect(user).toBeNull();
    });
  });
});
