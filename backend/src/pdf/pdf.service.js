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
exports.PdfService = void 0;
// src/pdf/pdf.service.ts
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var crypto = require("crypto");
var fs = require("fs");
var path_1 = require("path");
var projeto_entity_1 = require("../projetos/entities/projeto.entity");
var project_file_entity_1 = require("./entities/project-file.entity");
var PdfService = /** @class */ (function () {
    function PdfService(projectFileRepository, projetoRepository, googleDriveService) {
        this.projectFileRepository = projectFileRepository;
        this.projetoRepository = projetoRepository;
        this.googleDriveService = googleDriveService;
    }
    // =========================================================================
    // GESTÃO DE UPLOAD (MÉTODOS CORE)
    // =========================================================================
    /**
     * Realiza o upload do PDF de um projeto existente para o Google Drive.
     * Renomeia o arquivo seguindo o padrão institucional (ANO-MES-TITULO-ID.pdf),
     * calcula o hash SHA-256 de segurança e limpa o armazenamento local após o término.
     */
    PdfService.prototype.uploadExistingProjectPdf = function (file, dto) {
        return __awaiter(this, void 0, Promise, function () {
            var filePath, fileSizeBytes, originalName, projeto, hoje, ano, mes, tituloProjetoClean, extensao, novoNomeDrive, checksumSha256, projectFile, savedFile, fileStream, driveResponse, uploadError_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filePath = file.path;
                        fileSizeBytes = file.size;
                        originalName = file.originalname;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 11, 12]);
                        return [4 /*yield*/, this.projetoRepository.findOne({ where: { id: dto.projetoId } })];
                    case 2:
                        projeto = _a.sent();
                        if (!projeto) {
                            throw new common_1.NotFoundException("Projeto com ID ".concat(dto.projetoId, " nao foi encontrado."));
                        }
                        hoje = new Date();
                        ano = hoje.getFullYear();
                        mes = String(hoje.getMonth() + 1).padStart(2, '0');
                        tituloProjetoClean = projeto.titulo.replace(/\s+/g, '-');
                        extensao = (0, path_1.extname)(originalName);
                        novoNomeDrive = "".concat(ano, "-").concat(mes, "-").concat(tituloProjetoClean, "-").concat(dto.projetoId).concat(extensao);
                        return [4 /*yield*/, this.calculateFileHash(filePath)];
                    case 3:
                        checksumSha256 = _a.sent();
                        projectFile = this.projectFileRepository.create({
                            materialId: dto.materialId,
                            projetoId: dto.projetoId,
                            uploadedBy: dto.uploadedBy,
                            originalName: originalName,
                            driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
                            fileSizeBytes: fileSizeBytes,
                            checksumSha256: checksumSha256,
                            status: project_file_entity_1.FileStatus.PENDING,
                            version: 1,
                        });
                        return [4 /*yield*/, this.projectFileRepository.save(projectFile)];
                    case 4:
                        savedFile = _a.sent();
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 8, , 10]);
                        fileStream = fs.createReadStream(filePath);
                        return [4 /*yield*/, this.googleDriveService.uploadFile(novoNomeDrive, fileStream, file.mimetype, savedFile.driveFolderId)];
                    case 6:
                        driveResponse = _a.sent();
                        savedFile.driveFileId = driveResponse.id || null;
                        savedFile.driveWebViewLink = driveResponse.webViewLink || null;
                        savedFile.status = project_file_entity_1.FileStatus.VALID;
                        return [4 /*yield*/, this.projectFileRepository.save(savedFile)];
                    case 7: return [2 /*return*/, _a.sent()];
                    case 8:
                        uploadError_1 = _a.sent();
                        // Marca o arquivo como corrompido/falho no banco caso o Drive rejeite
                        savedFile.status = project_file_entity_1.FileStatus.CORRUPTED;
                        return [4 /*yield*/, this.projectFileRepository.save(savedFile)];
                    case 9:
                        _a.sent();
                        throw new Error("Falha ao enviar para o Drive: ".concat(uploadError_1.message));
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        // 7. Garante que o arquivo temporário local será apagado, protegendo o storage do ambiente
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                        return [7 /*endfinally*/];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Substitui o binário de um arquivo existente mantendo o mesmo ID do Google Drive.
     * Alinha metadados locais, recalcula hash de integridade e atualiza a versão da entrega.
     */
    // src/pdf/pdf.service.ts
    /**
     * Substitui o binário de um arquivo existente mantendo o mesmo ID do Google Drive.
     * Alinha metadados locais, recalcula hash de integridade e atualiza a versão da entrega.
     */
    PdfService.prototype.substituirProjectPdf = function (file, dto, projeto) {
        return __awaiter(this, void 0, Promise, function () {
            var filePath, fileSizeBytes, originalName, arquivoAntigo, hoje, ano, mes, tituloProjetoClean, extensao, novoNomeDrive, novoChecksum, fileStream, arquivoAtualizado, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filePath = file.path;
                        fileSizeBytes = file.size;
                        originalName = file.originalname;
                        return [4 /*yield*/, this.projectFileRepository.findOne({
                                where: {
                                    projetoId: dto.projetoId,
                                    materialId: dto.materialId,
                                },
                                order: { criadoEm: 'DESC' },
                            })];
                    case 1:
                        arquivoAntigo = _a.sent();
                        if (!arquivoAntigo || !arquivoAntigo.driveFileId) {
                            if (fs.existsSync(filePath))
                                fs.unlinkSync(filePath);
                            throw new common_1.NotFoundException("N\u00E3o foi encontrado nenhum arquivo anterior v\u00E1lido no banco para substituir neste material.");
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, 9, 10]);
                        hoje = new Date();
                        ano = hoje.getFullYear();
                        mes = String(hoje.getMonth() + 1).padStart(2, '0');
                        tituloProjetoClean = projeto.titulo ? projeto.titulo.replace(/\s+/g, '-') : 'projeto';
                        extensao = (0, path_1.extname)(originalName);
                        novoNomeDrive = "".concat(ano, "-").concat(mes, "-").concat(tituloProjetoClean, "-").concat(dto.projetoId).concat(extensao);
                        return [4 /*yield*/, this.calculateFileHash(filePath)];
                    case 3:
                        novoChecksum = _a.sent();
                        fileStream = fs.createReadStream(filePath);
                        // 5. Atualiza o arquivo diretamente no Google Drive
                        return [4 /*yield*/, this.googleDriveService.updateFile(arquivoAntigo.driveFileId, novoNomeDrive, fileStream, file.mimetype)];
                    case 4:
                        // 5. Atualiza o arquivo diretamente no Google Drive
                        _a.sent();
                        // 6. Atualiza os dados do registro no seu banco de dados local
                        return [4 /*yield*/, this.projectFileRepository.update(arquivoAntigo.id, {
                                originalName: originalName,
                                fileSizeBytes: fileSizeBytes,
                                checksumSha256: novoChecksum,
                                uploadedBy: dto.uploadedBy,
                                version: (arquivoAntigo.version || 1) + 1,
                                status: project_file_entity_1.FileStatus.VALID
                            })];
                    case 5:
                        // 6. Atualiza os dados do registro no seu banco de dados local
                        _a.sent();
                        return [4 /*yield*/, this.projectFileRepository.findOne({
                                where: { id: arquivoAntigo.id }
                            })];
                    case 6:
                        arquivoAtualizado = _a.sent();
                        return [2 /*return*/, arquivoAtualizado];
                    case 7:
                        error_1 = _a.sent();
                        // Executa um update cirúrgico apenas no status, ignorando validações de colunas ausentes no objeto
                        return [4 /*yield*/, this.projectFileRepository.update(arquivoAntigo.id, {
                                status: project_file_entity_1.FileStatus.CORRUPTED
                            })];
                    case 8:
                        // Executa um update cirúrgico apenas no status, ignorando validações de colunas ausentes no objeto
                        _a.sent();
                        throw new common_1.BadRequestException("Erro interno no fluxo de substitui\u00E7\u00E3o: ".concat(error_1.message));
                    case 9:
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                        return [7 /*endfinally*/];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    // =========================================================================
    // GESTÃO DE DOWNLOAD e CONSULTA (READ)
    // =========================================================================
    /**
     * Localiza o registro do PDF válido mais recente no banco de dados
     * e retorna o stream de download vindo diretamente do Google Drive.
     */
    PdfService.prototype.downloadProjectPdf = function (projetoId, materialId) {
        return __awaiter(this, void 0, void 0, function () {
            var projectFile, fileStream;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.projectFileRepository.findOne({
                            where: {
                                projetoId: projetoId,
                                materialId: materialId,
                                status: project_file_entity_1.FileStatus.VALID,
                            },
                            order: { criadoEm: 'DESC' },
                        })];
                    case 1:
                        projectFile = _a.sent();
                        if (!projectFile || !projectFile.driveFileId) {
                            throw new common_1.NotFoundException("Nenhum PDF valido foi encontrado para o projeto ID ".concat(projetoId, " e material ID ").concat(materialId, "."));
                        }
                        return [4 /*yield*/, this.googleDriveService.downloadFileStream(projectFile.driveFileId)];
                    case 2:
                        fileStream = _a.sent();
                        return [2 /*return*/, {
                                stream: fileStream,
                                originalName: projectFile.originalName,
                            }];
                }
            });
        });
    };
    // =========================================================================
    // UTILITÁRIOS PRIVADOS (HELPERS)
    // =========================================================================
    PdfService.prototype.calculateFileHash = function (filePath) {
        return new Promise(function (resolve, reject) {
            var hash = crypto.createHash('sha256');
            var stream = fs.createReadStream(filePath);
            stream.on('data', function (chunk) { return hash.update(chunk); });
            stream.on('end', function () { return resolve(hash.digest('hex')); });
            stream.on('error', function (err) { return reject(err); });
        });
    };
    PdfService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, typeorm_1.InjectRepository)(project_file_entity_1.ProjectFile)),
        __param(1, (0, typeorm_1.InjectRepository)(projeto_entity_1.Projeto))
    ], PdfService);
    return PdfService;
}());
exports.PdfService = PdfService;
