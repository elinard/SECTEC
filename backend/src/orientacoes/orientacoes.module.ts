import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjetoOrientador } from './entities/projeto-orientador.entity';
import { OrientacoesService } from './orientacoes.service';
import { OrientacoesController } from './orientacoes.controller';

// Importe as outras entidades que a sua query do QueryBuilder utiliza nos Joins
import { Projeto } from '../projetos/entities/projeto.entity'; 
import { ProjetoAluno } from '../projetos/entities/projeto-aluno.entity';

@Module({
  imports: [
    // Certifique-se de incluir as entidades que o QueryBuilder vai tocar/mapear
    TypeOrmModule.forFeature([
      ProjetoOrientador, 
      Projeto, 
      ProjetoAluno
    ]),
  ],
  providers: [OrientacoesService],
  controllers: [OrientacoesController],
  exports: [OrientacoesService], // Perfeito para caso outros módulos precisem dele
})
export class OrientacoesModule {}
