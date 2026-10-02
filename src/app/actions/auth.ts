'use server';

import { prisma } from '@/lib/prisma';
import { User } from '@/types';

export async function loginUser(username: string, password?: string): Promise<User | null> {
  // In a real app, you should hash and compare passwords.
  // For this prototype, we check plain text matching the old mock data logic.
  const user = await prisma.user.findFirst({
    where: {
      username: username,
      ...(password ? { password: password } : {}),
    }
  });
  
  if (user) {
      await prisma.activityLog.create({
          data: {
              userId: user.id,
              userName: user.name,
              action: 'LOGIN',
              entity: 'User',
              entityName: user.name,
              details: 'Logged in',
              timestamp: new Date().toISOString()
          }
      });
  }
  
  return user as User | null;
}
