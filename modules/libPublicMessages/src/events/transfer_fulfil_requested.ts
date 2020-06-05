/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { DomainEventMsg } from '@mojaloop-poc/lib-domain'
import { TransfersTopics } from '../enums'

export interface TransferFulfilRequestedEvtPayload {
  transferId: string
  amount: number
  currency: string
  payerId: string
  payeeId: string
}

export class TransferFulfilRequestedEvt extends DomainEventMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersTopics.DomainEvents

  payload: TransferFulfilRequestedEvtPayload

  constructor (payload: TransferFulfilRequestedEvtPayload) {
    super()

    this.aggregateId = this.msgKey = payload.transferId

    this.payload = payload
  }

  validatePayload (): void{ }
}
