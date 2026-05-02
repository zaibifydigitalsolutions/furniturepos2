import bcrypt from 'bcryptjs';
import { db } from './db';
import type { User } from './db';

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  role: 'super_admin' | 'admin' | 'cashier' | 'staff';
  email: string;
  phone: string;
  permissions: string[];
  avatar?: string;
}

// Hardcoded users for direct login (not stored in database)
const HARDCODED_USERS: Record<string, { password: string; user: AuthUser }> = {
  'Saadullah': {
    password: 'saad1234',
    user: {
      id: 9991,
      name: 'Saadullah',
      username: 'Saadullah',
      role: 'super_admin',
      email: 'saadullah@furniture.com',
      phone: '',
      permissions: ['all']
    }
  },
  'Samiullah': {
    password: 'sami0987',
    user: {
      id: 9992,
      name: 'Samiullah',
      username: 'Samiullah',
      role: 'super_admin',
      email: 'samiullah@furniture.com',
      phone: '',
      permissions: ['all']
    }
  },
  'Abdullah': {
    password: 'abd4567',
    user: {
      id: 9993,
      name: 'Abdullah',
      username: 'Abdullah',
      role: 'super_admin',
      email: 'abdullah@furniture.com',
      phone: '',
      permissions: ['all']
    }
  }
};

export async function login(username: string, password: string): Promise<AuthUser | null> {
  try {
    // Check hardcoded users first
    const hardcodedUser = HARDCODED_USERS[username];
    if (hardcodedUser && hardcodedUser.password === password) {
      // Log the session to database
      await db.sessions.add({
        userId: hardcodedUser.user.id,
        loginAt: new Date(),
        ip: ''
      });
      return hardcodedUser.user;
    }

    const user = await db.users.where('username').equals(username).first();

    if (!user || user.status !== 'active') {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return null;
    }

    // Create user object (session not persisted - login required every time)
    const sessionUser: AuthUser = {
      id: user.id!,
      name: user.name,
      username: user.username,
      role: user.role,
      email: user.email,
      phone: user.phone,
      permissions: user.permissions,
      avatar: user.avatar
    };

    // Log the session to database only
    await db.sessions.add({
      userId: user.id!,
      loginAt: new Date(),
      ip: ''
    });

    return sessionUser;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

export function logout(): void {
  // Session is not persisted to localStorage, no cleanup needed
}

export function getCurrentUser(): AuthUser | null {
  // Session is not persisted - user must login every time
  return null;
}

export function isAuthenticated(): boolean {
  // Session is not persisted - user must login every time
  return false;
}

export function hasPermission(permission: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  if (user.role === 'super_admin') return true;
  if (user.permissions.includes('all')) return true;
  
  return user.permissions.includes(permission);
}

export function hasAnyPermission(permissions: string[]): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  if (user.role === 'super_admin') return true;
  if (user.permissions.includes('all')) return true;
  
  return permissions.some(p => user.permissions.includes(p));
}

export async function changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
  try {
    const user = await db.users.where('id').equals(userId).first();
    
    if (!user) {
      return false;
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return false;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.users.update(userId, { password: hashedPassword });

    return true;
  } catch (error) {
    console.error('Change password error:', error);
    return false;
  }
}
