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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const http_1 = __importDefault(require("http"));
class NoopService {
}
let TestMe = class TestMe {
    s;
    constructor(s) {
        this.s = s;
    }
    list() { return [{ id: 1 }]; }
    get() { return { id: 'single' }; }
};
__decorate([
    (0, common_1.Get)('/list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestMe.prototype, "list", null);
__decorate([
    (0, common_1.Get)('/:id'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestMe.prototype, "get", null);
TestMe = __decorate([
    (0, common_1.Controller)('test-route'),
    __param(0, (0, common_1.Inject)(NoopService)),
    __metadata("design:paramtypes", [NoopService])
], TestMe);
async function main() {
    // Check metadata
    const proto = TestMe.prototype;
    console.log('Metadata keys:', Reflect.getMetadataKeys(proto));
    console.log('list path:', Reflect.getMetadata('path', proto.list));
    console.log('list method:', Reflect.getMetadata('method', proto.list));
    console.log('get path:', Reflect.getMetadata('path', proto.get));
    console.log('get method:', Reflect.getMetadata('method', proto.get));
    const m = await testing_1.Test.createTestingModule({
        controllers: [TestMe],
        providers: [{ provide: NoopService, useValue: {} }],
    }).compile();
    const app = m.createNestApplication();
    await app.init();
    const port = app.getHttpServer().address().port;
    function get(path) {
        return new Promise((resolve) => {
            http_1.default.get(`http://127.0.0.1:${port}${path}`, (res) => {
                let d = '';
                res.on('data', (c) => (d += c));
                res.on('end', () => resolve({ status: res.statusCode, body: d.slice(0, 500) }));
            });
        });
    }
    console.log('/test-route/list:', JSON.stringify(await get('/test-route/list')));
    console.log('/test-route/123:', JSON.stringify(await get('/test-route/123')));
    await app.close();
}
main().catch((e) => { console.error('ERROR:', e); process.exit(1); });
//# sourceMappingURL=__test_debug.js.map