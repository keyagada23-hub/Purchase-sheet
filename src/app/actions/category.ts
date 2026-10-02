'use server';

import { prisma } from '@/lib/prisma';
import { MasterCategory, Brand } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getCategories(): Promise<MasterCategory[]> {
  const categories = await prisma.masterCategory.findMany();
  return categories as MasterCategory[];
}

export async function createCategory(data: Omit<MasterCategory, 'id'>): Promise<MasterCategory> {
  const nameTrimmed = data.name.trim();
  const existing = await prisma.masterCategory.findFirst({
    where: { name: nameTrimmed, type: data.type }
  });
  if (existing) throw new Error("Category already exists");

  const category = await prisma.masterCategory.create({
    data: { ...data, name: nameTrimmed },
  });
  revalidatePath('/products/new');
  revalidatePath('/vendors/new');
  revalidatePath('/products');
  revalidatePath('/vendors');
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
}

export async function getBrands(): Promise<Brand[]> {
  const brands = await prisma.brand.findMany();
  return brands as Brand[];
}

export async function createBrand(data: Omit<Brand, 'id'>): Promise<Brand> {
  const nameTrimmed = data.name.trim();
  const existing = await prisma.brand.findFirst({
    where: { name: nameTrimmed }
  });
  if (existing) throw new Error("Brand already exists");

  const brand = await prisma.brand.create({
    data: { ...data, name: nameTrimmed },
  });
  revalidatePath('/products/new');
  revalidatePath('/products');
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
  return brand as Brand;
}

export async function deleteBrand(id: string): Promise<void> {
  await prisma.brand.delete({
    where: { id },
  });
  revalidatePath('/products/new');
  revalidatePath('/products');
}
