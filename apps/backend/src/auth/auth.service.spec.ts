import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: jest.Mocked<Partial<UserService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: '$2a$10$hashedpassword',
    status: 'ACTIVE' as const,
    name: 'Test User',
    orgId: 'org-1',
    phone: null,
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUserService: Partial<UserService> = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    };

    const mockJwtService: Partial<JwtService> = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('should register a new user and return access token', async () => {
      const dto = { email: 'new@example.com', password: 'password123', name: 'New User' };
      (userService.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.register(dto);

      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          name: dto.name,
          passwordHash: expect.any(String),
        }),
      );
      expect(result).toEqual({ accessToken: 'mock-jwt-token' });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: mockUser.id, email: mockUser.email });
    });

    it('should hash password before creating user', async () => {
      const dto = { email: 'new@example.com', password: 'password123' };
      (userService.create as jest.Mock).mockResolvedValue(mockUser);

      await authService.register(dto);

      const createCall = (userService.create as jest.Mock).mock.calls[0][0];
      const isValidHash = await bcrypt.compare(dto.password, createCall.passwordHash);
      expect(isValidHash).toBe(true);
    });
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      (userService.findByEmail as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: hashedPassword,
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'correctpassword',
      });

      expect(result).toEqual({ accessToken: 'mock-jwt-token' });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (userService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login({ email: 'nonexistent@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is locked', async () => {
      (userService.findByEmail as jest.Mock).mockResolvedValue({ ...mockUser, status: 'LOCKED' });

      await expect(
        authService.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow('账号已被锁定，请联系管理员');
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      (userService.findByEmail as jest.Mock).mockResolvedValue({ ...mockUser, status: 'INACTIVE' });

      await expect(
        authService.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow('账号未激活');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      (userService.findByEmail as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: hashedPassword,
      });

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow('密码错误');
    });
  });
});
