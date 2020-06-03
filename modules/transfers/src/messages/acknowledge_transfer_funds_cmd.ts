/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-27.
 */
'use strict'

import { CommandMsg } from '@mojaloop-poc/lib-domain'
import { TransfersAggTopics } from '../domain/transfers_agg'

export interface AckPayerFundsReservedCmdPayload {
  transferId: string
}

export class AckPayerFundsReservedCmd extends CommandMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersAggTopics.Commands

  payload: AckPayerFundsReservedCmdPayload

  constructor (payload: AckPayerFundsReservedCmdPayload) {
    super()

    this.aggregateId = this.msgKey = payload?.transferId

    this.payload = payload
  }

  validatePayload (): void{ }
}
