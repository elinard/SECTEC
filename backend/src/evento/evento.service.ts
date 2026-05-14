import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { CreateTemasDto } from './dto/create-tema.dto';
import { Evento } from './entities/evento.entity';
import { TemaEvento } from './entities/tema-evento.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class EventoService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    
    @InjectRepository(TemaEvento)
    private readonly temaRepository: Repository<TemaEvento>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
    return await this.eventoRepository.remove(evento);
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

    const novosTemas = await this.temaRepository.findBy({
      id: In(temasIds)
    });

    professor.temasSelecionados = novosTemas;
    await this.userRepository.save(professor);

    return {
      message: 'Temas sincronizados com sucesso',
      totalSelecionado: novosTemas.length
    };
  }
}
