"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
exports.GoogleDriveService = void 0;
// src/pdf/google-drive.service.ts
var common_1 = require("@nestjs/common");
var googleapis_1 = require("googleapis");
var GoogleDriveService = /** @class */ (function () {
    function GoogleDriveService() {
        var clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
        var clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
        var refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
        if (!clientId || !clientSecret || !refreshToken) {
            throw new Error('Erro: As variáveis GOOGLE_DRIVE_CLIENT_ID, CLIENT_SECRET ou REFRESH_TOKEN não foram totalmente definidas no .env');
        }
        // Configura o cliente OAuth2 usando as credenciais do seu console Google Cloud
        var oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
        // Passa o Refresh Token para que a biblioteca renove o Access Token em segundo plano automaticamente
        oauth2Client.setCredentials({
            refresh_token: refreshToken,
        });
        // Instancia o Drive usando a autenticação do seu usuário pessoal
        this.drive = googleapis_1.google.drive({ version: 'v3', auth: oauth2Client });
    }
    GoogleDriveService.prototype.uploadFile = function (fileName, fileStream, mimeType, parentFolderId) {
        return __awaiter(this, void 0, void 0, function () {
            var folderId, fileMetadata, media, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        folderId = parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
                        fileMetadata = {
                            name: fileName,
                            parents: folderId ? [folderId] : [], // Garante que vai para a pasta correta se o ID existir
                        };
                        media = {
                            mimeType: mimeType,
                            body: fileStream,
                        };
                        return [4 /*yield*/, this.drive.files.create({
                                requestBody: fileMetadata,
                                media: media,
                                fields: 'id, webViewLink',
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, {
                                id: response.data.id,
                                webViewLink: response.data.webViewLink,
                            }];
                }
            });
        });
    };
    /**
   * Obtém o Stream de um arquivo do Google Drive para download
   * @param driveFileId ID do arquivo na nuvem do Google
   */
    GoogleDriveService.prototype.downloadFileStream = function (driveFileId) {
        return __awaiter(this, void 0, Promise, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.drive.files.get({
                                fileId: driveFileId,
                                alt: 'media', // Informa à API que queremos o conteúdo binário do arquivo, não os metadados
                            }, { responseType: 'stream' })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_1 = _a.sent();
                        throw new Error("Erro ao buscar stream no Google Drive: ".concat(error_1.message));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GoogleDriveService.prototype.updateFile = function (driveFileId, fileName, fileStream, mimeType) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.drive.files.update({
                                fileId: driveFileId,
                                requestBody: {
                                    name: fileName, // Mantém ou atualiza o nome padrão padrãoizado
                                },
                                media: {
                                    mimeType: mimeType,
                                    body: fileStream,
                                },
                                fields: 'id, webViewLink',
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, {
                                id: response.data.id,
                                webViewLink: response.data.webViewLink,
                            }];
                    case 2:
                        error_2 = _a.sent();
                        throw new Error("Erro ao atualizar arquivo no Google Drive: ".concat(error_2.message));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove permanentemente um arquivo da nuvem do Google Drive
     * @param driveFileId ID do arquivo a ser deletado
     */
    GoogleDriveService.prototype.deleteFile = function (driveFileId) {
        return __awaiter(this, void 0, Promise, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.drive.files.delete({
                                fileId: driveFileId,
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        throw new Error("Erro ao deletar arquivo no Google Drive: ".concat(error_3.message));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GoogleDriveService = __decorate([
        (0, common_1.Injectable)()
    ], GoogleDriveService);
    return GoogleDriveService;
}());
exports.GoogleDriveService = GoogleDriveService;
