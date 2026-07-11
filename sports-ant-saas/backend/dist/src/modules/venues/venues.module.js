"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VenuesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const venues_service_1 = require("./venues.service");
const venues_controller_1 = require("./venues.controller");
const venue_entity_1 = require("./entities/venue.entity");
const venue_search_service_1 = require("./venue-search.service");
const sessions_module_1 = require("../sessions/sessions.module");
const device_entity_1 = require("../devices/entities/device.entity");
const member_entity_1 = require("../members/entities/member.entity");
const ticket_entity_1 = require("../tickets/entities/ticket.entity");
const session_entity_1 = require("../sessions/entities/session.entity");
const session_booking_entity_1 = require("../sessions/entities/session-booking.entity");
const coach_entity_1 = require("../sessions/entities/coach.entity");
let VenuesModule = class VenuesModule {
};
exports.VenuesModule = VenuesModule;
exports.VenuesModule = VenuesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([venue_entity_1.Venue, device_entity_1.Device, member_entity_1.Member, ticket_entity_1.Ticket, session_entity_1.Session, session_booking_entity_1.SessionBooking, coach_entity_1.Coach]),
            sessions_module_1.SessionsModule,
        ],
        controllers: [venues_controller_1.VenuesController],
        providers: [venues_service_1.VenuesService, venue_search_service_1.VenueSearchService],
        exports: [venues_service_1.VenuesService, venue_search_service_1.VenueSearchService],
    })
], VenuesModule);
//# sourceMappingURL=venues.module.js.map