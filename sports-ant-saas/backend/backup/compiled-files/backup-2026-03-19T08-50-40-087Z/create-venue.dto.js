"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateVenueDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var venue_entity_1 = require("../entities/venue.entity");
var CreateVenueDto = function () {
    var _a;
    var _images_decorators;
    var _images_initializers = [];
    var _images_extraInitializers = [];
    var _ownerId_decorators;
    var _ownerId_initializers = [];
    var _ownerId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateVenueDto() {
                // @ApiProperty({ description: '场地名称' })
                // @IsString()
                // @IsNotEmpty()
                this.name = '';
                // @ApiProperty({ description: '场地地址' })
                // @IsString()
                // @IsNotEmpty()
                this.address = '';
                // @ApiProperty({ description: '城市' })
                // @IsString()
                // @IsNotEmpty()
                this.city = '';
                // @ApiProperty({ description: '省份/州' })
                // @IsString()
                // @IsNotEmpty()
                this.province = '';
                // @ApiProperty({ description: '邮政编码' })
                // @IsString()
                // @IsNotEmpty()
                this.postalCode = '';
                // @ApiProperty({ description: '国家', default: '中国' })
                // @IsString()
                // @IsOptional()
                this.country = '中国';
                // @ApiProperty({ description: '场地类型', enum: VenueType })
                // @IsEnum(VenueType)
                this.type = venue_entity_1.VenueType.GYM; // 需要导入VenueType或使用默认值
                // @ApiProperty({ description: '最大容量' })
                // @IsInt()
                // @Min(1)
                this.capacity = 10;
                // @ApiProperty({ description: '联系方式' })
                // @IsPhoneNumber('CN')
                this.contactPhone = '';
                // @ApiProperty({ description: '联系邮箱' })
                // @IsEmail()
                this.contactEmail = '';
                // @ApiProperty({ description: '场地状态', enum: VenueStatus, default: VenueStatus.ACTIVE })
                // @IsEnum(VenueStatus)
                // @IsOptional()
                this.status = venue_entity_1.VenueStatus.ACTIVE;
                // @ApiProperty({ description: '是否支持在线预订', default: true })
                // @IsBoolean()
                // @IsOptional()
                this.allowOnlineBooking = true;
                // @ApiProperty({ description: '预订提前时间（小时）', default: 24 })
                // @IsInt()
                // @Min(1)
                // @IsOptional()
                this.bookingAdvanceHours = 24;
                // @ApiProperty({ description: '图片URL列表', required: false, type: [String] })
                // @IsArray()
                this.images = __runInitializers(this, _images_initializers, void 0);
                this.ownerId = (__runInitializers(this, _images_extraInitializers), __runInitializers(this, _ownerId_initializers, void 0));
                __runInitializers(this, _ownerId_extraInitializers);
            }
            return CreateVenueDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _images_decorators = [(0, class_validator_1.IsString)({ each: true }), (0, class_validator_1.IsOptional)()];
            _ownerId_decorators = [(0, swagger_1.ApiProperty)({ description: '所有者ID', required: false }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _images_decorators, { kind: "field", name: "images", static: false, private: false, access: { has: function (obj) { return "images" in obj; }, get: function (obj) { return obj.images; }, set: function (obj, value) { obj.images = value; } }, metadata: _metadata }, _images_initializers, _images_extraInitializers);
            __esDecorate(null, null, _ownerId_decorators, { kind: "field", name: "ownerId", static: false, private: false, access: { has: function (obj) { return "ownerId" in obj; }, get: function (obj) { return obj.ownerId; }, set: function (obj, value) { obj.ownerId = value; } }, metadata: _metadata }, _ownerId_initializers, _ownerId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateVenueDto = CreateVenueDto;
