/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

'use strict'

import { CommandMsg } from '@mojaloop-poc/lib-domain'
import { TransferssAggTopics } from '../domain/transfers_agg'

export class CreateTransferCmd extends CommandMsg {
  aggregateId: string
  aggregate_name: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransferssAggTopics.Commands

  payload: {
    id: string
    name: string
  }

  constructor (id: string, name: string, limit: number, initialPosition: number) {
    super()

    this.aggregateId = this.msgKey = id

    this.payload = {
      id,
      name,
      limit,
      initialPosition
    }
  }
}
