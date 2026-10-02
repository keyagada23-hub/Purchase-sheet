'use server';

import { prisma } from '@/lib/prisma';
import { Enquiry } from '@/types';

export async function getEnquiries(): Promise<Enquiry[]> {
  const enquiries = await prisma.enquiry.findMany();
  return enquiries as Enquiry[];
}

export async function createEnquiry(data: Omit<Enquiry, 'id'>): Promise<Enquiry> {
  const enquiry = await prisma.enquiry.create({
    data,
  });
  return enquiry as Enquiry;
}

export async function updateEnquiry(id: string, data: Partial<Enquiry>): Promise<Enquiry> {
  const enquiry = await prisma.enquiry.update({
    where: { id },
    data,
  });
  return enquiry as Enquiry;
}

export async function deleteEnquiry(id: string): Promise<void> {
  await prisma.enquiry.delete({
    where: { id },
  });
}
