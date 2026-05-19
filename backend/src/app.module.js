"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
// src/app.module.ts
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var typeorm_1 = require("@nestjs/typeorm");
var schedule_1 = require("@nestjs/schedule");
var serve_static_1 = require("@nestjs/serve-static");
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
var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        (0, common_1.Module)({
            imports: [
                config_1.ConfigModule.forRoot(),
                typeorm_1.TypeOrmModule.forRoot({
                    type: 'mysql',
                    host: process.env.DB_HOST,
                    port: 3306,
                    username: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_NAME,
                    autoLoadEntities: true,
                    synchronize: true,
                }),
                schedule_1.ScheduleModule.forRoot(),
                // ── CONFIGURAÇÃO PARA SERVIR O REACT ──
                serve_static_1.ServeStaticModule.forRoot({
                    rootPath: '/app/frontend/dist',
                    exclude: ['/api'],
                }),
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
            ],
            controllers: [app_controller_1.AppController],
            providers: [app_service_1.AppService],
        })
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
