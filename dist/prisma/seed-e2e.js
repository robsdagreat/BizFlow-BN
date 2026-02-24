"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    const timestamp = Date.now();
    const email = `seller_${timestamp}@test.com`;
    const passwordRaw = 'password123';
    const passwordHash = await bcrypt.hash(passwordRaw, 10);
    const user = await prisma.user.create({
        data: {
            email,
            password: passwordHash,
            fullName: 'E2E Test Seller',
            role: client_1.UserRole.SELLER,
            isVerified: true,
        },
    });
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
    const product = await prisma.product.create({
        data: {
            name: `E2E Product ${timestamp}`,
            description: 'Test Product',
            price: 50.00,
            businessId: business.id,
            isActive: true,
        },
    });
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
//# sourceMappingURL=seed-e2e.js.map