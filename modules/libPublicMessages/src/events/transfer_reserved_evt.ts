/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-28.
 */
'use strict'

import { DomainEventMsg } from '@mojaloop-poc/lib-domain'
import { TransfersTopics } from '../enums'

export interface TransferPreparedEvtPayload {
  id: string
  amount: number
  currency: string
  payerId: string
  payeeId: string
}

export class TransferPreparedEvt extends DomainEventMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersTopics.DomainEvents

  payload: TransferPreparedEvtPayload

  constructor (transfer: TransferPreparedEvtPayload) {
    super()

    this.aggregateId = this.msgKey = transfer.id

    this.payload = {
      id: transfer.id,
      amount: transfer.amount,
      currency: transfer.currency,
      payerId: transfer.payerId,
      payeeId: transfer.payeeId
    }
  }

  validatePayload (): void{ }
}
