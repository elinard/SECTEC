"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var users_service_1 = require("./users.service");
var user_entity_1 = require("./entities/user.entity");
var users_seed_1 = require("./users.seed");
var users_controller_1 = require("./users.controller");
var evento_entity_1 = require("src/evento/entities/evento.entity"); // 👈 Importante verificar se o caminho está correto
var comissao_evento_entity_1 = require("src/evento/entities/comissao-evento.entity"); // 👈 Importante verificar se o caminho está correto
var UsersModule = /** @class */ (function () {
    function UsersModule() {
    }
    UsersModule = __decorate([
        (0, common_1.Module)({
            imports: [
                // 👇 Adicionado Evento e ComissaoEvento para o Nest gerar os repositórios neste módulo
                typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, evento_entity_1.Evento, comissao_evento_entity_1.ComissaoEvento]),
            ],
            providers: [users_service_1.UsersService, users_seed_1.UsersSeed],
            exports: [users_service_1.UsersService, typeorm_1.TypeOrmModule],
            controllers: [users_controller_1.UsersController],
        })
    ], UsersModule);
    return UsersModule;
}());
exports.UsersModule = UsersModule;
