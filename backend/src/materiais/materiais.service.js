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
exports.MateriaisService = void 0;
// src/materiais/materiais.service.ts
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var fs = require("fs");
var projeto_material_entity_1 = require("./entities/projeto-material.entity");
var projeto_entity_1 = require("../projetos/entities/projeto.entity");
var MateriaisService = /** @class */ (function () {
    function MateriaisService(materiaisRepository, projetoRepository, pdfService) {
        this.materiaisRepository = materiaisRepository;
        this.projetoRepository = projetoRepository;
        this.pdfService = pdfService;
    }
    /**
     * Orquestra o fluxo de gerenciamento de materiais acadêmicos.
     * Identifica automaticamente se a requisição se trata de uma primeira entrega ou de uma substituição.
     *
     * @param file Arquivo binário opcional enviado via interceptor (Multer).
     * @param dto Dados de transferência contendo o ID do projeto, tipo e conteúdo do material.
     * @param userId ID do aluno autenticado realizando a ação.
     * @returns Resposta padronizada com o status do processamento local e na nuvem.
     */
    MateriaisService.prototype.criarMaterial = function (file, dto, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var projetoIdNum, projeto, materialExistente;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        projetoIdNum = Number(dto.projetoId);
                        return [4 /*yield*/, this.buscarEValidarProjeto(projetoIdNum, file)];
                    case 1:
                        projeto = _a.sent();
                        this.validarPayloadPorTipo(dto.tipo, dto.conteudo, file);
                        return [4 /*yield*/, this.materiaisRepository.findOne({
                                where: { projeto: { id: projetoIdNum }, tipo: dto.tipo },
                            })];
                    case 2:
                        materialExistente = _a.sent();
                        // 3. Desvia o fluxo baseado na existência do material (Substituição vs Criação)
                        if (materialExistente) {
                            return [2 /*return*/, this.processarSubstituicaoMaterial(materialExistente, projeto, file, dto, userId)];
                        }
                        return [2 /*return*/, this.processarCriacaoMaterial(projeto, file, dto, userId)];
                }
            });
        });
    };
    /**
     * Permite ao aluno cancelar o envio de um material acadêmico feito por engano.
     * Valida se a entrega ainda está em análise e se foi realizada há menos de 1 hora.
     * Remove de forma limpa o registro e expurga o arquivo binário do Google Drive.
     *
     * @param materialId ID numérico do material a ser cancelado.
     * @returns Resposta de confirmação da remoção.
     */
    MateriaisService.prototype.cancelarMaterial = function (materialId) {
        return __awaiter(this, void 0, Promise, function () {
            var material, agora, tempoDecorridoMs, umaHoraMs, arquivoBanco, driveError_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.materiaisRepository.findOne({
                            where: { id: materialId },
                        })];
                    case 1:
                        material = _a.sent();
                        if (!material) {
                            throw new common_1.NotFoundException("Material com ID ".concat(materialId, " n\u00E3o foi encontrado."));
                        }
                        // 2. Impede o cancelamento caso o orientador já tenha alterado o status (aprovado/recusado)
                        if (material.status !== projeto_material_entity_1.StatusMaterial.EM_ANALISE) {
                            throw new common_1.ConflictException("Este material n\u00E3o pode ser cancelado pois j\u00E1 foi avaliado ou est\u00E1 com status '".concat(material.status, "'."));
                        }
                        agora = new Date();
                        tempoDecorridoMs = agora.getTime() - new Date(material.criadoEm).getTime();
                        umaHoraMs = 1000 * 60 * 60;
                        if (tempoDecorridoMs > umaHoraMs) {
                            throw new common_1.BadRequestException('O prazo limite de 1 hora para o cancelamento deste material expirou.');
                        }
                        if (!this.verificarSeTipoExigeArquivo(material.tipo)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.pdfService.projectFileRepository.findOne({
                                where: { materialId: material.id },
                                order: { criadoEm: 'DESC' },
                            })];
                    case 2:
                        arquivoBanco = _a.sent();
                        if (!(arquivoBanco && arquivoBanco.driveFileId)) return [3 /*break*/, 8];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        // Acessa dinamicamente a propriedade privada ou instanciada do googleDriveService contida no PdfService
                        return [4 /*yield*/, this.pdfService['googleDriveService'].deleteFile(arquivoBanco.driveFileId)];
                    case 4:
                        // Acessa dinamicamente a propriedade privada ou instanciada do googleDriveService contida no PdfService
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        driveError_1 = _a.sent();
                        return [3 /*break*/, 6];
                    case 6: 
                    // Remove os metadados do arquivo atrelado
                    return [4 /*yield*/, this.pdfService.projectFileRepository.remove(arquivoBanco)];
                    case 7:
                        // Remove os metadados do arquivo atrelado
                        _a.sent();
                        _a.label = 8;
                    case 8: 
                    // 5. Deleta definitivamente o material da tabela
                    return [4 /*yield*/, this.materiaisRepository.remove(material)];
                    case 9:
                        // 5. Deleta definitivamente o material da tabela
                        _a.sent();
                        return [2 /*return*/, {
                                mensagem: 'Entrega do material cancelada e removida com sucesso.',
                            }];
                }
            });
        });
    };
    // =========================================================================
    // MÉTODOS PRIVADOS DE FLUXO DE NEGÓCIO (CORE LOGIC)
    // =========================================================================
    /**
     * Trata o fluxo de reentrega de um material que foi previamente recusado pelo orientador.
     */
    MateriaisService.prototype.processarSubstituicaoMaterial = function (material, projeto, file, dto, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var materialAtualizado, dadosArquivoDrive, possuiArquivoNoBanco, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Se o material existente não estiver recusado, ele não pode ser alterado
                        if (material.status !== projeto_material_entity_1.StatusMaterial.RECUSADO) {
                            this.removerArquivoTemporario(file);
                            throw new common_1.ConflictException("J\u00E1 existe um material do tipo '".concat(dto.tipo, "' pendente de an\u00E1lise ou j\u00E1 aprovado."));
                        }
                        // Reseta o estado do material para nova análise institucional
                        material.status = projeto_material_entity_1.StatusMaterial.EM_ANALISE;
                        material.opiniao = 'Aguardando avaliação da nova versão do material pelo orientador.';
                        material.conteudo = dto.conteudo || "Arquivo ".concat(dto.tipo, " atualizado enviado para avalia\u00E7\u00E3o.");
                        return [4 /*yield*/, this.materiaisRepository.save(material)];
                    case 1:
                        materialAtualizado = _a.sent();
                        if (!(this.verificarSeTipoExigeArquivo(dto.tipo) && file)) return [3 /*break*/, 10];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 8, , 10]);
                        dadosArquivoDrive = void 0;
                        return [4 /*yield*/, this.pdfService.projectFileRepository.findOne({
                                where: { materialId: materialAtualizado.id },
                                order: { criadoEm: 'DESC' }
                            })];
                    case 3:
                        possuiArquivoNoBanco = _a.sent();
                        if (!(possuiArquivoNoBanco && possuiArquivoNoBanco.driveFileId)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.pdfService.substituirProjectPdf(file, {
                                materialId: materialAtualizado.id,
                                projetoId: projeto.id,
                                uploadedBy: userId,
                            })];
                    case 4:
                        dadosArquivoDrive = _a.sent();
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, this.pdfService.uploadExistingProjectPdf(file, {
                            materialId: materialAtualizado.id,
                            projetoId: projeto.id,
                            uploadedBy: userId,
                        })];
                    case 6:
                        // SE não possuía ou estava quebrado, faz uma nova postagem do zero (Fallback seguro)
                        dadosArquivoDrive = _a.sent();
                        _a.label = 7;
                    case 7: return [2 /*return*/, {
                            mensagem: 'Nova versão do arquivo PDF substituída e enviada com sucesso!',
                            material: materialAtualizado,
                            arquivo: dadosArquivoDrive,
                        }];
                    case 8:
                        error_1 = _a.sent();
                        return [4 /*yield*/, this.tratarFalhaEnvioDrive(materialAtualizado, "Falha na substitui\u00E7\u00E3o do arquivo na nuvem: ".concat(error_1.message))];
                    case 9:
                        _a.sent();
                        throw new common_1.BadRequestException('Material updated locally, but disk or cloud substitution failed.');
                    case 10: return [2 /*return*/, {
                            mensagem: 'Link do material atualizado com sucesso!',
                            material: materialAtualizado,
                        }];
                }
            });
        });
    };
    /**
     * Trata o fluxo de primeira entrega de um material para o projeto.
     */
    MateriaisService.prototype.processarCriacaoMaterial = function (projeto, file, dto, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var novoMaterial, materialSalvo, dadosArquivoDrive, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Valida o teto regulamentar de entregas do projeto
                    return [4 /*yield*/, this.validarLimiteMaximoMateriais(projeto.id, file)];
                    case 1:
                        // Valida o teto regulamentar de entregas do projeto
                        _a.sent();
                        novoMaterial = this.materiaisRepository.create({
                            projeto: projeto,
                            tipo: dto.tipo,
                            status: projeto_material_entity_1.StatusMaterial.EM_ANALISE,
                            conteudo: dto.conteudo || "Arquivo ".concat(dto.tipo, " enviado para avalia\u00E7\u00E3o."),
                            opiniao: 'Aguardando avaliação do orientador.',
                        });
                        return [4 /*yield*/, this.materiaisRepository.save(novoMaterial)];
                    case 2:
                        materialSalvo = _a.sent();
                        if (!(this.verificarSeTipoExigeArquivo(dto.tipo) && file)) return [3 /*break*/, 7];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 7]);
                        return [4 /*yield*/, this.pdfService.uploadExistingProjectPdf(file, {
                                materialId: materialSalvo.id,
                                projetoId: projeto.id,
                                uploadedBy: userId,
                            })];
                    case 4:
                        dadosArquivoDrive = _a.sent();
                        return [2 /*return*/, {
                                mensagem: 'Material e arquivo PDF salvos com sucesso!',
                                material: materialSalvo,
                                arquivo: dadosArquivoDrive,
                            }];
                    case 5:
                        error_2 = _a.sent();
                        return [4 /*yield*/, this.tratarFalhaEnvioDrive(materialSalvo, "Falha cr\u00EDtica de upload: ".concat(error_2.message))];
                    case 6:
                        _a.sent();
                        throw new common_1.BadRequestException('Material criado localmente, mas o envio ao Drive failed.');
                    case 7: return [2 /*return*/, {
                            mensagem: 'Material do tipo link registrado com sucesso!',
                            material: materialSalvo,
                        }];
                }
            });
        });
    };
    // =========================================================================
    // MÉTODOS PRIVADOS DE VALIDAÇÃO E SUPORTE (HELPERS)
    // =========================================================================
    /**
     * Garante a existência do projeto alvo no banco de dados.
     */
    MateriaisService.prototype.buscarEValidarProjeto = function (projetoId, file) {
        return __awaiter(this, void 0, Promise, function () {
            var projeto;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.projetoRepository.findOne({ where: { id: projetoId } })];
                    case 1:
                        projeto = _a.sent();
                        if (!projeto) {
                            this.removerArquivoTemporario(file);
                            throw new common_1.NotFoundException("Projeto com ID ".concat(projetoId, " n\u00E3o foi encontrado."));
                        }
                        return [2 /*return*/, projeto];
                }
            });
        });
    };
    /**
     * Aplica as regras de integridade do payload de acordo com a categoria do material entregue.
     */
    MateriaisService.prototype.validarPayloadPorTipo = function (tipo, conteudo, file) {
        if (tipo === projeto_material_entity_1.TipoMaterial.LINK && !conteudo) {
            throw new common_1.BadRequestException('Para materiais do tipo link, o campo conteúdo (URL) é obrigatório.');
        }
        if (this.verificarSeTipoExigeArquivo(tipo) && !file) {
            throw new common_1.BadRequestException("O envio do arquivo f\u00EDsico PDF \u00E9 obrigat\u00F3rio para o tipo '".concat(tipo, "'."));
        }
    };
    /**
     * Valida se o projeto respeita a restrição acadêmica de no máximo 3 entregas de materiais.
     */
    MateriaisService.prototype.validarLimiteMaximoMateriais = function (projetoId, file) {
        return __awaiter(this, void 0, Promise, function () {
            var totalMateriais;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.materiaisRepository.count({
                            where: { projeto: { id: projetoId } },
                        })];
                    case 1:
                        totalMateriais = _a.sent();
                        if (totalMateriais >= 3) {
                            this.removerArquivoTemporario(file);
                            throw new common_1.BadRequestException('Este projeto já atingiu o limite máximo de 3 materiais entregues.');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Determina de forma centralizada se um determinado tipo de material exige persistência de arquivo físico.
     */
    MateriaisService.prototype.verificarSeTipoExigeArquivo = function (tipo) {
        return tipo === projeto_material_entity_1.TipoMaterial.PDF || tipo === projeto_material_entity_1.TipoMaterial.RELATORIO;
    };
    /**
     * Executa o rollback parcial de status caso ocorra um erro de comunicação com a API do Google Drive.
     */
    MateriaisService.prototype.tratarFalhaEnvioDrive = function (material, motivoErro) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        material.status = projeto_material_entity_1.StatusMaterial.RECUSADO;
                        material.opiniao = motivoErro;
                        return [4 /*yield*/, this.materiaisRepository.save(material)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove arquivos órfãos do armazenamento local temporário para evitar desperdício de espaço em disco.
     */
    MateriaisService.prototype.removerArquivoTemporario = function (file) {
        if (file && file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
    };
    MateriaisService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, typeorm_1.InjectRepository)(projeto_material_entity_1.ProjetoMaterial)),
        __param(1, (0, typeorm_1.InjectRepository)(projeto_entity_1.Projeto))
    ], MateriaisService);
    return MateriaisService;
}());
exports.MateriaisService = MateriaisService;
