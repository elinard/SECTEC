"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMaterialDto = void 0;
// src/materiais/dto/create-material.dto.ts
var class_validator_1 = require("class-validator");
var swagger_1 = require("@nestjs/swagger");
var projeto_material_entity_1 = require("../entities/projeto-material.entity");
var CreateMaterialDto = /** @class */ (function () {
    function CreateMaterialDto() {
    }
    __decorate([
        (0, swagger_1.ApiProperty)({
            description: 'ID do Projeto associado à entrega',
            example: '1',
            type: String
        }),
        (0, class_validator_1.IsNotEmpty)({ message: 'O ID do projeto é obrigatório.' }),
        (0, class_validator_1.IsString)()
    ], CreateMaterialDto.prototype, "projetoId", void 0);
    __decorate([
        (0, swagger_1.ApiProperty)({
            description: 'Tipo do material sendo entregue (pdf = Banner, pdf_relatorio = Relatório, link = Vídeo)',
            enum: projeto_material_entity_1.TipoMaterial,
            example: projeto_material_entity_1.TipoMaterial.PDF
        }),
        (0, class_validator_1.IsNotEmpty)({ message: 'O tipo do material é obrigatório.' }),
        (0, class_validator_1.IsEnum)(projeto_material_entity_1.TipoMaterial, { message: 'Tipo de material inválido. Use: pdf, link ou pdf_relatorio.' })
    ], CreateMaterialDto.prototype, "tipo", void 0);
    __decorate([
        (0, swagger_1.ApiProperty)({
            description: 'URL do vídeo (obrigatório se tipo for link) ou uma descrição/resumo breve do arquivo enviado',
            example: 'https://www.youtube.com/watch?v=exemplo ou Resumo da entrega...',
            required: false
        }),
        (0, class_validator_1.IsOptional)(),
        (0, class_validator_1.IsString)()
    ], CreateMaterialDto.prototype, "conteudo", void 0);
    __decorate([
        (0, swagger_1.ApiProperty)({
            type: 'string',
            format: 'binary',
            description: 'Arquivo físico (obrigatório se o tipo for pdf ou pdf_relatorio)',
            required: false
        })
    ], CreateMaterialDto.prototype, "file", void 0);
    return CreateMaterialDto;
}());
exports.CreateMaterialDto = CreateMaterialDto;
