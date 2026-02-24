import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private mailService;
    private prisma;
    constructor(usersService: UsersService, jwtService: JwtService, mailService: MailService, prisma: PrismaService);
    register(dto: RegisterDto): Promise<{
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            isVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    private generateToken;
}
