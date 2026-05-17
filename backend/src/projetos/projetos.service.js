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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjetosService = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var typeorm_2 = require("typeorm");
var evento_entity_1 = require("src/evento/entities/evento.entity");
var tema_evento_entity_1 = require("src/evento/entities/tema-evento.entity");
var user_entity_1 = require("src/users/entities/user.entity");
var projeto_aluno_entity_1 = require("./entities/projeto-aluno.entity");
var projeto_orientador_entity_1 = require("./entities/projeto-orientador.entity");
var projeto_entity_1 = require("./entities/projeto.entity");
var ProjetosService = /** @class */ (function () {
    function ProjetosService(projetoRepository, projetoAlunoRepository, projetoOrientadorRepository, temaEventoRepository, eventoRepository, userRepository, dataSource, auditoriaService) {
        this.projetoRepository = projetoRepository;
        this.projetoAlunoRepository = projetoAlunoRepository;
        this.projetoOrientadorRepository = projetoOrientadorRepository;
        this.temaEventoRepository = temaEventoRepository;
        this.eventoRepository = eventoRepository;
        this.userRepository = userRepository;
        this.dataSource = dataSource;
        this.auditoriaService = auditoriaService;
    }
    // =========================================================================
    // MÉTODO DE CRIAÇÃO (CORE)
    // =========================================================================
    /**
     * Cria um novo projeto dentro do evento ativo, vinculando o autor e os participantes.
     * Realiza validações de prazo de inscrição, tamanho de grupo e disponibilidade dos alunos.
     */
    ProjetosService.prototype.create = function (dto, userId) {
        return __awaiter(this, void 0, Promise, function () {
            var ultimoEvento, queryRunner, projeto, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.buscarUltimoEvento()];
                    case 1:
                        ultimoEvento = _a.sent();
                        // Validações de negócio de escopo e regras de grupo
                        return [4 /*yield*/, this.validarEventoETema(ultimoEvento.id, dto.temaId)];
                    case 2:
                        // Validações de negócio de escopo e regras de grupo
                        _a.sent();
                        this.validateGroupSize(dto.alunosIds);
                        return [4 /*yield*/, this.ensureAlunosAreAvailable(ultimoEvento.id, __spreadArray(__spreadArray([], (dto.alunosIds || []), true), [
                                userId,
                            ], false))];
                    case 3:
                        _a.sent();
                        queryRunner = this.dataSource.createQueryRunner();
                        return [4 /*yield*/, queryRunner.connect()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 11, 13, 15]);
                        return [4 /*yield*/, this.saveProjeto(queryRunner, dto, userId, ultimoEvento.id)];
                    case 7:
                        projeto = _a.sent();
                        // Vincula a equipe à tabela intermediária
                        return [4 /*yield*/, this.saveParticipantes(queryRunner, projeto.id, dto.alunosIds, userId)];
                    case 8:
                        // Vincula a equipe à tabela intermediária
                        _a.sent();
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 9:
                        _a.sent();
                        // Registro de Auditoria do sistema
                        return [4 /*yield*/, this.auditoriaService.registrar(userId, 'PROJETO_CRIADO', "Projeto \"".concat(projeto.titulo, "\" criado pelo aluno #").concat(userId, "."), projeto.id)];
                    case 10:
                        // Registro de Auditoria do sistema
                        _a.sent();
                        return [2 /*return*/, this.findOne(projeto.id)];
                    case 11:
                        err_1 = _a.sent();
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 12:
                        _a.sent();
                        throw err_1;
                    case 13: return [4 /*yield*/, queryRunner.release()];
                    case 14:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    // =========================================================================
    // MÉTODOS DE CONSULTA / BUSCA (READ)
    // =========================================================================
    /**
     * Busca um projeto específico pelo ID.
     * Filtra os orientadores para retornar apenas quem deu "aceito".
     */
    ProjetosService.prototype.findOne = function (id) {
        return __awaiter(this, void 0, Promise, function () {
            var projeto;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.projetoRepository.findOne({
                            where: { id: id },
                            relations: this.getProjetoRelations(),
                            select: this.getProjetoSelectFields(),
                        })];
                    case 1:
                        projeto = _a.sent();
                        if (!projeto) {
                            throw new common_1.NotFoundException("Projeto #".concat(id, " nao encontrado"));
                        }
                        this.filtrarOrientadoresAceitos(projeto);
                        return [2 /*return*/, projeto];
                }
            });
        });
    };
    /**
     * Encontra o projeto ativo do aluno no evento vigente,
     * seja ele o aluno autor ou um dos integrantes da equipe.
     */
    ProjetosService.prototype.findProjetoAtualPorAluno = function (userId) {
        return __awaiter(this, void 0, Promise, function () {
            var eventoAtual, projeto, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.buscarUltimoEvento()];
                    case 1:
                        eventoAtual = _a.sent();
                        return [4 /*yield*/, this.projetoRepository.findOne({
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
                            })];
                    case 2:
                        projeto = _a.sent();
                        if (!projeto)
                            return [2 /*return*/, null];
                        this.filtrarOrientadoresAceitos(projeto);
                        return [2 /*return*/, projeto];
                    case 3:
                        error_1 = _a.sent();
                        if (error_1 instanceof common_1.NotFoundException) {
                            return [2 /*return*/, null];
                        }
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retorna todos os projetos criados por um aluno autor específico.
     */
    ProjetosService.prototype.findAllAlunos = function (userId) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.projetoRepository.find({
                        where: { alunoAutor: { id: userId } },
                        relations: this.getProjetoRelations(),
                        select: this.getProjetoSelectFields(),
                    })];
            });
        });
    };
    /**
     * Retorna todos os projetos em que o orientador foi aceito.
     */
    ProjetosService.prototype.findAllOrientador = function (userId) {
        return __awaiter(this, void 0, Promise, function () {
            var projetosOrientados;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.projetoOrientadorRepository.find({
                            where: { orientador: { id: userId }, status: 'aceito' },
                            relations: {
                                projeto: this.getProjetoRelations(),
                            },
                        })];
                    case 1:
                        projetosOrientados = _a.sent();
                        return [2 /*return*/, projetosOrientados.map(function (solicitacao) { return solicitacao.projeto; })];
                }
            });
        });
    };
    /**
     * Retorna a lista de eventos com seus respectivos projetos para a visão da Coordenação.
     */
    ProjetosService.prototype.findAllCoordenador = function () {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.dataSource.getRepository(evento_entity_1.Evento).find({
                        relations: {
                            projetos: this.getProjetoRelations(),
                        },
                        order: { id: 'DESC' },
                    })];
            });
        });
    };
    // =========================================================================
    // MÉTODOS DE ATUALIZAÇÃO E REMOÇÃO (UPDATE / DELETE)
    // =========================================================================
    /**
     * Atualiza as informações básicas do projeto.
     * Permite que coordenadores manipulem integrantes da equipe.
     */
    ProjetosService.prototype.update = function (id, dto, userId, role) {
        var _a, _b, _c;
        return __awaiter(this, void 0, Promise, function () {
            var projeto, queryRunner, eventoId, ultimo, dadosAtualizados, err_2;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.findOne(id)];
                    case 1:
                        projeto = _d.sent();
                        // Controle estrito de autoridade/permissão
                        if (role !== 'coordenador' && projeto.alunoAutor.id !== userId) {
                            throw new common_1.ForbiddenException('Sem permissao para editar este projeto.');
                        }
                        if (dto.alunosIds && role !== 'coordenador') {
                            throw new common_1.ForbiddenException('Apenas coordenadores alteram integrantes.');
                        }
                        queryRunner = this.dataSource.createQueryRunner();
                        return [4 /*yield*/, queryRunner.connect()];
                    case 2:
                        _d.sent();
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _d.trys.push([4, 15, 17, 19]);
                        eventoId = dto.evento || ((_a = projeto.evento) === null || _a === void 0 ? void 0 : _a.id);
                        if (!!eventoId) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.buscarUltimoEvento()];
                    case 5:
                        ultimo = _d.sent();
                        eventoId = ultimo.id;
                        _d.label = 6;
                    case 6:
                        if (!dto.temaId) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.validarEventoETema(eventoId, dto.temaId)];
                    case 7:
                        _d.sent();
                        _d.label = 8;
                    case 8:
                        dadosAtualizados = {
                            titulo: (_b = dto.titulo) !== null && _b !== void 0 ? _b : projeto.titulo,
                            descricao: (_c = dto.descricao) !== null && _c !== void 0 ? _c : projeto.descricao,
                            evento: { id: eventoId },
                            alunoAutor: { id: projeto.alunoAutor.id },
                        };
                        if (dto.temaId) {
                            dadosAtualizados.temaId = dto.temaId;
                        }
                        this.projetoRepository.merge(projeto, dadosAtualizados);
                        return [4 /*yield*/, queryRunner.manager.save(projeto)];
                    case 9:
                        _d.sent();
                        if (!(dto.alunosIds && role === 'coordenador')) return [3 /*break*/, 12];
                        return [4 /*yield*/, queryRunner.manager.delete(projeto_aluno_entity_1.ProjetoAluno, {
                                projeto: { id: projeto.id },
                            })];
                    case 10:
                        _d.sent();
                        return [4 /*yield*/, this.saveParticipantes(queryRunner, projeto.id, dto.alunosIds, projeto.alunoAutor.id)];
                    case 11:
                        _d.sent();
                        _d.label = 12;
                    case 12: return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 13:
                        _d.sent();
                        return [4 /*yield*/, this.auditoriaService.registrar(userId, 'PROJETO_ATUALIZADO', "Projeto #".concat(id, " atualizado por usuario com cargo \"").concat(role, "\"."), id)];
                    case 14:
                        _d.sent();
                        return [2 /*return*/, this.findOne(id)];
                    case 15:
                        err_2 = _d.sent();
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 16:
                        _d.sent();
                        throw err_2;
                    case 17: return [4 /*yield*/, queryRunner.release()];
                    case 18:
                        _d.sent();
                        return [7 /*endfinally*/];
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove completamente o projeto do banco de dados (Apenas Autor ou Coordenação).
     */
    ProjetosService.prototype.remove = function (id, userId, role) {
        return __awaiter(this, void 0, Promise, function () {
            var projeto;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findOne(id)];
                    case 1:
                        projeto = _a.sent();
                        if (role !== 'coordenador' && projeto.alunoAutor.id !== userId) {
                            throw new common_1.ForbiddenException('Sem permissao para remover este projeto.');
                        }
                        return [4 /*yield*/, this.projetoRepository.remove(projeto)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.auditoriaService.registrar(userId, 'PROJETO_REMOVIDO', "Projeto #".concat(id, " removido por usuario com cargo \"").concat(role, "\". Titulo: \"").concat(projeto.titulo, "\"."))];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // =========================================================================
    // GESTÃO DE SOLICITAÇÕES DE ORIENTAÇÃO
    // =========================================================================
    /**
     * Processa o envio em lote de convites de orientação para múltiplos professores.
     */
    ProjetosService.prototype.enviarMultiplasSolicitacoes = function (userId, orientadoresIds) {
        return __awaiter(this, void 0, void 0, function () {
            var resultados, projeto, _i, orientadoresIds_1, orientadorId, professorValido, solicitacao, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        resultados = [];
                        return [4 /*yield*/, this.getUltimoProjetoDoAluno(userId)];
                    case 1:
                        projeto = _a.sent();
                        _i = 0, orientadoresIds_1 = orientadoresIds;
                        _a.label = 2;
                    case 2:
                        if (!(_i < orientadoresIds_1.length)) return [3 /*break*/, 8];
                        orientadorId = orientadoresIds_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 6, , 7]);
                        return [4 /*yield*/, this.verificarSeEProfessor(orientadorId)];
                    case 4:
                        professorValido = _a.sent();
                        if (!professorValido) {
                            resultados.push({
                                orientadorId: orientadorId,
                                status: 'pulado',
                                motivo: 'Usuario nao e um orientador valido.',
                            });
                            return [3 /*break*/, 7];
                        }
                        return [4 /*yield*/, this.enviarSolicitacaoIndividual(projeto, userId, orientadorId)];
                    case 5:
                        solicitacao = _a.sent();
                        resultados.push({
                            orientadorId: orientadorId,
                            status: 'sucesso',
                            solicitacaoId: solicitacao.id,
                        });
                        return [3 /*break*/, 7];
                    case 6:
                        error_2 = _a.sent();
                        resultados.push({
                            orientadorId: orientadorId,
                            status: 'erro',
                            motivo: error_2 instanceof Error ? error_2.message : 'Erro interno ao processar este ID.',
                        });
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 2];
                    case 8: return [2 /*return*/, { projetoId: projeto.id, resumo: resultados }];
                }
            });
        });
    };
    /**
     * Realiza as validações individuais de compatibilidade de tema e cria a solicitação pendente.
     */
    ProjetosService.prototype.enviarSolicitacaoIndividual = function (projeto, userId, orientadorId) {
        return __awaiter(this, void 0, Promise, function () {
            var novaSolicitacao, solicitacao;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.validarTemaNoEvento(projeto.temaId, projeto.evento.id)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.validarOrientadorSelecionouTema(projeto.temaId, orientadorId)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.validarSolicitacaoDuplicada(projeto.id, orientadorId)];
                    case 3:
                        _a.sent();
                        novaSolicitacao = this.projetoOrientadorRepository.create({
                            projeto: { id: projeto.id },
                            orientador: { id: orientadorId },
                            status: 'pendente',
                        });
                        return [4 /*yield*/, this.projetoOrientadorRepository.save(novaSolicitacao)];
                    case 4:
                        solicitacao = _a.sent();
                        return [4 /*yield*/, this.auditoriaService.registrar(userId, 'ORIENTADOR_SOLICITADO', "Solicitacao enviada ao orientador #".concat(orientadorId, " para o projeto #").concat(projeto.id, "."), projeto.id)];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, solicitacao];
                }
            });
        });
    };
    // =========================================================================
    // MÉTODOS PRIVADOS DE VALIDAÇÃO E SUPORTE
    // =========================================================================
    /**
     * Valida se as regras de tempo de ciclo de vida respeitam o Embedded Object de inscrições.
     */
    ProjetosService.prototype.validarEventoETema = function (eventoId, temaId) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var evento, agora, temaValido;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.eventoRepository.findOne({ where: { id: eventoId } })];
                    case 1:
                        evento = _c.sent();
                        if (!evento) {
                            throw new common_1.NotFoundException("O evento #".concat(eventoId, " nao existe."));
                        }
                        agora = new Date();
                        if (((_a = evento.inscricao) === null || _a === void 0 ? void 0 : _a.inicio) && agora < evento.inscricao.inicio) {
                            throw new common_1.BadRequestException("As inscricoes para este evento ainda nao comecaram. (Inicio: ".concat(evento.inscricao.inicio.toLocaleString(), ")"));
                        }
                        if (((_b = evento.inscricao) === null || _b === void 0 ? void 0 : _b.fim) && agora > evento.inscricao.fim) {
                            throw new common_1.BadRequestException("O prazo de inscricao para este evento encerrou em ".concat(evento.inscricao.fim.toLocaleString(), "."));
                        }
                        return [4 /*yield*/, this.temaEventoRepository.findOne({
                                where: { id: temaId, evento: { id: eventoId } },
                            })];
                    case 2:
                        temaValido = _c.sent();
                        if (!temaValido) {
                            throw new common_1.BadRequestException('O tema selecionado nao pertence a este evento ou nao existe.');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Localiza o evento ativo do ano corrente filtrando pela data de início das inscrições.
     */
    ProjetosService.prototype.buscarUltimoEvento = function () {
        return __awaiter(this, void 0, Promise, function () {
            var anoAtual, inicioAno, fimAno, evento;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        anoAtual = new Date().getFullYear();
                        inicioAno = "".concat(anoAtual, "-01-01");
                        fimAno = "".concat(anoAtual, "-12-31");
                        return [4 /*yield*/, this.eventoRepository.findOne({
                                where: {
                                    inscricao: {
                                        inicio: (0, typeorm_2.Between)(inicioAno, fimAno),
                                    },
                                    status: evento_entity_1.EventoStatus.ATIVO
                                },
                                order: {
                                    criadoEm: 'DESC',
                                },
                                relations: ['temas'],
                            })];
                    case 1:
                        evento = _a.sent();
                        if (!evento) {
                            throw new common_1.NotFoundException("Nenhum evento ativo com periodo de inscricao iniciado foi encontrado para o ano de ".concat(anoAtual, "."));
                        }
                        return [2 /*return*/, evento];
                }
            });
        });
    };
    /**
     * Garante que o tamanho da equipe segue as diretrizes acadêmicas (entre 3 e 7 integrantes).
     */
    ProjetosService.prototype.validateGroupSize = function (alunosIds) {
        if (alunosIds === void 0) { alunosIds = []; }
        var total = alunosIds.length + 1; // Soma 1 para contar com o Aluno Autor
        if (total < 3 || total > 7) {
            throw new common_1.BadRequestException('O grupo deve ter entre 3 e 7 integrantes.');
        }
    };
    /**
     * Certifica-se de que nenhum dos alunos enviados já está alocado em outro projeto no evento atual.
     */
    ProjetosService.prototype.ensureAlunosAreAvailable = function (eventoId, todosIds) {
        return __awaiter(this, void 0, void 0, function () {
            var ocupados, nomes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.projetoAlunoRepository.find({
                            where: {
                                aluno: { id: (0, typeorm_2.In)(todosIds) },
                                projeto: { evento: { id: eventoId } },
                            },
                            relations: ['aluno'],
                        })];
                    case 1:
                        ocupados = _a.sent();
                        if (ocupados.length > 0) {
                            nomes = ocupados.map(function (p) { return p.aluno.nome; }).join(', ');
                            throw new common_1.BadRequestException("Alunos ja vinculados a este evento: ".concat(nomes));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Salva o registro inicial da entidade de Projetos.
     */
    ProjetosService.prototype.saveProjeto = function (qr, dto, autorId, eventoId) {
        return __awaiter(this, void 0, Promise, function () {
            var projeto;
            return __generator(this, function (_a) {
                projeto = qr.manager.create(projeto_entity_1.Projeto, {
                    titulo: dto.titulo,
                    descricao: dto.descricao,
                    temaId: dto.temaId,
                    evento: { id: eventoId },
                    alunoAutor: { id: autorId },
                });
                return [2 /*return*/, qr.manager.save(projeto)];
            });
        });
    };
    /**
     * Associa os integrantes convidados à tabela pivot do projeto, limpando duplicatas.
     */
    ProjetosService.prototype.saveParticipantes = function (qr, projetoId, convidadosIds, autorId) {
        if (convidadosIds === void 0) { convidadosIds = []; }
        return __awaiter(this, void 0, void 0, function () {
            var participantesApenas, idsUnicos, vinculos;
            return __generator(this, function (_a) {
                participantesApenas = convidadosIds.filter(function (id) { return id !== autorId; });
                idsUnicos = __spreadArray([], new Set(participantesApenas), true);
                if (idsUnicos.length === 0)
                    return [2 /*return*/, []];
                vinculos = idsUnicos.map(function (id) {
                    return qr.manager.create(projeto_aluno_entity_1.ProjetoAluno, {
                        projeto: { id: projetoId },
                        aluno: { id: id },
                    });
                });
                return [2 /*return*/, qr.manager.save(vinculos)];
            });
        });
    };
    ProjetosService.prototype.getUltimoProjetoDoAluno = function (userId) {
        return __awaiter(this, void 0, Promise, function () {
            var projeto;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.projetoRepository.findOne({
                            where: { alunoAutor: { id: userId } },
                            order: { criadoEm: 'DESC' },
                            relations: ['evento', 'tema'],
                        })];
                    case 1:
                        projeto = _a.sent();
                        if (!projeto) {
                            throw new common_1.NotFoundException('Voce ainda nao possui nenhum projeto cadastrado.');
                        }
                        return [2 /*return*/, projeto];
                }
            });
        });
    };
    ProjetosService.prototype.verificarSeEProfessor = function (id) {
        return __awaiter(this, void 0, Promise, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userRepository.findOne({
                            where: { id: id, role_cargo: user_entity_1.UserRole.ORIENTADOR },
                        })];
                    case 1:
                        user = _a.sent();
                        return [2 /*return*/, !!user];
                }
            });
        });
    };
    ProjetosService.prototype.validarTemaNoEvento = function (temaId, eventoId) {
        return __awaiter(this, void 0, void 0, function () {
            var existe;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.temaEventoRepository.exists({
                            where: { id: temaId, evento: { id: eventoId } },
                        })];
                    case 1:
                        existe = _a.sent();
                        if (!existe) {
                            throw new common_1.BadRequestException('O tema do projeto nao esta disponivel para este evento.');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ProjetosService.prototype.validarOrientadorSelecionouTema = function (temaId, orientadorId) {
        return __awaiter(this, void 0, void 0, function () {
            var orientadorEscolheuTema;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.temaEventoRepository
                            .createQueryBuilder('tema')
                            .innerJoin('tema.orientadores', 'orientador', 'orientador.id = :orientadorId', { orientadorId: orientadorId })
                            .where('tema.id = :temaId', { temaId: temaId })
                            .getExists()];
                    case 1:
                        orientadorEscolheuTema = _a.sent();
                        if (!orientadorEscolheuTema) {
                            throw new common_1.BadRequestException('Este orientador nao selecionou o eixo tematico do projeto.');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ProjetosService.prototype.validarSolicitacaoDuplicada = function (projetoId, orientadorId) {
        return __awaiter(this, void 0, void 0, function () {
            var solicitacao, mensagensErro, erro;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.projetoOrientadorRepository.findOne({
                            where: { projeto: { id: projetoId }, orientador: { id: orientadorId } },
                        })];
                    case 1:
                        solicitacao = _a.sent();
                        if (!solicitacao)
                            return [2 /*return*/];
                        mensagensErro = {
                            pendente: 'Ja existe uma solicitacao pendente para este orientador.',
                            aceito: 'Este orientador ja aceitou orientar este projeto.',
                        };
                        erro = mensagensErro[solicitacao.status];
                        if (erro)
                            throw new common_1.BadRequestException(erro);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Centraliza a filtragem de orientadores de um projeto para expor apenas os aceitos.
     */
    ProjetosService.prototype.filtrarOrientadoresAceitos = function (projeto) {
        if (projeto.orientadores) {
            projeto.orientadores = projeto.orientadores.filter(function (relacao) { return relacao.status === 'aceito'; });
        }
        else {
            projeto.orientadores = [];
        }
    };
    // =========================================================================
    // MAPEAMENTO DE CONFIGURAÇÕES DE RELACIONAMENTO E CAMPOS (SELECT/RELATIONS)
    // =========================================================================
    ProjetosService.prototype.getProjetoRelations = function () {
        return {
            evento: true,
            alunoAutor: true,
            tema: true,
            projetoAlunos: { aluno: true },
            orientadores: { orientador: true },
            materiais: true,
        };
    };
    ProjetosService.prototype.getProjetoSelectFields = function () {
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
            materiais: {
                id: true,
                tipo: true,
                status: true,
                conteudo: true,
                opiniao: true,
                criadoEm: true,
            },
        };
    };
    ProjetosService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, typeorm_1.InjectRepository)(projeto_entity_1.Projeto)),
        __param(1, (0, typeorm_1.InjectRepository)(projeto_aluno_entity_1.ProjetoAluno)),
        __param(2, (0, typeorm_1.InjectRepository)(projeto_orientador_entity_1.ProjetoOrientador)),
        __param(3, (0, typeorm_1.InjectRepository)(tema_evento_entity_1.TemaEvento)),
        __param(4, (0, typeorm_1.InjectRepository)(evento_entity_1.Evento)),
        __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User))
    ], ProjetosService);
    return ProjetosService;
}());
exports.ProjetosService = ProjetosService;
