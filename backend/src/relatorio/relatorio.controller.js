"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelatorioController = void 0;
var common_1 = require("@nestjs/common");
var roles_decorator_1 = require("../auth/decorators/roles.decorator"); // 👈 Importado o UserRole
var swagger_1 = require("@nestjs/swagger");
var RelatorioController = /** @class */ (function () {
    function RelatorioController(relatorioService) {
        this.relatorioService = relatorioService;
    }
    RelatorioController.prototype.obterAlunosSemProjeto = function () {
        return this.relatorioService.obterAlunosSemProjeto();
    };
    RelatorioController.prototype.obterHistoricoComissao = function () {
        return this.relatorioService.obterHistoricoComissao();
    };
    RelatorioController.prototype.obterMetricasEixosTematicos = function () {
        return this.relatorioService.obterMetricasEixosTematicos();
    };
    RelatorioController.prototype.obterProjetosPorOrientador = function () {
        return this.relatorioService.obterProjetosPorOrientador();
    };
    RelatorioController.prototype.obterProjetosPorTurma = function () {
        return this.relatorioService.obterProjetosPorTurma();
    };
    __decorate([
        (0, common_1.Get)('alunos-sem-projeto'),
        (0, swagger_1.ApiOperation)({ summary: 'Lista os alunos que não possuem projeto no ano atual agrupados por turma' })
    ], RelatorioController.prototype, "obterAlunosSemProjeto", null);
    __decorate([
        (0, common_1.Get)('comissao-por-evento'),
        (0, swagger_1.ApiOperation)({ summary: 'Retorna o histórico de alunos da comissão organizadora agrupados por evento' })
    ], RelatorioController.prototype, "obterHistoricoComissao", null);
    __decorate([
        (0, common_1.Get)('eixos-tematicos'),
        (0, swagger_1.ApiOperation)({ summary: 'Retorna estatísticas quantitativas (totais, pendentes, aceitos) por Eixo Temático do evento ativo' })
    ], RelatorioController.prototype, "obterMetricasEixosTematicos", null);
    __decorate([
        (0, common_1.Get)('projetos-por-orientador'),
        (0, swagger_1.ApiOperation)({ summary: 'Lista a quantidade e os títulos dos projetos aceitos por orientador no evento atual' })
    ], RelatorioController.prototype, "obterProjetosPorOrientador", null);
    __decorate([
        (0, common_1.Get)('projetos-por-turma'),
        (0, swagger_1.ApiOperation)({ summary: 'Retorna a quantidade de projetos criados e aprovados agrupados por turma e ano' })
    ], RelatorioController.prototype, "obterProjetosPorTurma", null);
    RelatorioController = __decorate([
        (0, swagger_1.ApiTags)('relatorios'),
        (0, common_1.Controller)('relatorio')
        //@UseGuards(JwtAuthGuard, RolesGuard)
        ,
        (0, swagger_1.ApiBearerAuth)('token-jwt'),
        (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COORDENACAO) // 👈 Alterado para usar o Enum correto
    ], RelatorioController);
    return RelatorioController;
}());
exports.RelatorioController = RelatorioController;
