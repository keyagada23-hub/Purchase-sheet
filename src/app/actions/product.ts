'use server';

import { prisma } from '@/lib/prisma';
import { Product } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany();
  return products as Product[];
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<Product> {
  const existing = await prisma.product.findFirst({
    where: { name: data.name }
  });
  if (existing) {
    throw new Error('A product with this exact Name, Brand, and Model already exists.');
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      model: data.model,
      brandId: data.brandId,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
      photoUrl: data.photoUrl,
      status: data.status,
    },
  });
  revalidatePath('/products');
  revalidatePath('/products/new');
  return product as Product;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<Product> {
  if (data.name) {
    const existing = await prisma.product.findFirst({
      where: { name: data.name, id: { not: id } }
    });
    if (existing) {
      throw new Error('A product with this exact Name, Brand, and Model already exists.');
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data,
  });
  revalidatePath('/products');
  return product as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  await prisma.product.delete({
    where: { id },
  });
  revalidatePath('/products');
}

export async function deleteModel(categoryId: string, brandId: string, modelName: string): Promise<void> {
  await prisma.product.updateMany({
    where: { 
      categoryId, 
      brandId, 
      model: modelName 
    },
    data: { model: null }
  });
  revalidatePath('/products');
  revalidatePath('/products/new');
}

export async function updateModelName(categoryId: string, brandId: string, oldModelName: string, newModelName: string): Promise<void> {
  await prisma.product.updateMany({
    where: { 
      categoryId, 
      brandId, 
      model: oldModelName 
    },
    data: { model: newModelName }
  });
  // Since model name changed, their generated name (Category Brand Model) is now stale.
  // We need to fetch all affected products and update their names individually, or just let users re-save them.
  // A better approach is to fetch and update them so the full name is correct.
  const affectedProducts = await prisma.product.findMany({
    where: { categoryId, brandId, model: newModelName },
    include: { category: true, brand: true }
  });
  for (const p of affectedProducts) {
    const generatedName = `${p.category?.name || 'Product'} ${p.brand?.name || ''} ${p.model}`.trim();
    await prisma.product.update({
      where: { id: p.id },
      data: { name: generatedName }
    });
  }
  revalidatePath('/products');
  revalidatePath('/products/new');
}
