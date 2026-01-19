/**
 * Product Seeding Script
 *
 * Seeds the database with sample products and variants for development.
 * Includes mugs, apparel, prints, and storybook products.
 *
 * Usage: npx tsx scripts/seed-products.ts
 */

import { PrismaClient, ProductCategory, FulfilmentProvider, StockStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Sample product data structure
 */
interface SeedProduct {
  externalId: string;
  provider: FulfilmentProvider;
  category: ProductCategory;
  name: string;
  description: string;
  basePricePence: number;
  sellingPricePence: number;
  variants: Array<{
    externalId: string;
    name: string;
    size: string | null;
    colour: string | null;
    colourHex: string | null;
    basePricePence: number;
    sellingPricePence: number;
    stockStatus: StockStatus;
  }>;
}

/**
 * Sample mug products
 */
const mugProducts: SeedProduct[] = [
  {
    externalId: 'printful-mug-001',
    provider: 'PRINTFUL',
    category: 'MUG',
    name: 'Classic Ceramic Mug',
    description:
      'A timeless 11oz ceramic mug perfect for your morning coffee or tea. Features a comfortable C-handle and glossy finish that showcases your custom design beautifully.',
    basePricePence: 650,
    sellingPricePence: 1299,
    variants: [
      { externalId: 'mug-001-white-11oz', name: 'White 11oz', size: '11oz', colour: 'White', colourHex: '#FFFFFF', basePricePence: 650, sellingPricePence: 1299, stockStatus: 'IN_STOCK' },
      { externalId: 'mug-001-black-11oz', name: 'Black 11oz', size: '11oz', colour: 'Black', colourHex: '#000000', basePricePence: 650, sellingPricePence: 1299, stockStatus: 'IN_STOCK' },
      { externalId: 'mug-001-white-15oz', name: 'White 15oz', size: '15oz', colour: 'White', colourHex: '#FFFFFF', basePricePence: 750, sellingPricePence: 1499, stockStatus: 'IN_STOCK' },
      { externalId: 'mug-001-black-15oz', name: 'Black 15oz', size: '15oz', colour: 'Black', colourHex: '#000000', basePricePence: 750, sellingPricePence: 1499, stockStatus: 'IN_STOCK' },
    ],
  },
  {
    externalId: 'printful-mug-002',
    provider: 'PRINTFUL',
    category: 'MUG',
    name: 'Two-Tone Colour Mug',
    description:
      'Add a pop of colour to your morning routine with our two-tone ceramic mug. White exterior with a coloured interior and matching handle.',
    basePricePence: 750,
    sellingPricePence: 1499,
    variants: [
      { externalId: 'mug-002-red-11oz', name: 'Red Interior 11oz', size: '11oz', colour: 'Red', colourHex: '#EF4444', basePricePence: 750, sellingPricePence: 1499, stockStatus: 'IN_STOCK' },
      { externalId: 'mug-002-blue-11oz', name: 'Blue Interior 11oz', size: '11oz', colour: 'Blue', colourHex: '#3B82F6', basePricePence: 750, sellingPricePence: 1499, stockStatus: 'IN_STOCK' },
      { externalId: 'mug-002-green-11oz', name: 'Green Interior 11oz', size: '11oz', colour: 'Green', colourHex: '#22C55E', basePricePence: 750, sellingPricePence: 1499, stockStatus: 'LOW_STOCK' },
      { externalId: 'mug-002-yellow-11oz', name: 'Yellow Interior 11oz', size: '11oz', colour: 'Yellow', colourHex: '#EAB308', basePricePence: 750, sellingPricePence: 1499, stockStatus: 'IN_STOCK' },
    ],
  },
  {
    externalId: 'printful-mug-003',
    provider: 'PRINTFUL',
    category: 'MUG',
    name: 'Magic Colour-Changing Mug',
    description:
      'Watch the magic happen! This heat-sensitive mug reveals your custom design when hot liquid is added. Perfect for surprising gifts.',
    basePricePence: 950,
    sellingPricePence: 1899,
    variants: [
      { externalId: 'mug-003-magic-11oz', name: 'Magic Mug 11oz', size: '11oz', colour: 'Black (reveals design)', colourHex: '#1F2937', basePricePence: 950, sellingPricePence: 1899, stockStatus: 'IN_STOCK' },
    ],
  },
];

/**
 * Sample apparel products
 */
const apparelProducts: SeedProduct[] = [
  {
    externalId: 'printful-tshirt-001',
    provider: 'PRINTFUL',
    category: 'APPAREL',
    name: 'Premium Cotton T-Shirt',
    description:
      'Ultra-soft 100% cotton t-shirt with a comfortable fit. Perfect for showcasing your AI-generated artwork. Available in multiple sizes and colours.',
    basePricePence: 1200,
    sellingPricePence: 2499,
    variants: [
      { externalId: 'tshirt-001-white-s', name: 'White S', size: 'S', colour: 'White', colourHex: '#FFFFFF', basePricePence: 1200, sellingPricePence: 2499, stockStatus: 'IN_STOCK' },
      { externalId: 'tshirt-001-white-m', name: 'White M', size: 'M', colour: 'White', colourHex: '#FFFFFF', basePricePence: 1200, sellingPricePence: 2499, stockStatus: 'IN_STOCK' },
      { externalId: 'tshirt-001-white-l', name: 'White L', size: 'L', colour: 'White', colourHex: '#FFFFFF', basePricePence: 1200, sellingPricePence: 2499, stockStatus: 'IN_STOCK' },
      { externalId: 'tshirt-001-white-xl', name: 'White XL', size: 'XL', colour: 'White', colourHex: '#FFFFFF', basePricePence: 1200, sellingPricePence: 2499, stockStatus: 'IN_STOCK' },
      { externalId: 'tshirt-001-black-s', name: 'Black S', size: 'S', colour: 'Black', colourHex: '#000000', basePricePence: 1200, sellingPricePence: 2499, stockStatus: 'IN_STOCK' },
      { externalId: 'tshirt-001-black-m', name: 'Black M', size: 'M', colour: 'Black', colourHex: '#000000', basePricePence: 1200, sellingPricePence: 2499, stockStatus: 'IN_STOCK' },
      { externalId: 'tshirt-001-black-l', name: 'Black L', size: 'L', colour: 'Black', colourHex: '#000000', basePricePence: 1200, sellingPricePence: 2499, stockStatus: 'IN_STOCK' },
      { externalId: 'tshirt-001-black-xl', name: 'Black XL', size: 'XL', colour: 'Black', colourHex: '#000000', basePricePence: 1200, sellingPricePence: 2499, stockStatus: 'LOW_STOCK' },
      { externalId: 'tshirt-001-navy-m', name: 'Navy M', size: 'M', colour: 'Navy', colourHex: '#1E3A5F', basePricePence: 1200, sellingPricePence: 2499, stockStatus: 'IN_STOCK' },
      { externalId: 'tshirt-001-navy-l', name: 'Navy L', size: 'L', colour: 'Navy', colourHex: '#1E3A5F', basePricePence: 1200, sellingPricePence: 2499, stockStatus: 'IN_STOCK' },
    ],
  },
  {
    externalId: 'printful-hoodie-001',
    provider: 'PRINTFUL',
    category: 'APPAREL',
    name: 'Cosy Pullover Hoodie',
    description:
      'Warm and comfortable hoodie made from premium cotton blend. Features a spacious front pouch pocket and adjustable drawstring hood.',
    basePricePence: 2500,
    sellingPricePence: 4499,
    variants: [
      { externalId: 'hoodie-001-grey-m', name: 'Grey M', size: 'M', colour: 'Grey', colourHex: '#6B7280', basePricePence: 2500, sellingPricePence: 4499, stockStatus: 'IN_STOCK' },
      { externalId: 'hoodie-001-grey-l', name: 'Grey L', size: 'L', colour: 'Grey', colourHex: '#6B7280', basePricePence: 2500, sellingPricePence: 4499, stockStatus: 'IN_STOCK' },
      { externalId: 'hoodie-001-grey-xl', name: 'Grey XL', size: 'XL', colour: 'Grey', colourHex: '#6B7280', basePricePence: 2500, sellingPricePence: 4499, stockStatus: 'IN_STOCK' },
      { externalId: 'hoodie-001-black-m', name: 'Black M', size: 'M', colour: 'Black', colourHex: '#000000', basePricePence: 2500, sellingPricePence: 4499, stockStatus: 'IN_STOCK' },
      { externalId: 'hoodie-001-black-l', name: 'Black L', size: 'L', colour: 'Black', colourHex: '#000000', basePricePence: 2500, sellingPricePence: 4499, stockStatus: 'IN_STOCK' },
      { externalId: 'hoodie-001-black-xl', name: 'Black XL', size: 'XL', colour: 'Black', colourHex: '#000000', basePricePence: 2500, sellingPricePence: 4499, stockStatus: 'OUT_OF_STOCK' },
    ],
  },
];

/**
 * Sample print products
 */
const printProducts: SeedProduct[] = [
  {
    externalId: 'printful-poster-001',
    provider: 'PRINTFUL',
    category: 'PRINT',
    name: 'Premium Art Poster',
    description:
      'Museum-quality poster printed on thick, durable matte paper. Perfect for framing and displaying your AI-generated artwork.',
    basePricePence: 800,
    sellingPricePence: 1999,
    variants: [
      { externalId: 'poster-001-a4', name: 'A4 (210 x 297mm)', size: 'A4', colour: null, colourHex: null, basePricePence: 800, sellingPricePence: 1999, stockStatus: 'IN_STOCK' },
      { externalId: 'poster-001-a3', name: 'A3 (297 x 420mm)', size: 'A3', colour: null, colourHex: null, basePricePence: 1200, sellingPricePence: 2499, stockStatus: 'IN_STOCK' },
      { externalId: 'poster-001-a2', name: 'A2 (420 x 594mm)', size: 'A2', colour: null, colourHex: null, basePricePence: 1800, sellingPricePence: 3499, stockStatus: 'IN_STOCK' },
      { externalId: 'poster-001-a1', name: 'A1 (594 x 841mm)', size: 'A1', colour: null, colourHex: null, basePricePence: 2800, sellingPricePence: 4999, stockStatus: 'LOW_STOCK' },
    ],
  },
  {
    externalId: 'printful-canvas-001',
    provider: 'PRINTFUL',
    category: 'PRINT',
    name: 'Stretched Canvas Print',
    description:
      'Gallery-wrapped canvas print on solid wood stretcher bars. Ready to hang with no frame required. Makes a stunning statement piece.',
    basePricePence: 1500,
    sellingPricePence: 3499,
    variants: [
      { externalId: 'canvas-001-8x10', name: '8x10 inches', size: '8x10"', colour: null, colourHex: null, basePricePence: 1500, sellingPricePence: 3499, stockStatus: 'IN_STOCK' },
      { externalId: 'canvas-001-12x16', name: '12x16 inches', size: '12x16"', colour: null, colourHex: null, basePricePence: 2200, sellingPricePence: 4499, stockStatus: 'IN_STOCK' },
      { externalId: 'canvas-001-16x20', name: '16x20 inches', size: '16x20"', colour: null, colourHex: null, basePricePence: 3000, sellingPricePence: 5999, stockStatus: 'IN_STOCK' },
      { externalId: 'canvas-001-24x36', name: '24x36 inches', size: '24x36"', colour: null, colourHex: null, basePricePence: 4500, sellingPricePence: 8999, stockStatus: 'IN_STOCK' },
    ],
  },
  {
    externalId: 'printful-framed-001',
    provider: 'PRINTFUL',
    category: 'PRINT',
    name: 'Framed Art Print',
    description:
      'Premium art print in a sleek contemporary frame. Includes shatterproof acrylic glass for protection and easy hanging hardware.',
    basePricePence: 2000,
    sellingPricePence: 4499,
    variants: [
      { externalId: 'framed-001-black-a4', name: 'Black Frame A4', size: 'A4', colour: 'Black', colourHex: '#000000', basePricePence: 2000, sellingPricePence: 4499, stockStatus: 'IN_STOCK' },
      { externalId: 'framed-001-white-a4', name: 'White Frame A4', size: 'A4', colour: 'White', colourHex: '#FFFFFF', basePricePence: 2000, sellingPricePence: 4499, stockStatus: 'IN_STOCK' },
      { externalId: 'framed-001-natural-a4', name: 'Natural Wood Frame A4', size: 'A4', colour: 'Natural', colourHex: '#D4A574', basePricePence: 2200, sellingPricePence: 4799, stockStatus: 'IN_STOCK' },
      { externalId: 'framed-001-black-a3', name: 'Black Frame A3', size: 'A3', colour: 'Black', colourHex: '#000000', basePricePence: 2800, sellingPricePence: 5999, stockStatus: 'IN_STOCK' },
      { externalId: 'framed-001-white-a3', name: 'White Frame A3', size: 'A3', colour: 'White', colourHex: '#FFFFFF', basePricePence: 2800, sellingPricePence: 5999, stockStatus: 'IN_STOCK' },
    ],
  },
];

/**
 * Sample storybook products
 */
const storybookProducts: SeedProduct[] = [
  {
    externalId: 'blurb-storybook-001',
    provider: 'BLURB',
    category: 'STORYBOOK',
    name: 'Personalised Storybook - Softcover',
    description:
      'Create a magical personalised storybook featuring your child as the main character. AI-generated illustrations bring your story to life. Softcover edition with 24 full-colour pages.',
    basePricePence: 1500,
    sellingPricePence: 2999,
    variants: [
      { externalId: 'storybook-001-soft-square', name: 'Square 8x8" Softcover', size: '8x8"', colour: null, colourHex: null, basePricePence: 1500, sellingPricePence: 2999, stockStatus: 'IN_STOCK' },
    ],
  },
  {
    externalId: 'blurb-storybook-002',
    provider: 'BLURB',
    category: 'STORYBOOK',
    name: 'Personalised Storybook - Hardcover',
    description:
      'The premium edition of our personalised storybooks. Durable hardcover binding with 24 pages of AI-generated illustrations featuring your child. A keepsake to treasure forever.',
    basePricePence: 2500,
    sellingPricePence: 4499,
    variants: [
      { externalId: 'storybook-002-hard-square', name: 'Square 8x8" Hardcover', size: '8x8"', colour: null, colourHex: null, basePricePence: 2500, sellingPricePence: 4499, stockStatus: 'IN_STOCK' },
      { externalId: 'storybook-002-hard-large', name: 'Large 10x10" Hardcover', size: '10x10"', colour: null, colourHex: null, basePricePence: 3500, sellingPricePence: 5999, stockStatus: 'IN_STOCK' },
    ],
  },
  {
    externalId: 'blurb-storybook-003',
    provider: 'BLURB',
    category: 'STORYBOOK',
    name: 'Personalised Storybook - Deluxe Edition',
    description:
      'Our most premium storybook experience. Layflat binding allows pages to open completely flat, featuring 32 pages of AI-generated illustrations with your child as the star.',
    basePricePence: 4000,
    sellingPricePence: 7999,
    variants: [
      { externalId: 'storybook-003-deluxe', name: 'Deluxe 12x12" Layflat', size: '12x12"', colour: null, colourHex: null, basePricePence: 4000, sellingPricePence: 7999, stockStatus: 'IN_STOCK' },
    ],
  },
];

/**
 * Main seeding function
 */
async function seedProducts() {
  console.log('Starting product seed...\n');

  const allProducts = [
    ...mugProducts,
    ...apparelProducts,
    ...printProducts,
    ...storybookProducts,
  ];

  let productsCreated = 0;
  let variantsCreated = 0;

  for (const productData of allProducts) {
    const { variants, ...productFields } = productData;

    // Check if product already exists
    const existing = await prisma.product.findUnique({
      where: { externalId: productData.externalId },
    });

    if (existing) {
      console.log(`  Skipping existing product: ${productData.name}`);
      continue;
    }

    // Create product with variants
    const product = await prisma.product.create({
      data: {
        ...productFields,
        isActive: true,
        variants: {
          create: variants,
        },
      },
      include: {
        variants: true,
      },
    });

    productsCreated++;
    variantsCreated += product.variants.length;

    console.log(`  Created: ${product.name} (${product.variants.length} variants)`);
  }

  console.log('\n========================================');
  console.log(`Seeding complete!`);
  console.log(`  Products created: ${productsCreated}`);
  console.log(`  Variants created: ${variantsCreated}`);
  console.log('========================================\n');
}

/**
 * Clear all products (for development reset)
 */
async function clearProducts() {
  console.log('Clearing existing products...');

  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});

  console.log('  All products cleared.\n');
}

/**
 * Run the seed script
 */
async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');

  try {
    if (shouldClear) {
      await clearProducts();
    }

    await seedProducts();
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
