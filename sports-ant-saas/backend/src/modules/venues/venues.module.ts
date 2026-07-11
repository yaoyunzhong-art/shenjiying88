import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VenuesService } from './venues.service';
import { VenuesController } from './venues.controller';
import { VenueSearchController } from './venue-search.controller';
import { Venue } from './entities/venue.entity';
import { VenueSearchService } from './venue-search.service';
import { VenueSearchSimpleService } from './venue-search-simple.service';
import { VenueSearchSimpleController } from './venue-search-simple.controller';
import { SessionsModule } from '../sessions/sessions.module';
import { Device } from '../devices/entities/device.entity';
import { Member } from '../members/entities/member.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Session } from '../sessions/entities/session.entity';
import { SessionBooking } from '../sessions/entities/session-booking.entity';
import { Coach } from '../sessions/entities/coach.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venue, Device, Member, Ticket, Session, SessionBooking, Coach]),
    SessionsModule, // 导入SessionsModule以获取其他相关功能
  ],
  controllers: [VenuesController, VenueSearchController, VenueSearchSimpleController],
  providers: [VenuesService, VenueSearchService, VenueSearchSimpleService],
  exports: [VenuesService, VenueSearchService, VenueSearchSimpleService],
})
export class VenuesModule {}
