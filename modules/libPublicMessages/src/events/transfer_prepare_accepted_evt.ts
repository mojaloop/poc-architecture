/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { DomainEventMsg } from '@mojaloop-poc/lib-domain'
import { TransfersTopics, TransferInternalState } from '../enums'

export interface TransferPrepareAcceptedEvtPayload {
  transferId: string
  amount: number
  currency: string
  transferInternalState: TransferInternalState
  payerId: string
  payeeId: string
}

export class TransferPrepareAcceptedEvt extends DomainEventMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersTopics.DomainEvents

  payload: TransferPrepareAcceptedEvtPayload

  constructor (payload: TransferPrepareAcceptedEvtPayload) {
    super()

    this.aggregateId = this.msgKey = payload.transferId

    this.payload = payload
  }

  validatePayload (): void{ }
}
