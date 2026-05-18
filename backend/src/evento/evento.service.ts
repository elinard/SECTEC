import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { CreateTemasDto } from './dto/create-tema.dto';
import { Evento, EventoStatus } from './entities/evento.entity'; 
import { TemaEvento } from './entities/tema-evento.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { ProjetoOrientador } from '../projetos/entities/projeto-orientador.entity'; 
// 💡 NOTA: Ajuste o caminho relativo acima se a pasta do módulo de projetos não for essa exatamente.

@Injectable()
export class EventoService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    
    @InjectRepository(TemaEvento)
    private readonly temaRepository: Repository<TemaEvento>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
      @InjectRepository(ProjetoOrientador)
  private readonly projetoOrientadorRepository: Repository<ProjetoOrientador>,
  ) {}

  async create(createEventoDto: CreateEventoDto) {
    // O TypeORM entende objetos aninhados no create se o DTO estiver correto
    const novoEvento = this.eventoRepository.create(createEventoDto);
    return await this.eventoRepository.save(novoEvento);
  }

  async findAll() {
    return await this.eventoRepository.find({
      relations: ['temas'],
      order: { criadoEm: 'DESC' }
    });
  }

  async findOne(id: number) {
    const evento = await this.eventoRepository.findOne({
      where: { id },
      relations: ['temas', 'coordenador'],
    });

    if (!evento) {
      throw new NotFoundException(`Evento com ID ${id} não encontrado`);
    }

    return evento;
  }

  async update(id: number, updateEventoDto: UpdateEventoDto) {
    const evento = await this.findOne(id);
    
    // O merge funciona com Value Objects, mas certifique-se de que o DTO 
    // envie o objeto de período completo ou o TypeORM pode sobrescrever com null
    this.eventoRepository.merge(evento, updateEventoDto);
    return await this.eventoRepository.save(evento);
  }

  async remove(id: number) {
    const evento = await this.findOne(id);
    
    evento.status = EventoStatus.INATIVO; // Muda o status
    await this.eventoRepository.save(evento); // Salva a alteração
    
    return { message: `Evento ${id} desativado com sucesso.` };
  }

  async addTemas(eventoId: number, createTemasDto: CreateTemasDto) {
    const evento = await this.findOne(eventoId);

    const novosTemas = createTemasDto.nomes.map(nome => {
      return this.temaRepository.create({
        nome,
        evento,
      });
    });

    return await this.temaRepository.save(novosTemas);
  }





// modulos/eventos/evento.service.ts

async findProfessoresPorTema(temaId: number) {
  const tema = await this.temaRepository.findOne({
    where: { id: temaId },
    relations: ['orientadores'], // Carrega os usuários vinculados a este tema
  });

  if (!tema) {
    throw new NotFoundException(`Tema com ID ${temaId} não encontrado`);
  }

  // Retorna apenas a lista de orientadores vinculados
  return tema.orientadores;
}





  /**
   * Busca o evento mais recente do ano vigente.
   * Ajustado para lidar com o tipo 'date' puro.
   */
  async eventoAtual() {
    const anoAtual = new Date().getFullYear();
    const inicioAno = `${anoAtual}-01-01`;
    const fimAno = `${anoAtual}-12-31`;

    return await this.eventoRepository.findOne({
      where: {
        // Agora usamos apenas a string da data, pois o banco é tipo 'date'
        prazoInicial: Between(inicioAno as any, fimAno as any),
        status: EventoStatus.ATIVO
      },
      order: {
        criadoEm: 'DESC',
      },
      relations: ['temas'],
    });
  }

    async sincronizarTemas(professorId: number, temasIds: number[]) {
  const professor = await this.userRepository.findOne({
    where: { id: professorId },
    relations: ['temasSelecionados']
  });

  if (!professor || professor.role_cargo !== UserRole.ORIENTADOR) {
    throw new BadRequestException('Orientador não encontrado ou cargo inválido.');
  }

  // 1. Identificar quais IDs de temas o orientador está tentando REMOVER (desmarcar)
  const temasAtuaisIds = professor.temasSelecionados.map(t => t.id);
  const temasSendoRemovidos = temasAtuaisIds.filter(id => !temasIds.includes(id));

  // 2. Se houver tentativa de remoção, aplica a validação de segurança baseada nas entidades
  if (temasSendoRemovidos.length > 0) {
    // Busca registros onde o orientador está vinculado a um projeto que use um dos temas removidos,
    // filtrando apenas por orientações ativas ('aceito') ou convites ainda em aberto ('pendente')
    const vinculosAtivos = await this.projetoOrientadorRepository.find({
      where: {
        orientador: { id: professorId },
        status: In(['aceito', 'pendente']), // Bloqueia tanto o projeto atual quanto solicitações pendentes
        projeto: {
          temaId: In(temasSendoRemovidos) // Filtra direto pela coluna temaId mapeada no Projeto
        }
      },
      relations: ['projeto', 'projeto.tema'] // Traz o relacionamento para podermos exibir o nome amigável do tema
    });

    if (vinculosAtivos.length > 0) {
      // Extrai os nomes únicos dos temas que causaram o bloqueio para listar no erro
      const nomesTemasBloqueados = Array.from(
        new Set(vinculosAtivos.map(v => v.projeto?.tema?.nome || `ID: ${v.projeto?.temaId}`))
      ).map(nome => `"${nome}"`).join(', ');

      throw new BadRequestException(
        `Não é possível remover os seguintes temas pois existem solicitações pendentes ou projetos sob sua orientação vinculados a eles: ${nomesTemasBloqueados}`
      );
    }
  }

  const novosTemas = await this.temaRepository.findBy({
    id: In(temasIds)
  });

  // 🚀 VALIDAÇÃO EXISTENTE: Garante o piso mínimo de 4 temas válidos
  if (novosTemas.length < 4) {
    throw new BadRequestException(
      `Você precisa selecionar no mínimo 4 temas válidos. (Selecionados: ${novosTemas.length})`
    );
  }

  professor.temasSelecionados = novosTemas;
  await this.userRepository.save(professor);

  return {
    message: 'Temas sincronizados com sucesso',
    totalSelecionado: novosTemas.length
  };
}


}
