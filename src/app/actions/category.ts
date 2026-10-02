'use server';

import { prisma } from '@/lib/prisma';
import { MasterCategory, Brand } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getCategories(): Promise<MasterCategory[]> {
  const categories = await prisma.masterCategory.findMany();
  return categories as MasterCategory[];
}

export async function createCategory(data: Omit<MasterCategory, 'id'>): Promise<MasterCategory> {
  const category = await prisma.masterCategory.create({
    data,
  });
  revalidatePath('/products/new');
  revalidatePath('/vendors/new');
  return category as MasterCategory;
}

export async function deleteCategory(id: string): Promise<void> {
  await prisma.masterCategory.delete({
    where: { id },
  });
  revalidatePath('/products/new');
  revalidatePath('/vendors/new');
}

export async function getBrands(): Promise<Brand[]> {
  const brands = await prisma.brand.findMany();
  return brands as Brand[];
}

export async function createBrand(data: Omit<Brand, 'id'>): Promise<Brand> {
  const brand = await prisma.brand.create({
    data,
  });
  revalidatePath('/products/new');
  return brand as Brand;
}

export async function deleteBrand(id: string): Promise<void> {
  await prisma.brand.delete({
    where: { id },
  });
  revalidatePath('/products/new');
}
