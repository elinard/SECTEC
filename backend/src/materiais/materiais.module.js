"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MateriaisModule = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var materiais_service_1 = require("./materiais.service");
var materiais_controller_1 = require("./materiais.controller");
var projeto_material_entity_1 = require("./entities/projeto-material.entity");
// 1. Importe a entidade Projeto
var projeto_entity_1 = require("../projetos/entities/projeto.entity");
// 2. Importe o módulo ou o serviço do PDF (ajuste o caminho se necessário)
var pdf_module_1 = require("../pdf/pdf.module");
var MateriaisModule = /** @class */ (function () {
    function MateriaisModule() {
    }
    MateriaisModule = __decorate([
        (0, common_1.Module)({
            imports: [
                // Adicionamos as entidades que o MateriaisService usa agora
                typeorm_1.TypeOrmModule.forFeature([projeto_material_entity_1.ProjetoMaterial, projeto_entity_1.Projeto]),
                // Importamos o módulo do PDF para o Nest resolver o [class PdfService]
                pdf_module_1.PdfModule,
            ],
            providers: [materiais_service_1.MateriaisService],
            controllers: [materiais_controller_1.MateriaisController],
        })
    ], MateriaisModule);
    return MateriaisModule;
}());
exports.MateriaisModule = MateriaisModule;
