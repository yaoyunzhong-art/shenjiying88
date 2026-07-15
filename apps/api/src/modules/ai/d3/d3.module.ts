import { Module } from '@nestjs/common'
import { D3Controller } from './d3.controller'
import { D3Service } from './d3.service'

@Module({
  controllers: [D3Controller],
  providers: [D3Service],
  exports: [D3Service],
})
export class D3Module {}
