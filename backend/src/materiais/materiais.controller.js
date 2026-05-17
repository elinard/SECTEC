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
exports.MateriaisController = void 0;
// src/materiais/materiais.controller.ts
var common_1 = require("@nestjs/common");
var platform_express_1 = require("@nestjs/platform-express");
var swagger_1 = require("@nestjs/swagger");
var multer_1 = require("multer");
var path_1 = require("path");
var create_material_dto_1 = require("./dto/create-material.dto");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var roles_guard_1 = require("../auth/guards/roles.guard");
var roles_decorator_1 = require("../auth/decorators/roles.decorator");
var get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
var MateriaisController = /** @class */ (function () {
    function MateriaisController(materiaisService) {
        this.materiaisService = materiaisService;
    }
    MateriaisController.prototype.criarMaterial = function (file, body, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.materiaisService.criarMaterial(file, body, userId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    MateriaisController.prototype.cancelarMaterial = function (materialId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.materiaisService.cancelarMaterial(materialId, userId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    MateriaisController.prototype.avaliarMaterial = function (materialId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.materiaisService.avaliarMaterial(materialId, body)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    MateriaisController.prototype.listarPendentes = function (orientadorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.materiaisService.listarMateriaisPendentesPorOrientador(orientadorId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    __decorate([
        (0, common_1.Post)(),
        (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ALUNO) // Sobrescreve para permitir que o aluno envie a entrega
        ,
        (0, swagger_1.ApiOperation)({ summary: 'Cria a entrega de um material para o projeto' }),
        (0, swagger_1.ApiConsumes)('multipart/form-data'),
        (0, swagger_1.ApiBody)({ type: create_material_dto_1.CreateMaterialDto }),
        (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
            storage: (0, multer_1.diskStorage)({
                destination: './tmp',
                filename: function (req, file, cb) {
                    var uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, "".concat(file.fieldname, "-").concat(uniqueSuffix).concat((0, path_1.extname)(file.originalname)));
                },
            }),
        })),
        __param(0, (0, common_1.UploadedFile)()),
        __param(1, (0, common_1.Body)()),
        __param(2, (0, get_user_decorator_1.GetUser)('userId'))
    ], MateriaisController.prototype, "criarMaterial", null);
    __decorate([
        (0, common_1.Delete)(':id/cancelar'),
        (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ALUNO),
        (0, swagger_1.ApiOperation)({ summary: 'Cancela o envio de um material antes da avaliação dentro da janela de 1 hora' }),
        (0, swagger_1.ApiParam)({ name: 'id', description: 'ID numérico do material a ser cancelado', type: Number }),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(1, (0, get_user_decorator_1.GetUser)('userId'))
    ], MateriaisController.prototype, "cancelarMaterial", null);
    __decorate([
        (0, common_1.Patch)(':id/avaliar'),
        (0, swagger_1.ApiOperation)({ summary: 'Aprova ou recusa o material postado por um aluno' }),
        (0, swagger_1.ApiParam)({ name: 'id', description: 'ID numérico do material a ser avaliado', type: Number }),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)())
    ], MateriaisController.prototype, "avaliarMaterial", null);
    __decorate([
        (0, common_1.Get)('pendentes-orientador'),
        (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ORIENTADOR) // Garante que apenas professores acessem
        ,
        (0, swagger_1.ApiOperation)({ summary: 'Lista os materiais em análise dos projetos orientados pelo professor' }),
        __param(0, (0, get_user_decorator_1.GetUser)('userId'))
    ], MateriaisController.prototype, "listarPendentes", null);
    MateriaisController = __decorate([
        (0, swagger_1.ApiTags)('Materiais do Projeto'),
        (0, common_1.Controller)('materiais'),
        (0, swagger_1.ApiBearerAuth)('token-jwt'),
        (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
        (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ORIENTADOR) // Padrão da classe para fins administrativos
    ], MateriaisController);
    return MateriaisController;
}());
exports.MateriaisController = MateriaisController;
