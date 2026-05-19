"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoleRedirect = exports.clearSession = exports.saveSession = exports.apiRequest = exports.ApiError = exports.API_BASE = exports.API_BASE_URL = void 0;
var LOCAL_API_BASE = "https://sectec-ja.up.railway.app";
function normalizeApiBaseUrl(rawUrl) {
    var configuredUrl = rawUrl === null || rawUrl === void 0 ? void 0 : rawUrl.trim();
    if (!configuredUrl && import.meta.env.PROD) {
        throw new Error("VITE_API_URL não configurada no frontend.");
    }
    var baseUrl = (configuredUrl || LOCAL_API_BASE).replace(/\/+$/, "");
    return baseUrl.endsWith("/api") ? baseUrl : "".concat(baseUrl, "/api");
}
exports.API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
exports.API_BASE = exports.API_BASE_URL;
var ApiError = /** @class */ (function (_super) {
    __extends(ApiError, _super);
    function ApiError(message, status) {
        var _this = _super.call(this, message) || this;
        _this.name = "ApiError";
        _this.status = status;
        return _this;
    }
    return ApiError;
}(Error));
exports.ApiError = ApiError;
function notifyAuthChange() {
    if (typeof window === "undefined")
        return;
    window.dispatchEvent(new Event("auth-change"));
}
function getToken() {
    return localStorage.getItem("token");
}
function readError(response) {
    return __awaiter(this, void 0, void 0, function () {
        var data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, response.json()];
                case 1:
                    data = _b.sent();
                    if (typeof (data === null || data === void 0 ? void 0 : data.message) === "string")
                        return [2 /*return*/, data.message];
                    if (Array.isArray(data === null || data === void 0 ? void 0 : data.message))
                        return [2 /*return*/, data.message.join(" ")];
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/, "Não foi possível concluir a solicitação."];
            }
        });
    });
}
function apiRequest(path, _a) {
    var _b;
    if (_a === void 0) { _a = {}; }
    var body = _a.body, _c = _a.auth, auth = _c === void 0 ? true : _c, headers = _a.headers, options = __rest(_a, ["body", "auth", "headers"]);
    return __awaiter(this, void 0, Promise, function () {
        var token, response, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    token = getToken();
                    return [4 /*yield*/, fetch("".concat(exports.API_BASE_URL).concat(path), __assign(__assign({}, options), { headers: __assign(__assign(__assign({ Accept: "application/json" }, (body ? { "Content-Type": "application/json" } : {})), (auth && token ? { Authorization: "Bearer ".concat(token) } : {})), headers), body: body ? JSON.stringify(body) : undefined }))];
                case 1:
                    response = _e.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    _d = ApiError.bind;
                    return [4 /*yield*/, readError(response)];
                case 2: throw new (_d.apply(ApiError, [void 0, _e.sent(), response.status]))();
                case 3:
                    if (response.status === 204)
                        return [2 /*return*/, undefined];
                    if (!((_b = response.headers.get("content-type")) === null || _b === void 0 ? void 0 : _b.includes("application/json"))) {
                        throw new ApiError("Este endpoint não retornou JSON. Verifique se a rota existe no backend publicado.", response.status);
                    }
                    return [2 /*return*/, response.json()];
            }
        });
    });
}
exports.apiRequest = apiRequest;
function saveSession(data) {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("nome", data.user.nome);
    localStorage.setItem("userId", String(data.user.id));
    notifyAuthChange();
}
exports.saveSession = saveSession;
function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("nome");
    localStorage.removeItem("userId");
    notifyAuthChange();
}
exports.clearSession = clearSession;
function getRoleRedirect(role) {
    var routes = {
        aluno: "/dashboard/aluno",
        orientador: "/dashboard/orientador",
        coordenador: "/dashboard/coordenacao",
        comissao: "/dashboard/coordenacao",
    };
    return routes[role];
}
exports.getRoleRedirect = getRoleRedirect;
