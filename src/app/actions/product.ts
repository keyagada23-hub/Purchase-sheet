'use server';

import { prisma } from '@/lib/prisma';
import { Product } from '@/types';

export async function getProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany();
  return products as Product[];
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<Product> {
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
  return product as Product;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<Product> {
  const product = await prisma.product.update({
    where: { id },
    data,
  });
  return product as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  await prisma.product.delete({
    where: { id },
  });
}
