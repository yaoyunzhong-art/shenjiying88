/**
 * feed.module.ts — 信息流 Module
 */
import { Module } from '@nestjs/common'
import { FeedService } from './feed.service'

@Module({
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}
