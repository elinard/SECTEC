"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.UsersController = void 0;
var common_1 = require("@nestjs/common");
var platform_express_1 = require("@nestjs/platform-express");
// Adicionei ApiProperty e ApiResponse
var swagger_1 = require("@nestjs/swagger");
var user_entity_1 = require("./entities/user.entity");
var CsvFileValidator = /** @class */ (function (_super) {
    __extends(CsvFileValidator, _super);
    function CsvFileValidator() {
        return _super.call(this, {}) || this;
    }
    CsvFileValidator.prototype.isValid = function (file) {
        return /\.(csv)$/i.test(file.originalname);
    };
    CsvFileValidator.prototype.buildErrorMessage = function () {
        return 'O arquivo deve ser um CSV válido (extensão .csv).';
    };
    return CsvFileValidator;
}(common_1.FileValidator));
// @UseGuards(JwtAuthGuard)
var UsersController = /** @class */ (function () {
    function UsersController(usersService) {
        this.usersService = usersService;
    }
    UsersController.prototype.getAlunos = function () {
        return this.usersService.findAllAlunos();
    };
    UsersController.prototype.getComissao = function () {
        return this.usersService.findAllComissao();
    };
    UsersController.prototype.getOrientadores = function () {
        return this.usersService.findAllOrientadores();
    };
    // --- ROTA DE ALUNOS ---
    UsersController.prototype.uploadCsvAlunos = function (file) {
        return this.usersService.processarCsv(file, user_entity_1.UserRole.ALUNO);
    };
    // --- ROTA DE PROFESSORES ---
    UsersController.prototype.uploadCsvProfessores = function (file) {
        return this.usersService.processarCsv(file, user_entity_1.UserRole.ORIENTADOR);
    };
    UsersController.prototype.promote = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.usersService.promoteToComissao(id)];
            });
        });
    };
    UsersController.prototype.createIndividual = function (createUserDto) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.usersService.createIndividual(createUserDto)];
            });
        });
    };
    UsersController.prototype.demote = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.usersService.demoteFromComissao(id)];
            });
        });
    };
    __decorate([
        (0, common_1.Get)('alunos'),
        (0, swagger_1.ApiOperation)({ summary: 'Listar todos os alunos ativos' })
    ], UsersController.prototype, "getAlunos", null);
    __decorate([
        (0, common_1.Get)('comissao'),
        (0, swagger_1.ApiOperation)({ summary: 'Listar todos os alunos ativos' })
    ], UsersController.prototype, "getComissao", null);
    __decorate([
        (0, common_1.Get)('orientadores'),
        (0, swagger_1.ApiOperation)({ summary: 'Listar todos os orientadores ativos' })
    ], UsersController.prototype, "getOrientadores", null);
    __decorate([
        (0, common_1.Post)('upload-csv/alunos'),
        (0, swagger_1.ApiOperation)({ summary: 'Upload de CSV exclusivo para ALUNOS' }),
        (0, swagger_1.ApiConsumes)('multipart/form-data'),
        (0, swagger_1.ApiBody)({
            description: 'Arquivo CSV contendo os dados dos alunos',
            schema: {
                type: 'object',
                properties: {
                    file: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },
        }),
        (0, swagger_1.ApiResponse)({ status: 201, description: 'Usuários importados com sucesso.' }),
        (0, swagger_1.ApiResponse)({ status: 400, description: 'Arquivo inválido ou e-mail duplicado.' }),
        (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
        __param(0, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
            validators: [
                new common_1.MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
                new CsvFileValidator(),
            ],
        })))
    ], UsersController.prototype, "uploadCsvAlunos", null);
    __decorate([
        (0, common_1.Post)('upload-csv/professores'),
        (0, swagger_1.ApiOperation)({ summary: 'Upload de CSV exclusivo para PROFESSORES/ORIENTADORES' }),
        (0, swagger_1.ApiConsumes)('multipart/form-data'),
        (0, swagger_1.ApiBody)({
            description: 'Arquivo CSV contendo os dados dos professores',
            schema: {
                type: 'object',
                properties: {
                    file: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },
        }),
        (0, swagger_1.ApiResponse)({ status: 201, description: 'Usuários importados com sucesso.' }),
        (0, swagger_1.ApiResponse)({ status: 400, description: 'Arquivo inválido ou e-mail duplicado.' }),
        (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
        __param(0, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
            validators: [
                new common_1.MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
                new CsvFileValidator(),
            ],
        })))
    ], UsersController.prototype, "uploadCsvProfessores", null);
    __decorate([
        (0, common_1.Patch)(':id/promote-comissao'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe))
    ], UsersController.prototype, "promote", null);
    __decorate([
        (0, common_1.Post)(),
        (0, swagger_1.ApiOperation)({ summary: 'Cadastrar um usuário individualmente (Aluno, Orientador ou Coordenador)' }),
        (0, swagger_1.ApiResponse)({ status: 201, description: 'Usuário cadastrado com sucesso.' }),
        (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos ou e-mail já existente.' }),
        __param(0, (0, common_1.Body)())
    ], UsersController.prototype, "createIndividual", null);
    __decorate([
        (0, common_1.Patch)(':id/demote-comissao'),
        (0, swagger_1.ApiOperation)({ summary: 'Remover aluno da COMISSÃO e retorná-lo ao cargo de ALUNO' }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Usuário retornado ao cargo de aluno com sucesso.' }),
        (0, swagger_1.ApiResponse)({ status: 400, description: 'Usuário não pertence à comissão.' }),
        (0, swagger_1.ApiResponse)({ status: 404, description: 'Usuário não encontrado.' }),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe))
    ], UsersController.prototype, "demote", null);
    UsersController = __decorate([
        (0, swagger_1.ApiTags)('users'),
        (0, common_1.Controller)('users')
    ], UsersController);
    return UsersController;
}());
exports.UsersController = UsersController;
