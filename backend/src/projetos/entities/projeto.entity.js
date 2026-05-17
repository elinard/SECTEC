"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Projeto = void 0;
var typeorm_1 = require("typeorm");
var evento_entity_1 = require("../../evento/entities/evento.entity");
var tema_evento_entity_1 = require("../../evento/entities/tema-evento.entity");
var user_entity_1 = require("../../users/entities/user.entity");
var projeto_aluno_entity_1 = require("./projeto-aluno.entity");
var projeto_orientador_entity_1 = require("./projeto-orientador.entity");
var project_file_entity_1 = require("../../pdf/entities/project-file.entity"); // ajuste o caminho aqui
var projeto_material_entity_1 = require("../../materiais/entities/projeto-material.entity");
var Projeto = /** @class */ (function () {
    function Projeto() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)()
    ], Projeto.prototype, "id", void 0);
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return evento_entity_1.Evento; }, function (evento) { return evento.projetos; }, { onDelete: 'CASCADE' }),
        (0, typeorm_1.JoinColumn)({ name: 'evento_id' })
    ], Projeto.prototype, "evento", void 0);
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }),
        (0, typeorm_1.JoinColumn)({ name: 'aluno_autor_id' })
    ], Projeto.prototype, "alunoAutor", void 0);
    __decorate([
        (0, typeorm_1.Column)({ type: 'varchar', length: 255 })
    ], Projeto.prototype, "titulo", void 0);
    __decorate([
        (0, typeorm_1.Column)({ type: 'text' })
    ], Projeto.prototype, "descricao", void 0);
    __decorate([
        (0, typeorm_1.Column)({ name: 'tema_id' })
    ], Projeto.prototype, "temaId", void 0);
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return tema_evento_entity_1.TemaEvento; }, { nullable: true, eager: false }),
        (0, typeorm_1.JoinColumn)({ name: 'tema_id', referencedColumnName: 'id' })
    ], Projeto.prototype, "tema", void 0);
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return projeto_aluno_entity_1.ProjetoAluno; }, function (projetoAluno) { return projetoAluno.projeto; })
    ], Projeto.prototype, "projetoAlunos", void 0);
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return projeto_orientador_entity_1.ProjetoOrientador; }, function (projetoOrientador) { return projetoOrientador.projeto; })
    ], Projeto.prototype, "orientadores", void 0);
    __decorate([
        (0, typeorm_1.CreateDateColumn)({ name: 'criado_em' })
    ], Projeto.prototype, "criadoEm", void 0);
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return project_file_entity_1.ProjectFile; }, function (projectFile) { return projectFile.projeto; })
    ], Projeto.prototype, "arquivos", void 0);
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return projeto_material_entity_1.ProjetoMaterial; }, function (material) { return material.projeto; })
    ], Projeto.prototype, "materiais", void 0);
    Projeto = __decorate([
        (0, typeorm_1.Entity)('projetos'),
        (0, typeorm_1.Unique)(['alunoAutor', 'evento'])
    ], Projeto);
    return Projeto;
}());
exports.Projeto = Projeto;
