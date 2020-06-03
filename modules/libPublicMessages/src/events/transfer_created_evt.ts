/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { DomainEventMsg } from '@mojaloop-poc/lib-domain'
import { TransfersTopics } from '../enums'

export interface TransferCreatedEvtPayload {
  id: string
  amount: number
  currencyId: string
  payerName: string
  payeeName: string
}

export class TransferCreatedEvt extends DomainEventMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersTopics.DomainEvents

  payload: TransferCreatedEvtPayload

  constructor (payload: TransferCreatedEvtPayload) {
    super()

    this.aggregateId = this.msgKey = payload.id

    this.payload = payload
  }

  validatePayload (): void{ }
}
