/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-28.
 */

'use strict'

import { StateEventMsg } from '@mojaloop-poc/lib-domain'
import { TransfersTopics, TransferRawPayload } from '@mojaloop-poc/lib-public-messages'
import { TransferInternalStates } from '../domain/transfer_entity'

export type TransferPreparedStateEvtPayload = {
  transfer: {
    id: string
    amount: string
    currency: string
    transferInternalState: TransferInternalStates
    payerId: string
    payeeId: string
    expiration: string
    condition: string
    prepare: TransferRawPayload
    fulfilment: string
    completedTimestamp: string
    fulfil: TransferRawPayload
    reject: TransferRawPayload
  }
}

export class TransferPreparedStateEvt extends StateEventMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersTopics.StateEvents

  payload: TransferPreparedStateEvtPayload

  constructor (payload: TransferPreparedStateEvtPayload) {
    super()

    this.aggregateId = this.msgKey = payload?.transfer?.id

    this.payload = payload
  }

  validatePayload (): void{ }
}
