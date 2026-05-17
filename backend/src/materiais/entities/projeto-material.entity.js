"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjetoMaterial = exports.StatusMaterial = exports.TipoMaterial = void 0;
var typeorm_1 = require("typeorm");
var projeto_entity_1 = require("../../projetos/entities/projeto.entity");
var TipoMaterial;
(function (TipoMaterial) {
    TipoMaterial["PDF"] = "pdf";
    TipoMaterial["LINK"] = "link";
    TipoMaterial["RELATORIO"] = "pdf_relatorio";
})(TipoMaterial = exports.TipoMaterial || (exports.TipoMaterial = {}));
var StatusMaterial;
(function (StatusMaterial) {
    StatusMaterial["EM_ANALISE"] = "em_analise";
    StatusMaterial["APROVADO"] = "aprovado";
    StatusMaterial["RECUSADO"] = "recusado";
})(StatusMaterial = exports.StatusMaterial || (exports.StatusMaterial = {}));
var ProjetoMaterial = /** @class */ (function () {
    function ProjetoMaterial() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)()
    ], ProjetoMaterial.prototype, "id", void 0);
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return projeto_entity_1.Projeto; }, { onDelete: 'CASCADE' }),
        (0, typeorm_1.JoinColumn)({ name: 'projeto_id' })
    ], ProjetoMaterial.prototype, "projeto", void 0);
    __decorate([
        (0, typeorm_1.Column)({ type: 'enum', enum: TipoMaterial })
    ], ProjetoMaterial.prototype, "tipo", void 0);
    __decorate([
        (0, typeorm_1.Column)({
            type: 'enum',
            enum: StatusMaterial,
            default: StatusMaterial.EM_ANALISE,
        })
    ], ProjetoMaterial.prototype, "status", void 0);
    __decorate([
        (0, typeorm_1.Column)({ type: 'text' })
    ], ProjetoMaterial.prototype, "conteudo", void 0);
    __decorate([
        (0, typeorm_1.Column)({ type: 'text' })
    ], ProjetoMaterial.prototype, "opiniao", void 0);
    __decorate([
        (0, typeorm_1.CreateDateColumn)({ name: 'criado_em' })
    ], ProjetoMaterial.prototype, "criadoEm", void 0);
    ProjetoMaterial = __decorate([
        (0, typeorm_1.Entity)('projeto_materiais')
    ], ProjetoMaterial);
    return ProjetoMaterial;
}());
exports.ProjetoMaterial = ProjetoMaterial;
