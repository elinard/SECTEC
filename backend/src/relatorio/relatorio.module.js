"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelatorioModule = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var relatorio_service_1 = require("./relatorio.service");
var relatorio_controller_1 = require("./relatorio.controller");
var user_entity_1 = require("src/users/entities/user.entity");
var evento_entity_1 = require("src/evento/entities/evento.entity");
var comissao_evento_entity_1 = require("src/evento/entities/comissao-evento.entity");
var tema_evento_entity_1 = require("src/evento/entities/tema-evento.entity");
var projeto_entity_1 = require("src/projetos/entities/projeto.entity");
var RelatorioModule = /** @class */ (function () {
    function RelatorioModule() {
    }
    RelatorioModule = __decorate([
        (0, common_1.Module)({
            imports: [
                typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, evento_entity_1.Evento, comissao_evento_entity_1.ComissaoEvento, projeto_entity_1.Projeto, tema_evento_entity_1.TemaEvento]) // Injeta os repositórios necessários
            ],
            controllers: [relatorio_controller_1.RelatorioController],
            providers: [relatorio_service_1.RelatorioService],
        })
    ], RelatorioModule);
    return RelatorioModule;
}());
exports.RelatorioModule = RelatorioModule;
