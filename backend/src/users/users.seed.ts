import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersSeed {
  constructor(
    @InjectRepository(User)
    private readonly usuarioRepository: Repository<User>,
  ) { }

  async run() {
    // Verifica se está a rodar no ambiente de produção do Railway
    const isProd = process.env.NODE_ENV === 'production';

    // Lista de utilizadores iniciais obrigatórios
    const seedUsers = [
      {
        nome: 'Coordenador Principal SECTEC',
        email: process.env.ADMIN_EMAIL || 'coordenador@sectec.com', // Permite customizar via Railway
        role: UserRole.COORDENACAO,
      },
    ];

    // Só adiciona os utilizadores de teste fictícios se NÃO for produção
    if (!isProd) {
      seedUsers.push(
        {
          nome: 'Aluno Teste SECTEC',
          email: 'aluno@sectec.com',
          role: UserRole.ALUNO,
        },
        {
          nome: 'Orientador Teste SECTEC',
          email: 'orientador@sectec.com',
          role: UserRole.ORIENTADOR,
        }
      );
    }

    const defaultPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Senha123@';
    const salt = await bcrypt.genSalt(10);
    const senhaHashed = await bcrypt.hash(defaultPassword, salt);

    for (const u of seedUsers) {
      // 1. Verifica se o utilizador já existe no banco de dados
      const existe = await this.usuarioRepository.findOne({
        where: { email_institucional: u.email }
      });

      // 2. SE JÁ EXISTIR: Ignora e avança (evita o .remove() destrutivo)
      if (existe) {
        console.log(`ℹ️ Registo já existente (preservado): ${u.email}`);
        continue;
      }

      // 3. Se não existir, cria o novo registo com segurança
      console.log(`🌱 A criar utilizador inicial: ${u.email}`);
      const novoUsuario = this.usuarioRepository.create({
        nome: u.nome,
        email_institucional: u.email,
        senha: senhaHashed,
        role_cargo: u.role,
        ativo: true,
      });

      await this.usuarioRepository.save(novoUsuario);
    }

    console.log('---------------------------------------');
    console.log('✅ Sincronização de utilizadores concluída!');
    if (!isProd) {
      console.log(`🔑 Senha padrão ativa: ${defaultPassword}`);
    }
    console.log('---------------------------------------');
  }
}