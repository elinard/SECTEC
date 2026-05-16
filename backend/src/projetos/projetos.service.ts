import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// 1. Adicionado o "Between" na importação do 'typeorm'
import { DataSource, In, QueryRunner, Repository, Between } from 'typeorm';

import { AuditoriaService } from 'src/auditoria/auditoria.service';
// 2. Importado o Evento e o EventoStatus (ajuste o caminho se o enum estiver em outro arquivo)
import { Evento, EventoStatus } from 'src/evento/entities/evento.entity';
import { TemaEvento } from 'src/evento/entities/tema-evento.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { ProjetoAluno } from './entities/projeto-aluno.entity';
import { ProjetoOrientador } from './entities/projeto-orientador.entity';
import { Projeto } from './entities/projeto.entity';


@Injectable()
export class ProjetosService {
  constructor(
    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,

    @InjectRepository(ProjetoAluno)
    private readonly projetoAlunoRepository: Repository<ProjetoAluno>,

    @InjectRepository(ProjetoOrientador)
    private readonly projetoOrientadorRepository: Repository<ProjetoOrientador>,

    @InjectRepository(TemaEvento)
    private readonly temaEventoRepository: Repository<TemaEvento>,

    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dataSource: DataSource,
    private readonly auditoriaService: AuditoriaService,
  ) { }

