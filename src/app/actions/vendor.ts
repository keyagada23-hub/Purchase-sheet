'use server';

import { prisma } from '@/lib/prisma';
import { Vendor } from '@/types';

export async function getVendors(): Promise<Vendor[]> {
  const vendors = await prisma.vendor.findMany();
  return vendors as Vendor[];
}

export async function createVendor(data: Omit<Vendor, 'id'>): Promise<Vendor> {
  const vendor = await prisma.vendor.create({
    data,
  });
  return vendor as Vendor;
}

export async function updateVendor(id: string, data: Partial<Vendor>): Promise<Vendor> {
  const vendor = await prisma.vendor.update({
    where: { id },
    data,
  });
  return vendor as Vendor;
}

export async function deleteVendor(id: string): Promise<void> {
  await prisma.vendor.delete({
    where: { id },
  });
}
