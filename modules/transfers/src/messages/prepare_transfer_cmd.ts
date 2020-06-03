/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-27.
 */
'use strict'

import { CommandMsg } from '@mojaloop-poc/lib-domain'
import { TransfersAggTopics } from '../domain/transfers_agg'

export interface PrepareTransferCmdPayload {
  transfer: {
    id: string
    amount: number
    currencyId: string
    payerId: string
    payeeId: string
  }
}

export class PrepareTransferCmd extends CommandMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersAggTopics.Commands

  payload: PrepareTransferCmdPayload

  constructor (payload: PrepareTransferCmdPayload) {
    super()

    this.aggregateId = this.msgKey = payload?.transfer?.id

    this.payload = payload
  }

  validatePayload (): void { }
}
