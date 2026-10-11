'use server';

import { prisma } from '@/lib/prisma';
import { Enquiry } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getEnquiries(): Promise<Enquiry[]> {
  const enquiries = await prisma.enquiry.findMany();
  return enquiries as Enquiry[];
}

export async function createEnquiry(data: Omit<Enquiry, 'id'>): Promise<Enquiry> {
  const enquiry = await prisma.enquiry.create({
    data: {
      ...data,
      enquiryPrice: Number(data.enquiryPrice.toFixed(2)),
      purchasePrice: data.purchasePrice !== undefined && data.purchasePrice !== null ? Number(data.purchasePrice.toFixed(2)) : null,
    },
  });
  revalidatePath('/enquiries');
  revalidatePath('/enquiries/new');
  return enquiry as Enquiry;
}

export async function updateEnquiry(id: string, data: Partial<Enquiry>): Promise<Enquiry> {
  const cleanData: any = { ...data };
  if (cleanData.enquiryPrice !== undefined && cleanData.enquiryPrice !== null) {
    cleanData.enquiryPrice = Number(cleanData.enquiryPrice.toFixed(2));
  }
  if (cleanData.purchasePrice !== undefined && cleanData.purchasePrice !== null) {
    cleanData.purchasePrice = Number(cleanData.purchasePrice.toFixed(2));
  }
  const enquiry = await prisma.enquiry.update({
    where: { id },
    data: cleanData,
  });
  revalidatePath('/enquiries');
  return enquiry as Enquiry;
}

export async function deleteEnquiry(id: string): Promise<void> {
  await prisma.enquiry.delete({
    where: { id },
  });
  revalidatePath('/enquiries');
}
