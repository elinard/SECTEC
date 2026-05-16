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
exports.OrientacoesService = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var projeto_orientador_entity_1 = require("./entities/projeto-orientador.entity");
var OrientacoesService = /** @class */ (function () {
    function OrientacoesService(orientacoesRepository) {
        this.orientacoesRepository = orientacoesRepository;
    }
    OrientacoesService.prototype.findMinhasPendentes = function (orientadorId) {
        return __awaiter(this, void 0, Promise, function () {
            var anoAtual;
            return __generator(this, function (_a) {
                anoAtual = new Date().getFullYear();
                return [2 /*return*/, this.orientacoesRepository.createQueryBuilder('projetoOrientador')
                        .leftJoinAndSelect('projetoOrientador.orientador', 'orientador')
                        .leftJoinAndSelect('projetoOrientador.projeto', 'projeto')
                        .leftJoinAndSelect('projeto.evento', 'evento')
                        .leftJoinAndSelect('projeto.tema', 'tema')
                        .leftJoinAndSelect('projeto.alunoAutor', 'alunoAutor')
                        .leftJoinAndSelect('projeto.projetoAlunos', 'projetoAlunos')
                        .leftJoinAndSelect('projetoAlunos.aluno', 'aluno')
                        // 1. Filtros básicos: id do orientador e status pendente
                        .where('orientador.id = :orientadorId', { orientadorId: orientadorId })
                        .andWhere('projetoOrientador.status = :statusPendente', { statusPendente: projeto_orientador_entity_1.StatusOrientacao.PENDENTE })
                        // 2. FILTRO DO ANO ATUAL: Filtra pelo status ATIVO do evento e garante que ele está no range do ano corrente
                        // Usamos o formato do banco (Y-m-d) igual ao seu ProjetosService
                        .andWhere('evento.status = :eventoStatus', { eventoStatus: 'ativo' }) // Ajuste para o seu Enum se necessário (ex: EventoStatus.ATIVO)
                        .andWhere('evento.prazoInicial BETWEEN :inicioAno AND :fimAno', {
                        inicioAno: "".concat(anoAtual, "-01-01"),
                        fimAno: "".concat(anoAtual, "-12-31"),
                    })
                        // 3. Validação de concorrência (Se outra pessoa já aceitou, limpa da lista)
                        .andWhere(function (qb) {
                        var subQuery = qb
                            .subQuery()
                            .select('1')
                            .from(projeto_orientador_entity_1.ProjetoOrientador, 'subPo')
                            .where('subPo.projeto_id = projeto.id')
                            .andWhere('subPo.status = :statusAceito', { statusAceito: projeto_orientador_entity_1.StatusOrientacao.ACEITO })
                            .getQuery();
                        return "NOT EXISTS ".concat(subQuery);
                    })
                        .getMany()];
            });
        });
    };
    OrientacoesService.prototype.findMinhasOrientacoes = function (orientadorId) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.orientacoesRepository.find({
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
                    })];
            });
        });
    };
    OrientacoesService.prototype.responder = function (id, orientadorId, dto) {
        return __awaiter(this, void 0, Promise, function () {
            var orientacao, jaPossuiOrientador;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.orientacoesRepository.findOne({
                            where: { id: id },
                            relations: [
                                'projeto',
                                'projeto.evento',
                                'projeto.tema',
                                'projeto.alunoAutor',
                                'projeto.projetoAlunos',
                                'projeto.projetoAlunos.aluno',
                                'orientador',
                            ],
                        })];
                    case 1:
                        orientacao = _a.sent();
                        if (!orientacao) {
                            throw new common_1.NotFoundException('Orientação não encontrada');
                        }
                        if (orientacao.orientador.id !== orientadorId) {
                            throw new common_1.ForbiddenException('Você não pode responder esta orientação');
                        }
                        if (orientacao.status !== projeto_orientador_entity_1.StatusOrientacao.PENDENTE) {
                            throw new common_1.BadRequestException('Esta orientação já foi respondida');
                        }
                        if (!(dto.action === projeto_orientador_entity_1.StatusOrientacao.ACEITO)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.orientacoesRepository.exists({
                                where: {
                                    projeto: { id: orientacao.projeto.id },
                                    status: projeto_orientador_entity_1.StatusOrientacao.ACEITO,
                                },
                            })];
                    case 2:
                        jaPossuiOrientador = _a.sent();
                        if (jaPossuiOrientador) {
                            throw new common_1.BadRequestException('Este projeto já foi aceito por outro orientador.');
                        }
                        // Se passou na checagem, recusa todas as outras solicitações pendentes deste projeto
                        return [4 /*yield*/, this.orientacoesRepository
                                .createQueryBuilder()
                                .update(projeto_orientador_entity_1.ProjetoOrientador)
                                .set({ status: projeto_orientador_entity_1.StatusOrientacao.RECUSADO, respondidoEm: new Date() })
                                .where('projeto_id = :projetoId', { projetoId: orientacao.projeto.id })
                                .andWhere('status = :status', { status: projeto_orientador_entity_1.StatusOrientacao.PENDENTE })
                                .andWhere('id != :id', { id: orientacao.id })
                                .execute()];
                    case 3:
                        // Se passou na checagem, recusa todas as outras solicitações pendentes deste projeto
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        // Atualiza o status da solicitação atual
                        orientacao.status = dto.action;
                        orientacao.respondidoEm = new Date();
                        return [2 /*return*/, this.orientacoesRepository.save(orientacao)];
                }
            });
        });
    };
    OrientacoesService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, typeorm_1.InjectRepository)(projeto_orientador_entity_1.ProjetoOrientador))
    ], OrientacoesService);
    return OrientacoesService;
}());
exports.OrientacoesService = OrientacoesService;
