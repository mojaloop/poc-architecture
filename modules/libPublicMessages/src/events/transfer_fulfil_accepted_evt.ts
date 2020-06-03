/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { DomainEventMsg } from '@mojaloop-poc/lib-domain'
import { TransfersTopics, TransferInternalStates } from '../enums'

export interface TransferFulfilAcceptedEvtPayload {
  transferId: string
  amount: number
  currency: string
  TransferInternalStates: TransferInternalStates
  payerId: string
  payeeId: string
}

export class TransferFulfilAcceptedEvt extends DomainEventMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersTopics.DomainEvents

  payload: TransferFulfilAcceptedEvtPayload

  constructor (payload: TransferFulfilAcceptedEvtPayload) {
    super()

    this.aggregateId = this.msgKey = payload.transferId

    this.payload = payload
  }

  validatePayload (): void{ }
}
