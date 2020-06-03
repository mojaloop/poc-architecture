/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { DomainEventMsg } from '@mojaloop-poc/lib-domain'
import { TransferEntity, TransferInternalStates } from '../domain/transfer_entity'
import { TransfersAggTopics } from '../domain/transfers_agg'

export interface TransferCreatedEvtPayload {
  id: string
  amount: number
  currencyId: string
  transferInternalStateId: TransferInternalStates
  payerName: string
  payeeName: string
}

export class TransferCreatedEvt extends DomainEventMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersAggTopics.DomainEvents

  payload: TransferCreatedEvtPayload

  constructor (payload: TransferCreatedEvtPayload) {
    super()

    this.aggregateId = this.msgKey = payload.id

    this.payload = payload
  }

  validatePayload (): void{ }
}
