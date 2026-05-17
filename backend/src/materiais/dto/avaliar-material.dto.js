"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvaliarMaterialDto = exports.DecisaoAvaliacao = void 0;
// src/materiais/dto/avaliar-material.dto.ts
var class_validator_1 = require("class-validator");
var swagger_1 = require("@nestjs/swagger");
var DecisaoAvaliacao;
(function (DecisaoAvaliacao) {
    DecisaoAvaliacao["APROVAR"] = "APROVAR";
    DecisaoAvaliacao["RECUSAR"] = "RECUSAR";
})(DecisaoAvaliacao = exports.DecisaoAvaliacao || (exports.DecisaoAvaliacao = {}));
var AvaliarMaterialDto = /** @class */ (function () {
    function AvaliarMaterialDto() {
    }
    __decorate([
        (0, swagger_1.ApiProperty)({ enum: DecisaoAvaliacao, description: 'Decisão do orientador sobre o material' }),
        (0, class_validator_1.IsEnum)(DecisaoAvaliacao)
    ], AvaliarMaterialDto.prototype, "decisao", void 0);
    __decorate([
        (0, swagger_1.ApiProperty)({ description: 'Feedback/Justificativa obrigatória em caso de recusa', required: false }),
        (0, class_validator_1.ValidateIf)(function (o) { return o.decisao === DecisaoAvaliacao.RECUSAR; }),
        (0, class_validator_1.IsString)(),
        (0, class_validator_1.IsNotEmpty)({ message: 'A opinião/justificativa é obrigatória ao recusar um material.' })
    ], AvaliarMaterialDto.prototype, "opiniao", void 0);
    return AvaliarMaterialDto;
}());
exports.AvaliarMaterialDto = AvaliarMaterialDto;
