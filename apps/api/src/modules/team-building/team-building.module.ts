import { Module } from '@nestjs/common'
import { TeamBuildingController } from './team-building.controller'
import { TeamBuildingService } from './team-building.service'

@Module({
  controllers: [TeamBuildingController],
  providers: [TeamBuildingService],
  exports: [TeamBuildingService],
})
export class TeamBuildingModule {}
