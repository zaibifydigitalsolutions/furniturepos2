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

export interface SessionData {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

const SESSION_KEY = 'furnicraft_session';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

export async function login(username: string, password: string): Promise<AuthUser | null> {
  try {
    const user = await db.users.where('username').equals(username).first();
    
    if (!user || user.status !== 'active') {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return null;
    }

    // Create session
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

    const sessionData: SessionData = {
      user: sessionUser,
      token: generateToken(),
      expiresAt: Date.now() + SESSION_DURATION
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

    // Log the session
    await db.sessions.add({
      userId: user.id!,
      loginAt: new Date(),
      ip: null
    });

    return sessionUser;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): AuthUser | null {
  try {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;

    const session: SessionData = JSON.parse(sessionStr);

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      logout();
      return null;
    }

    return session.user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
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

export function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
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
