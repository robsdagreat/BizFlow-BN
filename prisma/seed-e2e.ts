
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Initialize with Adapter
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const timestamp = Date.now();
    const email = `seller_${timestamp}@test.com`;
    const passwordRaw = 'password123';
    const passwordHash = await bcrypt.hash(passwordRaw, 10);

    // 1. Create Verified Seller
    const user = await prisma.user.create({
        data: {
            email,
            password: passwordHash,
            fullName: 'E2E Test Seller',
            role: UserRole.SELLER,
            isVerified: true, // Bypass email verification
        },
    });

    // 2. Create Visible Business
    const business = await prisma.business.create({
        data: {
            name: `E2E Business ${timestamp}`,
            slug: `e2e-biz-${timestamp}`,
            description: 'Generated for E2E testing',
            category: 'Test',
            city: 'Test City',
            publicUrl: `http://localhost:3000/b/e2e-biz-${timestamp}`,
            ownerId: user.id,
            isVisible: true,
            isVerified: true,
        },
    });

    // 3. Create Active Product
    const product = await prisma.product.create({
        data: {
            name: `E2E Product ${timestamp}`,
            description: 'Test Product',
            price: 50.00,
            businessId: business.id,
            isActive: true,
        },
    });

    // Output as JSON for jq parsing
    console.log(JSON.stringify({
        businessId: business.id,
        productId: product.id,
        sellerEmail: email,
        sellerPassword: passwordRaw
    }));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
