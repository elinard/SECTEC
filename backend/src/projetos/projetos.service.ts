import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, QueryRunner } from 'typeorm';

// Entities
import { Projeto } from './entities/projeto.entity';
import { ProjetoAluno } from './entities/projeto-aluno.entity';
import { ProjetoOrientador } from './entities/projeto-orientador.entity';
import { TemaEvento } from 'src/evento/entities/tema-evento.entity';
import { Evento } from 'src/evento/entities/evento.entity';
import { User, UserRole } from 'src/users/entities/user.entity';

// DTOs
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { AuditoriaService } from 'src/auditoria/auditoria.service';

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

  // ===========================================================================
  // MÉTODOS DE CRIAÇÃO (ESCRITA)
  // ===========================================================================

  async create(dto: CreateProjetoDto, userId: number): Promise<Projeto> {
    const ultimoEvento = await this.buscarUltimoEvento();
    await this.validarEventoETema(ultimoEvento.id, dto.temaId);
    this.validateGroupSize(dto.alunosIds);
    await this.ensureAlunosAreAvailable(ultimoEvento.id, [...(dto.alunosIds || []), userId]);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const projeto = await this.saveProjeto(queryRunner, dto, userId, ultimoEvento.id);
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
          resultados.push({ orientadorId, status: 'pulado', motivo: 'Usuário não é um orientador válido.' });
          continue;
        }

        const solicitacao = await this.enviarSolicitacaoIndividual(projeto, userId, orientadorId);
        resultados.push({ orientadorId, status: 'sucesso', solicitacaoId: solicitacao.id });
      } catch (error) {
        resultados.push({
          orientadorId,
          status: 'erro',
          motivo: error.message || 'Erro interno ao processar este ID.',
        });
        continue;
      }
    }

    return { projetoId: projeto.id, resumo: resultados };
  }

  private async enviarSolicitacaoIndividual(projeto: Projeto, userId: number, orientadorId: number): Promise<ProjetoOrientador> {
<<<<<<< Updated upstream
    // Suas validações existentes
    await this.validarTemaNoEvento(projeto.tema.id, projeto.evento.id);
=======
    await this.validarTemaNoEvento(projeto.temaId, projeto.evento.id);
>>>>>>> Stashed changes
    await this.validarSolicitacaoDuplicada(projeto.id, orientadorId);

    const novaSolicitacao = this.projetoOrientadorRepository.create({
      projeto: { id: projeto.id },
      orientador: { id: orientadorId },
      status: 'pendente',
    });

    const solicitacao = await this.projetoOrientadorRepository.save(novaSolicitacao);

    await this.auditoriaService.registrar(
      userId,
      'ORIENTADOR_SOLICITADO',
      `Solicitação enviada ao orientador #${orientadorId} para o projeto #${projeto.id}.`,
      projeto.id,
    );

    return solicitacao;
  }

  private async verificarSeEProfessor(id: number): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id, role_cargo: UserRole.ORIENTADOR } });
    return !!user;
  }

  // ===========================================================================
  // MÉTODOS DE CONSULTA (LEITURA)
  // ===========================================================================

  async findOne(id: number): Promise<Projeto> {
    const projeto = await this.projetoRepository.findOne({
      where: { id },
      relations: {
        evento: true,
        alunoAutor: true,
        tema: true,
        projetoAlunos: { aluno: true },
        tema: true, // ✅ adicionado
      },
      select: this.getProjetoSelectFields(),
    });

    if (!projeto) {
      throw new NotFoundException(`Projeto #${id} não encontrado`);
    }
    return projeto;
  }

  async findAllAlunos(userId: number): Promise<Projeto[]> {
    return this.projetoRepository.find({
      where: { alunoAutor: { id: userId } },
      relations: {
        evento: true,
        alunoAutor: true,
        tema: true,
        projetoAlunos: { aluno: true },
        tema: true, // ✅ adicionado
      },
      select: this.getProjetoSelectFields(),
    });
  }

  async findAllOrientador(userId: number): Promise<Projeto[]> {
    const projetosOrientados = await this.projetoOrientadorRepository.find({
      where: { orientador: { id: userId }, status: 'aceito' },
      relations: {
        projeto: {
          evento: true,
          alunoAutor: true,
          tema: true,
          projetoAlunos: { aluno: true },
          tema: true, // ✅ adicionado
        },
      },
    });

    return projetosOrientados.map((solicitacao) => solicitacao.projeto);
  }

  async findAllCoordenador(): Promise<Evento[]> {
    return this.dataSource.getRepository(Evento).find({
      relations: {
        projetos: {
          tema: true,
          alunoAutor: true,
          projetoAlunos: { aluno: true },
          tema: true, // ✅ adicionado
        },
      },
      order: { id: 'DESC' },
    });
  }

  // ===========================================================================
  // MÉTODOS DE ATUALIZAÇÃO E REMOÇÃO
  // ===========================================================================

