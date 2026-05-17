import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User, UserTurma, UserRole } from './entities/user.entity';
import { Evento, EventoStatus } from 'src/evento/entities/evento.entity';
import { ComissaoEvento } from 'src/evento/entities/comissao-evento.entity';
import { HashingProvider } from '../common/providers/hashing.provider';
import { parse } from 'csv-parse/sync';

interface ICsvRow {
  nome: string;
  email: string;
  senha?: string;
  turma?: string;
  ano?: string;
  [key: string]: any;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    // 👇 NOVOS REPOSITÓRIOS INJETADOS PARA O HISTÓRICO DA COMISSÃO
    @InjectRepository(Evento)
    private eventoRepository: Repository<Evento>,

    @InjectRepository(ComissaoEvento)
    private comissaoRepository: Repository<ComissaoEvento>,

    private hashingProvider: HashingProvider,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.senha')
      .where('user.email_institucional = :email', { email })
      .getOne();
  }

  async findAllAlunos() {
    return this.usersRepository.find({
      where: { role_cargo: UserRole.ALUNO, ativo: true },
      select: ['id', 'nome', 'email_institucional', 'turma', 'ano'],
    });
  }

  async findAllComissao() {
    return this.usersRepository.find({
      where: { role_cargo: UserRole.COMISSAO, ativo: true },
      select: ['id', 'nome', 'email_institucional', 'turma', 'ano'],
    });
  }

  async findAllOrientadores() {
    return this.usersRepository.find({
      where: { role_cargo: UserRole.ORIENTADOR, ativo: true },
      select: ['id', 'nome', 'email_institucional'],
      relations: ['temasSelecionados'],
    });
  }

  async processarCsv(file: Express.Multer.File, tipo: UserRole) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Arquivo não enviado ou corrompido.');
    }

    const csvString = file.buffer.toString('utf-8');
    let registros: ICsvRow[];

    try {
      registros = parse(csvString, {
        columns: (header: string[]) => header.map((h) => h.toLowerCase().trim()),
        skip_empty_lines: true,
        trim: true,
        bom: true,
        delimiter: [',', ';'],
        skip_records_with_error: true,
        relax_column_count: true,
      });
    } catch (e) {
      throw new BadRequestException('Erro ao formatar CSV. Verifique o cabeçalho.');
    }

    const mapaTurmas: Record<string, UserTurma> = {
      INFO: UserTurma.INFORMATICA,
      CONT: UserTurma.CONTABILIDADE,
      ENF: UserTurma.ENFERMAGEM,
    };

    const dadosFormatados = await Promise.all(
      registros.map(async (reg, index) => {
        const emailBruto =
          reg.email || reg['email gsuite'] || reg['email_gsuite'] || reg['e-mail'];
        const nomeBruto = reg.nome;

        if (!nomeBruto || !emailBruto) {
          throw new BadRequestException(
            `Erro na linha ${index + 2}: Colunas Nome e Email são obrigatórias (Verificado: ${nomeBruto}, ${emailBruto}).`,
          );
        }

        const primeiroNome = String(nomeBruto).trim();
        const primeiroEmail = String(emailBruto).trim();
        const primeiraTurma = (reg.turma || '').trim();
        const primeiroAnoStr = (reg.ano || '').trim();

        let senhaFinal: string;
        let turmaFinal: UserTurma | null = null;
        let roleFinal: UserRole;
        let anoFinal: number = 0;

        if (tipo === UserRole.ALUNO) {
          senhaFinal = primeiroEmail;
          roleFinal = UserRole.ALUNO;
          anoFinal = primeiroAnoStr ? Number(primeiroAnoStr) : 1;

          const chaveBusca = primeiraTurma.toUpperCase();
          turmaFinal = mapaTurmas[chaveBusca] || UserTurma.INFORMATICA;
        } else {
          const primeiraSenha = reg.senha || '';
          senhaFinal = primeiraSenha || primeiroEmail;
          roleFinal = UserRole.ORIENTADOR;
          turmaFinal = null;
          anoFinal = 0;
        }

        const senhaHasheada = await this.hashingProvider.hash(senhaFinal);

        return {
          nome: primeiroNome,
          email_institucional: primeiroEmail,
          senha: senhaHasheada,
          turma: turmaFinal,
          ano: anoFinal,
          role_cargo: roleFinal,
          ativo: true,
        };
      }),
    );

    try {
      await this.usersRepository.save(dadosFormatados);
      return {
        filename: file.originalname,
        total: dadosFormatados.length,
        tipo: tipo,
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new BadRequestException('Um ou mais e-mails do CSV já estão cadastrados.');
      }
      throw new InternalServerErrorException('Erro ao salvar usuários no banco de dados.');
    }
  }

  async promoteToComissao(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    // Regra de negócio: Apenas quem é ALUNO pode virar COMISSÃO nesta rota
    if (user.role_cargo !== UserRole.ALUNO) {
      throw new BadRequestException(
        'Apenas usuários com cargo de ALUNO podem ser movidos para a COMISSÃO.',
      );
    }

    // 1. Busca o evento ativo do ano corrente (2026) usando o Between
    const anoAtual = new Date().getFullYear();
    const inicioAno = `${anoAtual}-01-01`;
    const fimAno = `${anoAtual}-12-31`;

    const eventoAtual = await this.eventoRepository.findOne({
      where: {
        prazoInicial: Between(inicioAno as any, fimAno as any),
        status: EventoStatus.ATIVO,
      },
    });

    if (!eventoAtual) {
      throw new BadRequestException(
        `Não é possível promover o aluno pois não há nenhum evento ATIVO cadastrado para o ano de ${anoAtual}.`,
      );
    }

    // 2. Atualiza o cargo do usuário para comissão
    user.role_cargo = UserRole.COMISSAO;
    const usuarioAtualizado = await this.usersRepository.save(user);

    // 3. Verifica se o registro já não existe na tabela pivot (evita duplicidade acidental)
    const jaEstaNaComissao = await this.comissaoRepository.exists({
      where: {
        evento: { id: eventoAtual.id },
        user: { id: usuarioAtualizado.id },
      },
    });

    if (!jaEstaNaComissao) {
      const historico = this.comissaoRepository.create({
        evento: eventoAtual,
        user: usuarioAtualizado,
      });
      await this.comissaoRepository.save(historico);
    }
    return usuarioAtualizado;
  }
}
