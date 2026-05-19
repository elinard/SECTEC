"use strict";
// src/users/users.module.ts
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
/* =====================================================
   🔹 CONTROLLERS & SERVICES
===================================================== */
var users_controller_1 = require("./users.controller");
var users_service_1 = require("./users.service");
/* =====================================================
   🔹 ENTIDADES
===================================================== */
var user_entity_1 = require("./entities/user.entity");
var evento_entity_1 = require("../evento/entities/evento.entity");
var comissao_evento_entity_1 = require("../evento/entities/comissao-evento.entity");
var projeto_orientador_entity_1 = require("../orientacoes/entities/projeto-orientador.entity");
/* =====================================================
   🔹 SEEDS / PROVIDERS
===================================================== */
var users_seed_1 = require("./users.seed");
/* =====================================================
   🔹 CONFIGURAÇÕES INTERNAS
===================================================== */
/**
 * Centraliza todas as entidades utilizadas pelo módulo.
 *
 * ✔ Facilita manutenção
 * ✔ Evita esquecer entidades ao alterar o service
 * ✔ Permite reutilização futura
 */
var ENTITIES = [
    user_entity_1.User,
    evento_entity_1.Evento,
    comissao_evento_entity_1.ComissaoEvento,
    projeto_orientador_entity_1.ProjetoOrientador,
];
/**
 * Providers do módulo
 *
 * Separado para facilitar testes e evolução
 */
var PROVIDERS = [
    users_service_1.UsersService,
    users_seed_1.UsersSeed,
];
/**
 * Controllers do módulo
 */
var CONTROLLERS = [
    users_controller_1.UsersController,
];
/* =====================================================
   🔹 MODULE
===================================================== */
var UsersModule = /** @class */ (function () {
    function UsersModule() {
    }
    UsersModule = __decorate([
        (0, common_1.Module)({
            imports: [
                /**
                 * Registro das entidades no contexto do TypeORM
                 *
                 * 🔥 IMPORTANTE:
                 * Toda entidade usada via @InjectRepository
                 * precisa estar aqui.
                 */
                typeorm_1.TypeOrmModule.forFeature(ENTITIES),
            ],
            controllers: CONTROLLERS,
            providers: PROVIDERS,
            /**
             * Exportações do módulo
             *
             * Permite que outros módulos utilizem:
             * - UsersService
             * - UsersSeed (ex: scripts de seed global)
             */
            exports: PROVIDERS,
        })
    ], UsersModule);
    return UsersModule;
}());
exports.UsersModule = UsersModule;
