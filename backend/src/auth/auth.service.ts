import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { HashingProvider } from '../common/providers/hashing.provider';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private hashingProvider: HashingProvider,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
    private dataSource: DataSource,
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
      user: { id: user.id, email: user.email_institucional, nome: user.nome },
    };
  }

  async forgotPassword(email: string): Promise<void> {
    const rows: any[] = await this.dataSource.query(
      'SELECT id FROM usuarios WHERE email_institucional = ? AND ativo = 1',
      [email],
    );

    if (!rows || rows.length === 0) return;

    const usuarioId = rows[0].id;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.dataSource.query(
      'UPDATE password_reset_tokens SET used = 1 WHERE usuario_id = ?',
      [usuarioId],
    );

    await this.dataSource.query(
      'INSERT INTO password_reset_tokens (usuario_id, token, expires_at) VALUES (?, ?, ?)',
      [usuarioId, token, expiresAt],
    );

    const frontendUrl = this.config.get<string>('VITE_API_URL');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await this.emailService.sendPasswordReset('alewesley1234@gmail.com', resetLink);
  }

  async resetPassword(token: string, novaSenha: string): Promise<void> {
    const rows: any[] = await this.dataSource.query(
      `SELECT usuario_id FROM password_reset_tokens
       WHERE token = ? AND used = 0 AND expires_at > NOW()`,
      [token],
    );

    if (!rows || rows.length === 0) {
      throw new BadRequestException('Token inválido ou expirado.');
    }

    const usuarioId = rows[0].usuario_id;
    const hashSenha = await bcrypt.hash(novaSenha, 10);

    await this.dataSource.query(
      'UPDATE usuarios SET senha = ? WHERE id = ?',
      [hashSenha, usuarioId],
    );

    await this.dataSource.query(
      'UPDATE password_reset_tokens SET used = 1 WHERE token = ?',
      [token],
    );
  }
}