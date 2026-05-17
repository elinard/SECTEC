"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComissaoEvento = void 0;
var typeorm_1 = require("typeorm");
var evento_entity_1 = require("./evento.entity"); // ajuste o caminho se necessário
var user_entity_1 = require("src/users/entities/user.entity");
var ComissaoEvento = /** @class */ (function () {
    function ComissaoEvento() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)()
    ], ComissaoEvento.prototype, "id", void 0);
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return evento_entity_1.Evento; }, { onDelete: 'CASCADE' }),
        (0, typeorm_1.JoinColumn)({ name: 'evento_id' })
    ], ComissaoEvento.prototype, "evento", void 0);
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }, { onDelete: 'CASCADE' }),
        (0, typeorm_1.JoinColumn)({ name: 'user_id' })
    ], ComissaoEvento.prototype, "user", void 0);
    __decorate([
        (0, typeorm_1.CreateDateColumn)({ name: 'criado_em' })
    ], ComissaoEvento.prototype, "criadoEm", void 0);
    ComissaoEvento = __decorate([
        (0, typeorm_1.Entity)('comissao_eventos'),
        (0, typeorm_1.Unique)(['evento', 'user']) // Impede duplicar o mesmo aluno na comissão do mesmo evento
    ], ComissaoEvento);
    return ComissaoEvento;
}());
exports.ComissaoEvento = ComissaoEvento;
