'use server';

import { prisma } from '@/lib/prisma';
import { User } from '@/types';

export async function getUsers(): Promise<User[]> {
  const users = await prisma.user.findMany();
  return users as User[];
}

export async function createUser(data: Omit<User, 'id'>): Promise<User> {
  const user = await prisma.user.create({
    data: {
      ...data,
      password: data.password || '',
      lastLogin: data.lastLogin || '',
    },
  });
  return user as User;
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const user = await prisma.user.update({
    where: { id },
    data,
  });
  return user as User;
}

export async function deleteUser(id: string): Promise<void> {
  await prisma.$transaction([
    prisma.activityLog.deleteMany({ where: { userId: id } }),
    prisma.enquiry.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);
}
