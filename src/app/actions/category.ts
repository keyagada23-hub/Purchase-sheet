'use server';

import { prisma } from '@/lib/prisma';
import { MasterCategory, Brand } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getCategories(): Promise<MasterCategory[]> {
  const categories = await prisma.masterCategory.findMany({
    orderBy: { name: 'asc' }
  });
  return categories as MasterCategory[];
}

export async function createCategory(data: { name: string; type?: 'Product' | 'Vendor'; [key: string]: any }): Promise<MasterCategory> {
  const nameTrimmed = data.name.trim();
  const type = data.type || 'Product';

  const existing = await prisma.masterCategory.findFirst({
    where: { name: nameTrimmed, type }
  });
  if (existing) {
    return existing as MasterCategory;
  }

  const category = await prisma.masterCategory.create({
    data: {
      name: nameTrimmed,
      type: type,
    },
  });
  revalidatePath('/products/new');
  revalidatePath('/vendors/new');
  revalidatePath('/products');
  revalidatePath('/vendors');
  revalidatePath('/master-data');
  revalidatePath('/settings');
  return category as MasterCategory;
}

export async function updateCategory(id: string, name: string): Promise<MasterCategory> {
  const nameTrimmed = name.trim();
  const existing = await prisma.masterCategory.findFirst({
    where: { name: nameTrimmed, id: { not: id } }
  });
  if (existing) throw new Error("Category name already exists");

  const category = await prisma.masterCategory.update({
    where: { id },
    data: { name: nameTrimmed },
  });
  revalidatePath('/products/new');
  revalidatePath('/vendors/new');
  revalidatePath('/products');
  revalidatePath('/vendors');
  revalidatePath('/master-data');
  revalidatePath('/settings');
  return category as MasterCategory;
}

export async function deleteCategory(id: string): Promise<void> {
  await prisma.masterCategory.delete({
    where: { id },
  });
  revalidatePath('/products/new');
  revalidatePath('/vendors/new');
  revalidatePath('/products');
  revalidatePath('/vendors');
  revalidatePath('/master-data');
  revalidatePath('/settings');
}

export async function getBrands(): Promise<Brand[]> {
  const brands = await prisma.brand.findMany({
    orderBy: { name: 'asc' }
  });
  return brands as Brand[];
}

export async function createBrand(data: { name: string; [key: string]: any }): Promise<Brand> {
  const nameTrimmed = data.name.trim();
  const existing = await prisma.brand.findFirst({
    where: { name: nameTrimmed }
  });
  if (existing) {
    return existing as Brand;
  }

  const brand = await prisma.brand.create({
    data: {
      name: nameTrimmed,
    },
  });
  revalidatePath('/products/new');
  revalidatePath('/products');
  revalidatePath('/master-data');
  revalidatePath('/settings');
  return brand as Brand;
}

export async function updateBrand(id: string, name: string): Promise<Brand> {
  const nameTrimmed = name.trim();
  const existing = await prisma.brand.findFirst({
    where: { name: nameTrimmed, id: { not: id } }
  });
  if (existing) throw new Error("Brand name already exists");

  const brand = await prisma.brand.update({
    where: { id },
    data: { name: nameTrimmed },
  });
  revalidatePath('/products/new');
  revalidatePath('/products');
  revalidatePath('/master-data');
  revalidatePath('/settings');
  return brand as Brand;
}

export async function deleteBrand(id: string): Promise<void> {
  await prisma.brand.delete({
    where: { id },
  });
  revalidatePath('/products/new');
  revalidatePath('/products');
  revalidatePath('/master-data');
  revalidatePath('/settings');
}
