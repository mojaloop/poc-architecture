/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-27.
 */
'use strict'

import { CommandMsg } from '@mojaloop-poc/lib-domain'
import { TransfersAggTopics } from '../domain/transfers_agg'
import { ParticipantEndpoint } from '@mojaloop-poc/lib-public-messages'

export type FulfilTransferCmdPayload = {
  transferId: string
  amount: string
  currency: string
  payerId: string
  payeeId: string
  payerEndPoints: ParticipantEndpoint[]
  payeeEndPoints: ParticipantEndpoint[]
}

export class FulfilTransferCmd extends CommandMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersAggTopics.Commands

  payload: FulfilTransferCmdPayload

  constructor (payload: FulfilTransferCmdPayload) {
    super()

    this.aggregateId = this.msgKey = payload?.transferId

    this.payload = payload
  }

  validatePayload (): void { }
}
