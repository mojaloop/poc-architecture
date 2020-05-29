/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-27.
 */
'use strict'

import { CommandMsg } from '@mojaloop-poc/lib-domain'
import { TransfersAggTopics } from '../domain/transfers_agg'

export class AcknowledgeTransferFundsCmd extends CommandMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersAggTopics.Commands

  payload: {
    id: string
  }

  constructor (id: string) {
    super()

    this.aggregateId = this.msgKey = id

    this.payload = {
      id
    }
  }

  validatePayload (): void{ }
}
