import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting deduplication...");

  // Deduplicate Categories
  const categories = await prisma.masterCategory.findMany();
  const categoryGroups: Record<string, typeof categories> = {};
  
  for (const cat of categories) {
    const key = `${cat.type}-${cat.name.toLowerCase().trim()}`;
    if (!categoryGroups[key]) categoryGroups[key] = [];
    categoryGroups[key].push(cat);
  }

  for (const key in categoryGroups) {
    const group = categoryGroups[key];
    if (group.length > 1) {
      const kept = group[0];
      const duplicates = group.slice(1);
      
      console.log(`Found duplicates for category "${kept.name}" (${kept.type}). Keeping ${kept.id}`);
      
      for (const dup of duplicates) {
        console.log(`  Reassigning products and vendors from ${dup.id} to ${kept.id}`);
        // Reassign products
        await prisma.product.updateMany({
          where: { categoryId: dup.id },
          data: { categoryId: kept.id }
        });
        // Reassign vendors
        await prisma.vendor.updateMany({
          where: { categoryId: dup.id },
          data: { categoryId: kept.id }
        });
        
        console.log(`  Deleting duplicate category ${dup.id}`);
        await prisma.masterCategory.delete({ where: { id: dup.id } });
      }
    }
  }

  // Deduplicate Brands
  const brands = await prisma.brand.findMany();
  const brandGroups: Record<string, typeof brands> = {};
  
  for (const brand of brands) {
    const key = brand.name.toLowerCase().trim();
    if (!brandGroups[key]) brandGroups[key] = [];
    brandGroups[key].push(brand);
  }

  for (const key in brandGroups) {
    const group = brandGroups[key];
    if (group.length > 1) {
      const kept = group[0];
      const duplicates = group.slice(1);
      
      console.log(`Found duplicates for brand "${kept.name}". Keeping ${kept.id}`);
      
      for (const dup of duplicates) {
        console.log(`  Reassigning products from ${dup.id} to ${kept.id}`);
        // Reassign products
        await prisma.product.updateMany({
          where: { brandId: dup.id },
          data: { brandId: kept.id }
        });
        
        console.log(`  Deleting duplicate brand ${dup.id}`);
        await prisma.brand.delete({ where: { id: dup.id } });
      }
    }
  }

  console.log("Deduplication complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
