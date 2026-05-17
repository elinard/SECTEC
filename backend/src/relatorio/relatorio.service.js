"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelatorioService = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var typeorm_2 = require("typeorm");
var user_entity_1 = require("src/users/entities/user.entity");
var evento_entity_1 = require("src/evento/entities/evento.entity");
var projeto_entity_1 = require("src/projetos/entities/projeto.entity");
var projeto_aluno_entity_1 = require("src/projetos/entities/projeto-aluno.entity");
var comissao_evento_entity_1 = require("src/evento/entities/comissao-evento.entity");
var tema_evento_entity_1 = require("src/evento/entities/tema-evento.entity"); // ajuste o caminho se necessário
var RelatorioService = /** @class */ (function () {
    function RelatorioService(userRepository, eventoRepository, comissaoRepository, temaRepository, projetoRepository) {
        this.userRepository = userRepository;
        this.eventoRepository = eventoRepository;
        this.comissaoRepository = comissaoRepository;
        this.temaRepository = temaRepository;
        this.projetoRepository = projetoRepository;
    }
    RelatorioService.prototype.obterAlunosSemProjeto = function () {
        return __awaiter(this, void 0, Promise, function () {
            var anoAtual, inicioAno, fimAno, eventoAtual, alunosSemProjeto, agrupado;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        anoAtual = new Date().getFullYear();
                        inicioAno = "".concat(anoAtual, "-01-01");
                        fimAno = "".concat(anoAtual, "-12-31");
                        return [4 /*yield*/, this.eventoRepository.findOne({
                                where: {
                                    prazoInicial: (0, typeorm_2.Between)(inicioAno, fimAno),
                                    status: evento_entity_1.EventoStatus.ATIVO,
                                },
                            })];
                    case 1:
                        eventoAtual = _a.sent();
                        if (!eventoAtual) {
                            throw new common_1.NotFoundException("Nenhum evento ativo encontrado para o ano de ".concat(anoAtual, "."));
                        }
                        return [4 /*yield*/, this.userRepository
                                .createQueryBuilder('user')
                                .select(['user.id', 'user.nome', 'user.email_institucional', 'user.ano', 'user.turma'])
                                .where('user.role_cargo = :role', { role: user_entity_1.UserRole.ALUNO })
                                .andWhere('user.ativo = :ativo', { ativo: true })
                                .andWhere(function (qb) {
                                var subQueryAutor = qb
                                    .subQuery()
                                    .select('1')
                                    .from(projeto_entity_1.Projeto, 'p')
                                    .where('p.aluno_autor_id = user.id')
                                    .andWhere('p.evento_id = :eventoId', { eventoId: eventoAtual.id })
                                    .getQuery();
                                return "NOT EXISTS ".concat(subQueryAutor);
                            })
                                .andWhere(function (qb) {
                                var subQueryIntegrante = qb
                                    .subQuery()
                                    .select('1')
                                    .from(projeto_aluno_entity_1.ProjetoAluno, 'pa')
                                    .innerJoin('pa.projeto', 'proj')
                                    .where('pa.aluno_id = user.id')
                                    .andWhere('proj.evento_id = :eventoId', { eventoId: eventoAtual.id })
                                    .getQuery();
                                return "NOT EXISTS ".concat(subQueryIntegrante);
                            })
                                .orderBy('user.turma', 'ASC')
                                .addOrderBy('user.ano', 'ASC')
                                .getMany()];
                    case 2:
                        alunosSemProjeto = _a.sent();
                        agrupado = {};
                        alunosSemProjeto.forEach(function (aluno) {
                            // Força a conversão para string com segurança para gerar a chave do objeto
                            var curso = aluno.turma ? String(aluno.turma).toLowerCase().trim() : 'indefinido';
                            var ano = aluno.ano || '';
                            var chaveTurma = "".concat(curso).concat(ano);
                            if (!agrupado[chaveTurma]) {
                                agrupado[chaveTurma] = [];
                            }
                            agrupado[chaveTurma].push({
                                id: aluno.id,
                                nome: aluno.nome,
                                email: aluno.email_institucional,
                                ano: aluno.ano,
                                turma: aluno.turma, // Agora aceita sem reclamar de null
                            });
                        });
                        return [2 /*return*/, agrupado];
                }
            });
        });
    };
    RelatorioService.prototype.obterHistoricoComissao = function () {
        return __awaiter(this, void 0, Promise, function () {
            var historicoBruto, agrupado;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.comissaoRepository.find({
                            relations: ['evento', 'user'],
                            order: {
                                evento: { criadoEm: 'DESC' },
                                user: { nome: 'ASC' }, // Alunos em ordem alfabética
                            },
                        })];
                    case 1:
                        historicoBruto = _a.sent();
                        agrupado = {};
                        historicoBruto.forEach(function (registro) {
                            var evento = registro.evento;
                            var aluno = registro.user;
                            // Se o evento ou aluno por algum motivo bizarro sumirem, evita quebra de script
                            if (!evento || !aluno)
                                return;
                            // Usamos o título do evento como chave do agrupamento
                            var chaveEvento = evento.titulo;
                            if (!agrupado[chaveEvento]) {
                                agrupado[chaveEvento] = {
                                    eventoId: evento.id,
                                    alunos: [],
                                };
                            }
                            agrupado[chaveEvento].alunos.push({
                                id: aluno.id,
                                nome: aluno.nome,
                                email: aluno.email_institucional,
                                turma: aluno.turma,
                                ano: aluno.ano,
                            });
                        });
                        return [2 /*return*/, agrupado];
                }
            });
        });
    };
    RelatorioService.prototype.obterMetricasEixosTematicos = function () {
        return __awaiter(this, void 0, Promise, function () {
            var resultados, agrupado;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.temaRepository
                            .createQueryBuilder('tema')
                            .innerJoin('tema.evento', 'evento')
                            .select([
                            'tema.id AS temaId',
                            'tema.nome AS temaNome',
                            'evento.id AS eventoId',
                            'evento.titulo AS eventoTitulo',
                        ])
                            // Subquery: Total de projetos atrelados a este tema e a este evento específico
                            .addSelect(function (qb) {
                            return qb
                                .select('COUNT(p.id)', 'total')
                                .from(projeto_entity_1.Projeto, 'p')
                                .where('p.tema_id = tema.id')
                                .andWhere('p.evento_id = evento.id'); // 👈 Link dinâmico com o evento da linha
                        }, 'totalProjetos')
                            // Subquery: Projetos com solicitações pendentes de orientação
                            .addSelect(function (qb) {
                            return qb
                                .select('COUNT(DISTINCT p_pend.id)', 'pendentes')
                                .from(projeto_entity_1.Projeto, 'p_pend')
                                .innerJoin('p_pend.orientadores', 'po_pend')
                                .where('p_pend.tema_id = tema.id')
                                .andWhere('p_pend.evento_id = evento.id') // 👈 Link dinâmico
                                .andWhere('po_pend.status = :statusPendente', { statusPendente: 'pendente' });
                        }, 'projetosPendentes')
                            // Subquery: Projetos que já possuem orientador aceito
                            .addSelect(function (qb) {
                            return qb
                                .select('COUNT(DISTINCT p_aceito.id)', 'aceitos')
                                .from(projeto_entity_1.Projeto, 'p_aceito')
                                .innerJoin('p_aceito.orientadores', 'po_aceito')
                                .where('p_aceito.tema_id = tema.id')
                                .andWhere('p_aceito.evento_id = evento.id') // 👈 Link dinâmico
                                .andWhere('po_aceito.status = :statusAceito', { statusAceito: 'aceito' });
                        }, 'projetosAceitos')
                            .orderBy('evento.criado_em', 'DESC') // Eventos mais novos aparecem primeiro no topo
                            .addOrderBy('tema.nome', 'ASC')
                            .getRawMany()];
                    case 1:
                        resultados = _a.sent();
                        agrupado = {};
                        resultados.forEach(function (row) {
                            var chaveEvento = row.eventoTitulo;
                            // Se a divisória do evento não existir no objeto, inicializa ela
                            if (!agrupado[chaveEvento]) {
                                agrupado[chaveEvento] = {
                                    eventoId: Number(row.eventoId),
                                    eixos: [],
                                };
                            }
                            // Adiciona o eixo temático com suas métricas computadas no evento correspondente
                            agrupado[chaveEvento].eixos.push({
                                temaId: Number(row.temaId),
                                temaNome: row.temaNome,
                                totalProjetos: Number(row.totalProjetos || 0),
                                projetosPendentes: Number(row.projetosPendentes || 0),
                                projetosAceitos: Number(row.projetosAceitos || 0),
                            });
                        });
                        return [2 /*return*/, agrupado];
                }
            });
        });
    };
    RelatorioService.prototype.obterProjetosPorOrientador = function () {
        return __awaiter(this, void 0, Promise, function () {
            var anoAtual, inicioAno, fimAno, eventoAtual, orientadoresComProjetos;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        anoAtual = new Date().getFullYear();
                        inicioAno = "".concat(anoAtual, "-01-01");
                        fimAno = "".concat(anoAtual, "-12-31");
                        return [4 /*yield*/, this.eventoRepository.findOne({
                                where: {
                                    prazoInicial: (0, typeorm_2.Between)(inicioAno, fimAno),
                                    status: evento_entity_1.EventoStatus.ATIVO,
                                },
                            })];
                    case 1:
                        eventoAtual = _a.sent();
                        if (!eventoAtual) {
                            throw new common_1.NotFoundException("Nenhum evento ativo encontrado para o ano de ".concat(anoAtual, "."));
                        }
                        return [4 /*yield*/, this.userRepository
                                .createQueryBuilder('user')
                                .leftJoinAndSelect('user.solicitacoesOrientacao', 'solicitacao', 'solicitacao.status = :status', { status: 'aceito' })
                                .leftJoinAndSelect('solicitacao.projeto', 'projeto', 'projeto.evento_id = :eventoId', { eventoId: eventoAtual.id })
                                .where('user.role_cargo = :role', { role: user_entity_1.UserRole.ORIENTADOR })
                                .andWhere('user.ativo = :ativo', { ativo: true })
                                .orderBy('user.nome', 'ASC')
                                .getMany()];
                    case 2:
                        orientadoresComProjetos = _a.sent();
                        // 3. Mapeia e limpa a estrutura para retornar estritamente o necessário
                        return [2 /*return*/, orientadoresComProjetos.map(function (orientador) {
                                // Filtra e limpa registros nulos decorrentes do LEFT JOIN caso o professor não possua projetos vinculados
                                var projetosFiltrados = orientador.solicitacoesOrientacao
                                    .filter(function (solicitacao) { return solicitacao.projeto !== null; })
                                    .map(function (solicitacao) { return solicitacao.projeto.titulo; });
                                return {
                                    orientadorId: orientador.id,
                                    orientadorNome: orientador.nome,
                                    email: orientador.email_institucional,
                                    totalProjetosAceitos: projetosFiltrados.length,
                                    projetos: projetosFiltrados,
                                };
                            })];
                }
            });
        });
    };
    RelatorioService.prototype.obterProjetosPorTurma = function () {
        return __awaiter(this, void 0, Promise, function () {
            var anoAtual, inicioAno, fimAno, eventoAtual, projetos, agrupado;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        anoAtual = new Date().getFullYear();
                        inicioAno = "".concat(anoAtual, "-01-01");
                        fimAno = "".concat(anoAtual, "-12-31");
                        return [4 /*yield*/, this.eventoRepository.findOne({
                                where: {
                                    prazoInicial: (0, typeorm_2.Between)(inicioAno, fimAno),
                                    status: evento_entity_1.EventoStatus.ATIVO,
                                },
                            })];
                    case 1:
                        eventoAtual = _a.sent();
                        if (!eventoAtual) {
                            throw new common_1.NotFoundException("Nenhum evento ativo encontrado para o ano de ".concat(anoAtual, "."));
                        }
                        return [4 /*yield*/, this.projetoRepository
                                .createQueryBuilder('projeto')
                                .innerJoinAndSelect('projeto.alunoAutor', 'autor')
                                .leftJoinAndSelect('projeto.orientadores', 'orientador')
                                .where('projeto.evento_id = :eventoId', { eventoId: eventoAtual.id })
                                .getMany()];
                    case 2:
                        projetos = _a.sent();
                        agrupado = {};
                        // 3. Agrupa os resultados gerando a chave combinada (ex: informatica2)
                        projetos.forEach(function (projeto) {
                            var autor = projeto.alunoAutor;
                            // Tratamento preventivo caso o aluno não possua turma preenchida
                            var curso = autor.turma ? String(autor.turma).toLowerCase().trim() : 'indefinido';
                            var ano = autor.ano || 1;
                            var chaveTurma = "".concat(curso).concat(ano);
                            // Inicializa o grupo da turma se ele não existir
                            if (!agrupado[chaveTurma]) {
                                agrupado[chaveTurma] = {
                                    turma: curso,
                                    ano: ano,
                                    totalCriados: 0,
                                    totalAprovados: 0,
                                };
                            }
                            // Incrementa o total de projetos criados por aquela turma
                            agrupado[chaveTurma].totalCriados++;
                            // Verifica se o projeto possui pelo menos uma orientação aceita (Aprovado)
                            var possuiAprovacao = projeto.orientadores.some(function (orientador) { return orientador.status === 'aceito'; });
                            if (possuiAprovacao) {
                                agrupado[chaveTurma].totalAprovados++;
                            }
                        });
                        return [2 /*return*/, agrupado];
                }
            });
        });
    };
    RelatorioService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
        __param(1, (0, typeorm_1.InjectRepository)(evento_entity_1.Evento)),
        __param(2, (0, typeorm_1.InjectRepository)(comissao_evento_entity_1.ComissaoEvento)),
        __param(3, (0, typeorm_1.InjectRepository)(tema_evento_entity_1.TemaEvento)),
        __param(4, (0, typeorm_1.InjectRepository)(projeto_entity_1.Projeto))
    ], RelatorioService);
    return RelatorioService;
}());
exports.RelatorioService = RelatorioService;
