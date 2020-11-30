/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-28.
 */

'use strict'

import { StateEventMsg } from '@mojaloop-poc/lib-domain'
import { TransfersTopics } from '@mojaloop-poc/lib-public-messages'
import { TransferInternalStates } from '../domain/transfer_entity'

export type TransferStateChangedStateEvtPayload = {
  transfer: {
    id: string
    transferInternalState: TransferInternalStates
  }
}

export class TransferStateChangedStateEvt extends StateEventMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersTopics.StateEvents

  payload: TransferStateChangedStateEvtPayload

  constructor (payload: TransferStateChangedStateEvtPayload) {
    super()

    this.aggregateId = this.msgKey = payload?.transfer?.id

    this.payload = payload
  }

  validatePayload (): void { }
}
