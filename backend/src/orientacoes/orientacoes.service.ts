import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProjetoOrientador,
  StatusOrientacao,
} from './entities/projeto-orientador.entity';
import { ResponderOrientacaoDto } from './dto/responder-orientacao.dto';

@Injectable()
export class OrientacoesService {
  constructor(
    @InjectRepository(ProjetoOrientador)
    private orientacoesRepository: Repository<ProjetoOrientador>,
  ) {}

    async findMinhasPendentes(orientadorId: number): Promise<ProjetoOrientador[]> {
  const anoAtual = new Date().getFullYear();

  // 🚀 NOVA VALIDAÇÃO: Conta quantos projetos o orientador já aceitou no evento deste ano
  const totalAceitosEsteAno = await this.orientacoesRepository.createQueryBuilder('po')
    .innerJoin('po.projeto', 'projeto')
    .innerJoin('projeto.evento', 'evento')
    .where('po.orientador_id = :orientadorId', { orientadorId })
    .andWhere('po.status = :statusAceito', { statusAceito: StatusOrientacao.ACEITO })
    .andWhere('evento.status = :eventoStatus', { eventoStatus: 'ativo' })
    .andWhere('evento.prazoInicial BETWEEN :inicioAno AND :fimAno', {
      inicioAno: `${anoAtual}-01-01`,
      fimAno: `${anoAtual}-12-31`,
    })
    .getCount(); // Retorna apenas o número total (rápido e performático)

  // Se já atingiu a meta de 4 ou mais orientações aceitas, esconde as pendências ocultando a lista
  if (totalAceitosEsteAno >= 4) {
    return [];
  }

  // Se tiver menos de 4 aceitos, continua a execução normal da sua query existente
  return this.orientacoesRepository.createQueryBuilder('projetoOrientador')
    .leftJoinAndSelect('projetoOrientador.orientador', 'orientador')
    .leftJoinAndSelect('projetoOrientador.projeto', 'projeto')
    .leftJoinAndSelect('projeto.evento', 'evento')
    .leftJoinAndSelect('projeto.tema', 'tema')
    .leftJoinAndSelect('projeto.alunoAutor', 'alunoAutor')
    .leftJoinAndSelect('projeto.projetoAlunos', 'projetoAlunos')
    .leftJoinAndSelect('projetoAlunos.aluno', 'aluno')

    // 1. Filtros básicos: id do orientador e status pendente
    .where('orientador.id = :orientadorId', { orientadorId })
    .andWhere('projetoOrientador.status = :statusPendente', { statusPendente: StatusOrientacao.PENDENTE })

    // 2. FILTRO DO ANO ATUAL: Filtra pelo status ATIVO do evento e garante que ele está no range do ano corrente
    .andWhere('evento.status = :eventoStatus', { eventoStatus: 'ativo' })
    .andWhere('evento.prazoInicial BETWEEN :inicioAno AND :fimAno', {
      inicioAno: `${anoAtual}-01-01`,
      fimAno: `${anoAtual}-12-31`,
    })

    // 3. Validação de concorrência (Se outra pessoa já aceitou, limpa da lista)
    .andWhere((qb) => {
      const subQuery = qb
        .subQuery()
        .select('1')
        .from(ProjetoOrientador, 'subPo')
        .where('subPo.projeto_id = projeto.id') 
        .andWhere('subPo.status = :statusAceito', { statusAceito: StatusOrientacao.ACEITO })
        .getQuery();
      
      return `NOT EXISTS ${subQuery}`;
    })
    .getMany();
}




  async findMinhasOrientacoes(orientadorId: number): Promise<ProjetoOrientador[]> {
    return this.orientacoesRepository.find({
      where: { orientador: { id: orientadorId } },
      relations: [
        'projeto',
        'projeto.evento',
        'projeto.tema',
        'projeto.alunoAutor',
        'projeto.projetoAlunos',
        'projeto.projetoAlunos.aluno',
        'orientador',
      ],
      order: { criadoEm: 'DESC' },
    });
  }

    async responder(
    id: number,
    orientadorId: number,
    dto: ResponderOrientacaoDto,
  ): Promise<ProjetoOrientador> {
    const orientacao = await this.orientacoesRepository.findOne({
      where: { id },
      relations: [
        'projeto',
        'projeto.evento',
        'projeto.tema',
        'projeto.alunoAutor',
        'projeto.projetoAlunos',
        'projeto.projetoAlunos.aluno',
        'orientador',
      ],
    });

    if (!orientacao) {
      throw new NotFoundException('Orientação não encontrada');
    }

    if (orientacao.orientador.id !== orientadorId) {
      throw new ForbiddenException('Você não pode responder esta orientação');
    }

    if (orientacao.status !== StatusOrientacao.PENDENTE) {
      throw new BadRequestException('Esta orientação já foi respondida');
    }

    // 👇 NOVA VALIDAÇÃO CRÍTICA: Se o professor atual quer ACEITAR, 
    // precisamos garantir que nenhum outro professor aceitou antes dele.
    if (dto.action === StatusOrientacao.ACEITO) {
      const jaPossuiOrientador = await this.orientacoesRepository.exists({
        where: {
          projeto: { id: orientacao.projeto.id },
          status: StatusOrientacao.ACEITO,
        },
      });

      if (jaPossuiOrientador) {
        throw new BadRequestException(
          'Este projeto já foi aceito por outro orientador.',
        );
      }

      // Se passou na checagem, recusa todas as outras solicitações pendentes deste projeto
      await this.orientacoesRepository
        .createQueryBuilder()
        .update(ProjetoOrientador)
        .set({ status: StatusOrientacao.RECUSADO, respondidoEm: new Date() })
        .where('projeto_id = :projetoId', { projetoId: orientacao.projeto.id })
        .andWhere('status = :status', { status: StatusOrientacao.PENDENTE })
        .andWhere('id != :id', { id: orientacao.id })
        .execute();
    }

    // Atualiza o status da solicitação atual
    orientacao.status = dto.action;
    orientacao.respondidoEm = new Date();

    return this.orientacoesRepository.save(orientacao);
  }

}
