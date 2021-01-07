/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-28.
 */

'use strict'

import { StateEventMsg } from '@mojaloop-poc/lib-domain'
import { TransfersTopics, TransferRawPayload } from '@mojaloop-poc/lib-public-messages'
import { TransferInternalStates } from '../domain/transfer_entity'

export type TransferFulfiledStateEvtPayload = {
  transfer: {
    id: string
    fulfilment: string
    completedTimestamp: string
    fulfil: TransferRawPayload
    transferInternalState: TransferInternalStates
  }
}

export class TransferFulfiledStateEvt extends StateEventMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersTopics.StateEvents

  payload: TransferFulfiledStateEvtPayload

  constructor (payload: TransferFulfiledStateEvtPayload) {
    super()

    this.aggregateId = this.msgKey = payload?.transfer?.id

    this.payload = payload
  }

  validatePayload (): void { }
}