<<<<<<< Updated upstream
  /**
   * Atualiza dados do projeto. Regras de permissão variam por Role.
   */
  async update(id: number, dto: UpdateProjetoDto, userId: number, role: string): Promise<Projeto> {
  const projeto = await this.findOne(id);

  if (role !== 'coordenador' && projeto.alunoAutor.id !== userId) {
    throw new ForbiddenException('Sem permissão para editar este projeto.');
  }

  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { temaId, evento, alunosIds, ...restDto } = dto;

    // 1. Criamos um objeto de atualização apenas com o que foi enviado
    const updateData: any = {};

    if (restDto.titulo) updateData.titulo = restDto.titulo;
    if (restDto.descricao) updateData.descricao = restDto.descricao;
    if (temaId) updateData.tema = { id: temaId };
    if (evento) updateData.evento = { id: evento };

    // 2. Só executamos o update se o objeto não estiver vazio
    if (Object.keys(updateData).length > 0) {
      await queryRunner.manager.update(Projeto, id, updateData);
    }

    // 3. Lógica de Integrantes (ProjetoAluno)
    // Se vier alunosIds, o coordenador quer resetar a equipe
    if (alunosIds && role === 'coordenador') {
      await queryRunner.manager.delete(ProjetoAluno, { projeto: { id: id } });
      await this.saveParticipantes(queryRunner, id, alunosIds, projeto.alunoAutor.id);
    }

    await queryRunner.commitTransaction();

    await this.auditoriaService.registrar(
      userId,
      'PROJETO_ATUALIZADO',
      `Projeto #${id} atualizado via PATCH.`,
      id,
    );

    return this.findOne(id);

  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
=======
  async update(id: number, dto: UpdateProjetoDto, userId: number, role: string): Promise<Projeto> {
    const projeto = await this.findOne(id);

    if (role !== 'coordenador' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Sem permissão para editar este projeto.');
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

      const dadosAtualizados: any = {
        titulo: dto.titulo ?? projeto.titulo,
        descricao: dto.descricao ?? projeto.descricao,
        evento: { id: eventoId },
        alunoAutor: { id: projeto.alunoAutor.id },
      };

      // ✅ corrigido: temaId é number, não objeto
      if (dto.temaId) {
        dadosAtualizados.temaId = dto.temaId;
      }

      this.projetoRepository.merge(projeto, dadosAtualizados);
      await queryRunner.manager.save(projeto);

      if (dto.alunosIds && role === 'coordenador') {
        await queryRunner.manager.delete(ProjetoAluno, { projeto: { id: projeto.id } });
        await this.saveParticipantes(queryRunner, projeto.id, dto.alunosIds, projeto.alunoAutor.id);
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
>>>>>>> Stashed changes
  }

<<<<<<< Updated upstream





  /**
   * Remove um projeto do sistema.
   */
=======
>>>>>>> Stashed changes
  async remove(id: number, userId: number, role: string): Promise<void> {
    const projeto = await this.findOne(id);

    if (role !== 'coordenador' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Sem permissão para remover este projeto.');
    }

    await this.projetoRepository.remove(projeto);

    await this.auditoriaService.registrar(
      userId,
      'PROJETO_REMOVIDO',
      `Projeto #${id} removido por usuario com cargo "${role}". Titulo: "${projeto.titulo}".`,
    );
  }

  // ===========================================================================
  // MÉTODOS PRIVADOS AUXILIARES (LÓGICA INTERNA)
  // ===========================================================================

  private validateGroupSize(alunosIds: number[] = []) {
    const total = alunosIds.length + 1;
    if (total < 3 || total > 7) {
      throw new BadRequestException(`O grupo deve ter entre 3 e 6 integrantes.`);
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
      throw new BadRequestException(`Alunos já vinculados a este evento: ${nomes}`);
    }
  }

<<<<<<< Updated upstream
  private async saveProjeto(qr: QueryRunner, dto: CreateProjetoDto, autorId: number): Promise<Projeto> {
  // Criamos o objeto limpando qualquer ID que possa vir do Front por engano
  const novoProjeto = qr.manager.create(Projeto, {
    titulo: dto.titulo,
    descricao: dto.descricao,
    evento: { id: dto.evento } as any,
    tema: { id: dto.temaId } as any,
    alunoAutor: { id: autorId } as any,
  });

  // Usamos save, mas garantimos que o objeto está "limpo"
  return qr.manager.save(Projeto, novoProjeto);
}
=======
  // ✅ eventoId agora vem como parâmetro separado (não do dto.evento que pode ser undefined)
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
      evento: { id: eventoId } as any,
      alunoAutor: { id: autorId } as any,
    });
>>>>>>> Stashed changes

    return qr.manager.save(projeto);
  }


  private async saveParticipantes(qr: QueryRunner, projetoId: number, convidadosIds: number[] = [], autorId: number) {
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
      // ADICIONE O TEMA AQUI ⬇️
      relations: ['evento', 'tema'], 
    });

    if (!projeto) {
      throw new NotFoundException('Você ainda não possui nenhum projeto cadastrado.');
    }
    return projeto;
  }


  private async validarTemaNoEvento(temaId: number, eventoId: number) {
    const existe = await this.temaEventoRepository.exists({
      where: { id: temaId, evento: { id: eventoId } },
    });

    if (!existe) {
      throw new BadRequestException('O tema do projeto não está disponível para este evento.');     
    }
  }

  private async validarSolicitacaoDuplicada(projetoId: number, orientadorId: number) {
    const solicitacao = await this.projetoOrientadorRepository.findOne({
      where: { projeto: { id: projetoId }, orientador: { id: orientadorId } },
    });

    if (!solicitacao) return;

    const mensagensErro: Record<string, string> = {
      pendente: 'Já existe uma solicitação pendente para este orientador.',
      aceito: 'Este orientador já aceitou orientar este projeto.',
    };

    const erro = mensagensErro[solicitacao.status];
    if (erro) throw new BadRequestException(erro);
  }

  // ✅ tema adicionado no select
  private getProjetoSelectFields() {
    return {
      id: true,
      titulo: true,
      descricao: true,
<<<<<<< Updated upstream
      tema: { id: true, nome: true }, // 👈 Adicionado
      alunoAutor: { id: true, nome: true, role_cargo: true, ano: true, turma: true },
      projetoAlunos: { id: true, aluno: { id: true, nome: true, ano: true, turma: true } },
=======
      temaId: true,
      tema: { id: true, nome: true },
      alunoAutor: { id: true, nome: true, role_cargo: true },
      projetoAlunos: { id: true, aluno: { id: true, nome: true } },
>>>>>>> Stashed changes
    };
  }

  private async validarEventoETema(eventoId: number, temaId: number) {
    const evento = await this.eventoRepository.findOne({ where: { id: eventoId } });

    if (!evento) {
      throw new NotFoundException(`O evento #${eventoId} não existe.`);
    }

    const agora = new Date();

    if (agora < evento.prazoInicial) {
      throw new BadRequestException(
        `As inscrições para este evento ainda não começaram. (Início: ${evento.prazoInicial.toLocaleString()})`,
      );
    }

    if (agora > evento.prazoFinal) {
      throw new BadRequestException(
        `O prazo de inscrição para este evento encerrou em ${evento.prazoFinal.toLocaleString()}.`,
      );
    }

    const temaValido = await this.temaEventoRepository.findOne({
      where: { id: temaId, evento: { id: eventoId } },
    });

    if (!temaValido) {
      throw new BadRequestException('O tema selecionado não pertence a este evento ou não existe.');
    }
  }

  private async buscarUltimoEvento(): Promise<Evento> {
    const ultimoEvento = await this.eventoRepository.findOne({
      where: {},
      order: { criadoEm: 'DESC' },
    });

    if (!ultimoEvento) {
      throw new NotFoundException('Não há nenhum evento cadastrado no sistema.');
    }

    return ultimoEvento;
  }
}