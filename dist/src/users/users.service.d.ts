import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, Prisma } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.UserCreateInput): Promise<User>;
    findAll(): Promise<{
        id: string;
        fullName: string;
        email: string;
        password: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        isVerified: boolean;
        emailVerificationTokenHash: string | null;
        emailVerificationExpiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        fullName: string;
        email: string;
        password: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        isVerified: boolean;
        emailVerificationTokenHash: string | null;
        emailVerificationExpiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        id: string;
        fullName: string;
        email: string;
        password: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        isVerified: boolean;
        emailVerificationTokenHash: string | null;
        emailVerificationExpiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        fullName: string;
        email: string;
        password: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        isVerified: boolean;
        emailVerificationTokenHash: string | null;
        emailVerificationExpiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
