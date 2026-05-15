import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { HashingProvider } from '../common/providers/hashing.provider';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private hashingProvider: HashingProvider,
    private jwtService: JwtService,
    private emailService: EmailService,
    private config: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) throw new UnauthorizedException('Email não encontrado');

    const isPasswordValid = await this.hashingProvider.compare(pass, user.senha);
    if (!isPasswordValid) throw new UnauthorizedException('Senha inválida');

    const { senha, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { email: user.email_institucional, sub: user.id, role: user.role_cargo };
    return {
      access_token: this.jwtService.sign(payload),
      role: user.role_cargo,
      user: {
        id: user.id,
        email: user.email_institucional,
        nome: user.nome,
      },
    };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.email_institucional = :email', { email })
      .getOne();

    if (!user) throw new NotFoundException('Email não encontrado');

    const token = this.jwtService.sign(
      { sub: user.id, email: user.email_institucional },
      { expiresIn: '1h' },
    );

    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await this.emailService.sendPasswordReset(user.email_institucional, resetLink);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    let payload: any;

    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    user.senha = await this.hashingProvider.hash(newPassword);
    await this.usersRepository.save(user);
  }
}