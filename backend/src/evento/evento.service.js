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
exports.EventoService = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var typeorm_2 = require("typeorm");
var evento_entity_1 = require("./entities/evento.entity");
var tema_evento_entity_1 = require("./entities/tema-evento.entity");
var user_entity_1 = require("../users/entities/user.entity");
var EventoService = /** @class */ (function () {
    function EventoService(eventoRepository, temaRepository, userRepository) {
        this.eventoRepository = eventoRepository;
        this.temaRepository = temaRepository;
        this.userRepository = userRepository;
    }
    EventoService.prototype.create = function (createEventoDto) {
        return __awaiter(this, void 0, void 0, function () {
            var novoEvento;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        novoEvento = this.eventoRepository.create(createEventoDto);
                        return [4 /*yield*/, this.eventoRepository.save(novoEvento)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    EventoService.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.eventoRepository.find({
                            relations: ['temas'],
                            order: { criadoEm: 'DESC' }
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    EventoService.prototype.findOne = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var evento;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.eventoRepository.findOne({
                            where: { id: id },
                            relations: ['temas', 'coordenador'],
                        })];
                    case 1:
                        evento = _a.sent();
                        if (!evento) {
                            throw new common_1.NotFoundException("Evento com ID ".concat(id, " n\u00E3o encontrado"));
                        }
                        return [2 /*return*/, evento];
                }
            });
        });
    };
    EventoService.prototype.update = function (id, updateEventoDto) {
        return __awaiter(this, void 0, void 0, function () {
            var evento;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findOne(id)];
                    case 1:
                        evento = _a.sent();
                        // O merge funciona com Value Objects, mas certifique-se de que o DTO 
                        // envie o objeto de período completo ou o TypeORM pode sobrescrever com null
                        this.eventoRepository.merge(evento, updateEventoDto);
                        return [4 /*yield*/, this.eventoRepository.save(evento)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    EventoService.prototype.remove = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var evento;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findOne(id)];
                    case 1:
                        evento = _a.sent();
                        evento.status = evento_entity_1.EventoStatus.INATIVO; // Muda o status
                        return [4 /*yield*/, this.eventoRepository.save(evento)];
                    case 2:
                        _a.sent(); // Salva a alteração
                        return [2 /*return*/, { message: "Evento ".concat(id, " desativado com sucesso.") }];
                }
            });
        });
    };
    EventoService.prototype.addTemas = function (eventoId, createTemasDto) {
        return __awaiter(this, void 0, void 0, function () {
            var evento, novosTemas;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findOne(eventoId)];
                    case 1:
                        evento = _a.sent();
                        novosTemas = createTemasDto.nomes.map(function (nome) {
                            return _this.temaRepository.create({
                                nome: nome,
                                evento: evento,
                            });
                        });
                        return [4 /*yield*/, this.temaRepository.save(novosTemas)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // modulos/eventos/evento.service.ts
    EventoService.prototype.findProfessoresPorTema = function (temaId) {
        return __awaiter(this, void 0, void 0, function () {
            var tema;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.temaRepository.findOne({
                            where: { id: temaId },
                            relations: ['orientadores'], // Carrega os usuários vinculados a este tema
                        })];
                    case 1:
                        tema = _a.sent();
                        if (!tema) {
                            throw new common_1.NotFoundException("Tema com ID ".concat(temaId, " n\u00E3o encontrado"));
                        }
                        // Retorna apenas a lista de orientadores vinculados
                        return [2 /*return*/, tema.orientadores];
                }
            });
        });
    };
    /**
     * Busca o evento mais recente do ano vigente.
     * Ajustado para lidar com o tipo 'date' puro.
     */
    EventoService.prototype.eventoAtual = function () {
        return __awaiter(this, void 0, void 0, function () {
            var anoAtual, inicioAno, fimAno;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        anoAtual = new Date().getFullYear();
                        inicioAno = "".concat(anoAtual, "-01-01");
                        fimAno = "".concat(anoAtual, "-12-31");
                        return [4 /*yield*/, this.eventoRepository.findOne({
                                where: {
                                    // Agora usamos apenas a string da data, pois o banco é tipo 'date'
                                    prazoInicial: (0, typeorm_2.Between)(inicioAno, fimAno),
                                    status: evento_entity_1.EventoStatus.ATIVO
                                },
                                order: {
                                    criadoEm: 'DESC',
                                },
                                relations: ['temas'],
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    EventoService.prototype.sincronizarTemas = function (professorId, temasIds) {
        return __awaiter(this, void 0, void 0, function () {
            var professor, novosTemas;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userRepository.findOne({
                            where: { id: professorId },
                            relations: ['temasSelecionados']
                        })];
                    case 1:
                        professor = _a.sent();
                        if (!professor || professor.role_cargo !== user_entity_1.UserRole.ORIENTADOR) {
                            throw new common_1.BadRequestException('Orientador não encontrado ou cargo inválido.');
                        }
                        return [4 /*yield*/, this.temaRepository.findBy({
                                id: (0, typeorm_2.In)(temasIds)
                            })];
                    case 2:
                        novosTemas = _a.sent();
                        // 🚀 NOVA VALIDAÇÃO: Garante o piso mínimo de 4 temas válidos
                        if (novosTemas.length < 4) {
                            throw new common_1.BadRequestException("Voc\u00EA precisa selecionar no m\u00EDnimo 4 temas v\u00E1lidos. (Selecionados: ".concat(novosTemas.length, ")"));
                        }
                        professor.temasSelecionados = novosTemas;
                        return [4 /*yield*/, this.userRepository.save(professor)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, {
                                message: 'Temas sincronizados com sucesso',
                                totalSelecionado: novosTemas.length
                            }];
                }
            });
        });
    };
    EventoService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, typeorm_1.InjectRepository)(evento_entity_1.Evento)),
        __param(1, (0, typeorm_1.InjectRepository)(tema_evento_entity_1.TemaEvento)),
        __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User))
    ], EventoService);
    return EventoService;
}());
exports.EventoService = EventoService;
