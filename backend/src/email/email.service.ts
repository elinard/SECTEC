import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private config: ConfigService) {
    this.resend = new Resend(
      this.config.get<string>('RESEND_API_KEY'),
    );
  }

  async sendPasswordReset(
    email: string,
    resetLink: string,
  ): Promise<void> {
    await this.resend.emails.send({
      from: 'onboarding@resend.dev',  // ← usa esse para testes sem domínio verificado
      to: email,
      subject: 'SECTEC – Redefinição de senha',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#1e3a5f;">Redefinição de senha</h2>

          <p>
            Clique no botão abaixo para redefinir sua senha.
            O link expira em <strong>1 hora</strong>.
          </p>

          <a href="${resetLink}" style="
            display:inline-block;
            margin:16px 0;
            padding:12px 28px;
            background:#1e3a5f;
            color:#fff;
            border-radius:6px;
            text-decoration:none;
            font-weight:bold;
          ">
            Redefinir minha senha
          </a>

          <p style="color:#888;font-size:12px;">
            Se você não solicitou isso, ignore este email.
          </p>
        </div>
      `,
    });
  }
}