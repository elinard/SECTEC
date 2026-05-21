"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
var app_controller_1 = require("./app.controller");
var app_service_1 = require("./app.service");
var projetos_module_1 = require("./projetos/projetos.module");
var evento_module_1 = require("./evento/evento.module");
var users_module_1 = require("./users/users.module");
var common_module_1 = require("./common/common.module");
var auth_module_1 = require("./auth/auth.module");
var dashboard_module_1 = require("./dashboard/dashboard.module");
var pdf_module_1 = require("./pdf/pdf.module");
var orientacoes_module_1 = require("./orientacoes/orientacoes.module");
var materiais_module_1 = require("./materiais/materiais.module");
var relatorio_module_1 = require("./relatorio/relatorio.module");
common_module_1.CommonModule,
    users_module_1.UsersModule,
    auth_module_1.AuthModule,
    dashboard_module_1.DashboardModule,
    projetos_module_1.ProjetosModule,
    evento_module_1.EventoModule,
    pdf_module_1.PdfModule,
    // ── MÓDULOS DO ORIENTADOR ──
    orientacoes_module_1.OrientacoesModule,
    materiais_module_1.MateriaisModule,
    relatorio_module_1.RelatorioModule,
;
controllers: [app_controller_1.AppController],
    providers;
[app_service_1.AppService],
;
var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    return AppModule;
}());
exports.AppModule = AppModule;
