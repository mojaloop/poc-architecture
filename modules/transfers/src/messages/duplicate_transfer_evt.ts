/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

'use strict'

import { DomainEventMsg } from '@mojaloop-poc/lib-domain'
import { TransfersAggTopics } from '../domain/transfers_agg'

export class DuplicateTransferDetectedEvt extends DomainEventMsg {
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
