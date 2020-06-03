/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { DomainEventMsg } from '@mojaloop-poc/lib-domain'
import { TransfersTopics } from '../enums'

export interface TransferPrepareRequestedEvtPayload {
  transferId: string
  amount: number
  currencyId: string
  payerId: string
  payeeId: string
}

export class TransferPrepareRequestedEvt extends DomainEventMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersTopics.DomainEvents

  payload: TransferPrepareRequestedEvtPayload

  constructor (payload: TransferPrepareRequestedEvtPayload) {
    super()

    this.aggregateId = this.msgKey = payload.transferId

    this.payload = payload
  }

  validatePayload (): void{ }
}
