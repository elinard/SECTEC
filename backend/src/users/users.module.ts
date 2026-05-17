import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UsersSeed } from './users.seed';
import { UsersController } from './users.controller';
import { Evento } from 'src/evento/entities/evento.entity'; // 👈 Importante verificar se o caminho está correto
import { ComissaoEvento } from 'src/evento/entities/comissao-evento.entity'; // 👈 Importante verificar se o caminho está correto

@Module({
  imports: [
    // 👇 Adicionado Evento e ComissaoEvento para o Nest gerar os repositórios neste módulo
    TypeOrmModule.forFeature([User, Evento, ComissaoEvento]),
  ],
  providers: [UsersService, UsersSeed],
  exports: [UsersService, TypeOrmModule],
  controllers: [UsersController],
})
export class UsersModule {}
