'use server';

import { prisma } from '@/lib/prisma';
import { ActivityLog } from '@/types';

export async function getActivityLogs(): Promise<ActivityLog[]> {
  const logs = await prisma.activityLog.findMany({
    orderBy: {
      timestamp: 'desc',
    },
  });
  return logs as ActivityLog[];
}

export async function createActivityLog(data: Omit<ActivityLog, 'id'>): Promise<ActivityLog> {
  const log = await prisma.activityLog.create({
    data,
  });
  return log as ActivityLog;
}
