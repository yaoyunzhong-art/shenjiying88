"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const testing_1 = require("@nestjs/testing");
const http_1 = __importDefault(require("http"));
// Import the inline controller from cross-module e2e test
// We can't import it directly since it's not exported, but let's check via require
// Actually let's just verify the existing test works by itself
async function main() {
    const { Controller, Get, ParameterDecorator, Inject } = require('@nestjs/common');
    let CC = class CC {
        a() { return 'a'; }
        b() { return 'b'; }
    };
    __decorate([
        Get('/a'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], CC.prototype, "a", null);
    __decorate([
        Get('/b'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], CC.prototype, "b", null);
    CC = __decorate([
        Controller('cc')
    ], CC);
    console.log('proto keys:', Reflect.getMetadataKeys(CC.prototype));
    console.log('CC path:', Reflect.getMetadata('path', CC));
    console.log('a path:', Reflect.getMetadata('path', CC.prototype.a));
    console.log('a method:', Reflect.getMetadata('method', CC.prototype.a));
    const m = await testing_1.Test.createTestingModule({
        controllers: [CC],
        providers: [],
    }).compile();
    const app = m.createNestApplication();
    try {
        await app.init();
        const port = app.getHttpServer().address().port;
        console.log('app port:', port);
        function req(path) {
            return new Promise((resolve) => {
                http_1.default.get(`http://127.0.0.1:${port}${path}`, (res) => {
                    let d = '';
                    res.on('data', (c) => (d += c));
                    res.on('end', () => resolve({ status: res.statusCode, body: d.slice(0, 500) }));
                });
            });
        }
        console.log('a:', JSON.stringify(await req('/cc/a')));
    }
    catch (e) {
        console.error('Error:', e.message);
    }
    finally {
        await app.close();
    }
}
main().catch(e => console.error(e));
//# sourceMappingURL=__test_debug2.js.map