  async create(dto: CreateProjetoDto, userId: number): Promise<Projeto> {
    const ultimoEvento = await this.buscarUltimoEvento();
    await this.validarEventoETema(ultimoEvento.id, dto.temaId);
    this.validateGroupSize(dto.alunosIds);
    await this.ensureAlunosAreAvailable(ultimoEvento.id, [
      ...(dto.alunosIds || []),
      userId,
    ]);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const projeto = await this.saveProjeto(
        queryRunner,
        dto,
        userId,
        ultimoEvento.id,
      );
      await this.saveParticipantes(queryRunner, projeto.id, dto.alunosIds, userId);
      await queryRunner.commitTransaction();

      await this.auditoriaService.registrar(
        userId,
        'PROJETO_CRIADO',
        `Projeto "${projeto.titulo}" criado pelo aluno #${userId}.`,
        projeto.id,
      );

      return this.findOne(projeto.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }



  async findProjetoAtualPorAluno(userId: number): Promise<Projeto | null> {
    try {
      const eventoAtual = await this.buscarUltimoEvento();

      const projeto = await this.projetoRepository.findOne({
        where: [
          {
            evento: { id: eventoAtual.id },
            alunoAutor: { id: userId }
          },
          {
            evento: { id: eventoAtual.id },
            projetoAlunos: { aluno: { id: userId } }
          }
        ],
        relations: this.getProjetoRelations(),
        select: this.getProjetoSelectFields(),
      });

      if (!projeto) return null;

      // Filtra os orientadores para trazer apenas quem aceitou. 
      // Se ninguém aceitou, deixa o array vazio []
      if (projeto.orientadores) {
        projeto.orientadores = projeto.orientadores.filter(
          (relacao) => relacao.status === 'aceito'
        );
      } else {
        projeto.orientadores = [];
      }

      return projeto;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      throw error;
    }
  }






  async enviarMultiplasSolicitacoes(userId: number, orientadoresIds: number[]) {
    const resultados: {
      orientadorId: number;
      status: string;
      motivo?: string;
      solicitacaoId?: number;
    }[] = [];

    const projeto = await this.getUltimoProjetoDoAluno(userId);

    for (const orientadorId of orientadoresIds) {
      try {
        const professorValido = await this.verificarSeEProfessor(orientadorId);

        if (!professorValido) {
          resultados.push({
            orientadorId,
            status: 'pulado',
            motivo: 'Usuario nao e um orientador valido.',
          });
          continue;
        }

        const solicitacao = await this.enviarSolicitacaoIndividual(
          projeto,
          userId,
          orientadorId,
        );
        resultados.push({
          orientadorId,
          status: 'sucesso',
          solicitacaoId: solicitacao.id,
        });
      } catch (error) {
        resultados.push({
          orientadorId,
          status: 'erro',
          motivo:
            error instanceof Error
              ? error.message
              : 'Erro interno ao processar este ID.',
        });
      }
    }

    return { projetoId: projeto.id, resumo: resultados };
  }

  private async enviarSolicitacaoIndividual(
    projeto: Projeto,
    userId: number,
    orientadorId: number,
  ): Promise<ProjetoOrientador> {
    await this.validarTemaNoEvento(projeto.temaId, projeto.evento.id);
    await this.validarOrientadorSelecionouTema(projeto.temaId, orientadorId);
    await this.validarSolicitacaoDuplicada(projeto.id, orientadorId);

    const novaSolicitacao = this.projetoOrientadorRepository.create({
      projeto: { id: projeto.id },
      orientador: { id: orientadorId },
      status: 'pendente',
    });

    const solicitacao =
      await this.projetoOrientadorRepository.save(novaSolicitacao);

    await this.auditoriaService.registrar(
      userId,
      'ORIENTADOR_SOLICITADO',
      `Solicitacao enviada ao orientador #${orientadorId} para o projeto #${projeto.id}.`,
      projeto.id,
    );

    return solicitacao;
  }

  private async verificarSeEProfessor(id: number): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id, role_cargo: UserRole.ORIENTADOR },
    });
    return !!user;
  }

  private async validarOrientadorSelecionouTema(
    temaId: number,
    orientadorId: number,
  ) {
    const orientadorEscolheuTema = await this.temaEventoRepository
      .createQueryBuilder('tema')
      .innerJoin('tema.orientadores', 'orientador', 'orientador.id = :orientadorId', {
        orientadorId,
      })
      .where('tema.id = :temaId', { temaId })
      .getExists();

    if (!orientadorEscolheuTema) {
      throw new BadRequestException(
        'Este orientador nao selecionou o eixo tematico do projeto.',
      );
    }
  }

  async findOne(id: number): Promise<Projeto> {
    const projeto = await this.projetoRepository.findOne({
      where: { id },
      relations: this.getProjetoRelations(),
      select: this.getProjetoSelectFields(),
    });

    if (!projeto) {
      throw new NotFoundException(`Projeto #${id} nao encontrado`);
    }

    // Filtra os orientadores para trazer apenas quem aceitou. 
    // Se ninguém aceitou, deixa o array vazio []
    if (projeto.orientadores) {
      projeto.orientadores = projeto.orientadores.filter(
        (relacao) => relacao.status === 'aceito'
      );
    } else {
      projeto.orientadores = [];
    }

    return projeto;
  }

  async findAllAlunos(userId: number): Promise<Projeto[]> {
    return this.projetoRepository.find({
      where: { alunoAutor: { id: userId } },
      relations: this.getProjetoRelations(),
      select: this.getProjetoSelectFields(),
    });
  }

  async findAllOrientador(userId: number): Promise<Projeto[]> {
    const projetosOrientados = await this.projetoOrientadorRepository.find({
      where: { orientador: { id: userId }, status: 'aceito' },
      relations: {
        projeto: this.getProjetoRelations(),
      },
    });

    return projetosOrientados.map((solicitacao) => solicitacao.projeto);
  }

  async findAllCoordenador(): Promise<Evento[]> {
    return this.dataSource.getRepository(Evento).find({
      relations: {
        projetos: this.getProjetoRelations(),
      },
      order: { id: 'DESC' },
    });
  }

  async update(
    id: number,
    dto: UpdateProjetoDto,
    userId: number,
    role: string,
  ): Promise<Projeto> {
    const projeto = await this.findOne(id);

    if (role !== 'coordenador' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Sem permissao para editar este projeto.');
    }

    if (dto.alunosIds && role !== 'coordenador') {
      throw new ForbiddenException('Apenas coordenadores alteram integrantes.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let eventoId = dto.evento || projeto.evento?.id;

      if (!eventoId) {
        const ultimo = await this.buscarUltimoEvento();
        eventoId = ultimo.id;
      }

      if (dto.temaId) {
        await this.validarEventoETema(eventoId, dto.temaId);
      }

      const dadosAtualizados: Partial<Projeto> = {
        titulo: dto.titulo ?? projeto.titulo,
        descricao: dto.descricao ?? projeto.descricao,
        evento: { id: eventoId } as Evento,
        alunoAutor: { id: projeto.alunoAutor.id } as User,
      };

      if (dto.temaId) {
        dadosAtualizados.temaId = dto.temaId;
      }

      this.projetoRepository.merge(projeto, dadosAtualizados);
      await queryRunner.manager.save(projeto);

      if (dto.alunosIds && role === 'coordenador') {
        await queryRunner.manager.delete(ProjetoAluno, {
          projeto: { id: projeto.id },
        });
        await this.saveParticipantes(
          queryRunner,
          projeto.id,
          dto.alunosIds,
          projeto.alunoAutor.id,
        );
      }

      await queryRunner.commitTransaction();

      await this.auditoriaService.registrar(
        userId,
        'PROJETO_ATUALIZADO',
        `Projeto #${id} atualizado por usuario com cargo "${role}".`,
        id,
      );

      return this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number, userId: number, role: string): Promise<void> {
    const projeto = await this.findOne(id);

    if (role !== 'coordenador' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Sem permissao para remover este projeto.');
    }

    await this.projetoRepository.remove(projeto);

    await this.auditoriaService.registrar(
      userId,
      'PROJETO_REMOVIDO',
      `Projeto #${id} removido por usuario com cargo "${role}". Titulo: "${projeto.titulo}".`,
    );
  }

  private validateGroupSize(alunosIds: number[] = []) {
    const total = alunosIds.length + 1;

    if (total < 3 || total > 7) {
      throw new BadRequestException('O grupo deve ter entre 3 e 7 integrantes.');
    }
  }

  private async ensureAlunosAreAvailable(eventoId: number, todosIds: number[]) {
    const ocupados = await this.projetoAlunoRepository.find({
      where: {
        aluno: { id: In(todosIds) },
        projeto: { evento: { id: eventoId } },
      },
      relations: ['aluno'],
    });

    if (ocupados.length > 0) {
      const nomes = ocupados.map((p) => p.aluno.nome).join(', ');
      throw new BadRequestException(`Alunos ja vinculados a este evento: ${nomes}`);
    }
  }

  private async saveProjeto(
    qr: QueryRunner,
    dto: CreateProjetoDto,
    autorId: number,
    eventoId: number,
  ): Promise<Projeto> {
    const projeto = qr.manager.create(Projeto, {
      titulo: dto.titulo,
      descricao: dto.descricao,
      temaId: dto.temaId,
      evento: { id: eventoId } as Evento,
      alunoAutor: { id: autorId } as User,
    });

    return qr.manager.save(projeto);
  }

  private async saveParticipantes(
    qr: QueryRunner,
    projetoId: number,
    convidadosIds: number[] = [],
    autorId: number,
  ) {
    const participantesApenas = convidadosIds.filter((id) => id !== autorId);
    const idsUnicos = [...new Set(participantesApenas)];

    if (idsUnicos.length === 0) return [];

    const vinculos = idsUnicos.map((id) =>
      qr.manager.create(ProjetoAluno, {
        projeto: { id: projetoId },
        aluno: { id },
      }),
    );

    return qr.manager.save(vinculos);
  }

  private async getUltimoProjetoDoAluno(userId: number): Promise<Projeto> {
    const projeto = await this.projetoRepository.findOne({
      where: { alunoAutor: { id: userId } },
      order: { criadoEm: 'DESC' },
      relations: ['evento', 'tema'],
    });

    if (!projeto) {
      throw new NotFoundException('Voce ainda nao possui nenhum projeto cadastrado.');
    }

    return projeto;
  }

  private async validarTemaNoEvento(temaId: number, eventoId: number) {
    const existe = await this.temaEventoRepository.exists({
      where: { id: temaId, evento: { id: eventoId } },
    });

    if (!existe) {
      throw new BadRequestException(
        'O tema do projeto nao esta disponivel para este evento.',
      );
    }
  }

  private async validarSolicitacaoDuplicada(
    projetoId: number,
    orientadorId: number,
  ) {
    const solicitacao = await this.projetoOrientadorRepository.findOne({
      where: { projeto: { id: projetoId }, orientador: { id: orientadorId } },
    });

    if (!solicitacao) return;

    const mensagensErro: Record<string, string> = {
      pendente: 'Ja existe uma solicitacao pendente para este orientador.',
      aceito: 'Este orientador ja aceitou orientar este projeto.',
    };

    const erro = mensagensErro[solicitacao.status];
    if (erro) throw new BadRequestException(erro);
  }

  private getProjetoRelations() {
    return {
      evento: true,
      alunoAutor: true,
      tema: true,
      projetoAlunos: { aluno: true },
      orientadores: { orientador: true },
    } as const;
  }

  private getProjetoSelectFields() {
    return {
      id: true,
      titulo: true,
      descricao: true,
      temaId: true,
      criadoEm: true,
      evento: { id: true, titulo: true },
      tema: { id: true, nome: true },
      alunoAutor: {
        id: true,
        nome: true,
        role_cargo: true,
        ano: true,
        turma: true,
      },
      projetoAlunos: {
        id: true,
        aluno: { id: true, nome: true, ano: true, turma: true },
      },
      orientadores: {
        id: true,
        status: true,
        criadoEm: true,
        respondidoEm: true,
        orientador: { id: true, nome: true, email_institucional: true },
      },
    };
  }

  private async validarEventoETema(eventoId: number, temaId: number) {
    const evento = await this.eventoRepository.findOne({ where: { id: eventoId } });

    if (!evento) {
      throw new NotFoundException(`O evento #${eventoId} nao existe.`);
    }

    const agora = new Date();

    if (evento.prazoInicial && agora < evento.prazoInicial) {
      throw new BadRequestException(
        `As inscricoes para este evento ainda nao comecaram. (Inicio: ${evento.prazoInicial.toLocaleString()})`,
      );
    }

    if (evento.prazoFinal && agora > evento.prazoFinal) {
      throw new BadRequestException(
        `O prazo de inscricao para este evento encerrou em ${evento.prazoFinal.toLocaleString()}.`,
      );
    }

    const temaValido = await this.temaEventoRepository.findOne({
      where: { id: temaId, evento: { id: eventoId } },
    });

    if (!temaValido) {
      throw new BadRequestException(
        'O tema selecionado nao pertence a este evento ou nao existe.',
      );
    }
  }

  private async buscarUltimoEvento(): Promise<Evento> {
    const anoAtual = new Date().getFullYear();
    const inicioAno = `${anoAtual}-01-01`;
    const fimAno = `${anoAtual}-12-31`;

    const evento = await this.eventoRepository.findOne({
      where: {
        // Agora o 'Between' vai funcionar porque foi importado
        prazoInicial: Between(inicioAno as any, fimAno as any),
        status: EventoStatus.ATIVO
      },
      order: {
        criadoEm: 'DESC',
      },
      relations: ['temas'],
    });

    // 3. Resolve o erro do TypeScript garantindo que o retorno nunca será null para quem chama
    if (!evento) {
      throw new NotFoundException(
        `Nenhum evento ativo foi cadastrado ou encontrado para o ano de ${anoAtual}.`
      );
    }

    return evento;
  }

}
