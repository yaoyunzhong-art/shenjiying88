import { Module } from '@nestjs/common'
import { TournamentController } from './tournament.controller'
import { TournamentService } from './tournament.service'
import { TournamentHandicapService } from './tournament-handicap.service'

@Module({
  controllers: [TournamentController],
  providers: [TournamentService, TournamentHandicapService],
  exports: [TournamentService, TournamentHandicapService]
})
export class TournamentModule {}
