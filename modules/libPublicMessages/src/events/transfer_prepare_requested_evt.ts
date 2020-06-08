/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { DomainEventMsg } from '@mojaloop-poc/lib-domain'
import { MLTopics } from '../enums'

export interface TransferPrepareRequestedEvtPayload {
  transferId: string
  amount: number
  currency: string
  payerId: string
  payeeId: string,
  expiration: string,
  condition: string,
  prepare: {
    headers: {[key: string]: string},
    payload: string
  }
}

export class TransferPrepareRequestedEvt extends DomainEventMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string =  MLTopics.DomainEvents

  payload: TransferPrepareRequestedEvtPayload

  constructor (payload: TransferPrepareRequestedEvtPayload) {
    super()

    this.aggregateId = this.msgKey = payload.transferId

    this.payload = payload
  }

  validatePayload (): void{ }
}
