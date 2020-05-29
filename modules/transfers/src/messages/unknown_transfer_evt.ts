/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-28.
 */
'use strict'

import { DomainEventMsg } from '@mojaloop-poc/lib-domain'
import { TransfersAggTopics } from '../domain/transfers_agg'

export class UnknownTransferEvt extends DomainEventMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersAggTopics.DomainEvents

  payload: {
    id: string
  }

  constructor (transferId: string) {
    super()

    this.aggregateId = this.msgKey = transferId

    this.payload = {
      id: transferId
    }
  }

  validatePayload (): void{ }
}
