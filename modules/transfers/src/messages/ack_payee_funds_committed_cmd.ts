/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-27.
 */
'use strict'

import { CommandMsg } from '@mojaloop-poc/lib-domain'
import { TransfersAggTopics } from '../domain/transfers_agg'
import { ParticipantEndpoint, TransferRawPayload } from '@mojaloop-poc/lib-public-messages'

export type AckPayeeFundsCommittedCmdPayload = {
  transferId: string
  payerEndPoints: ParticipantEndpoint[]
  payeeEndPoints: ParticipantEndpoint[]
  fulfil: TransferRawPayload
}

export class AckPayeeFundsCommittedCmd extends CommandMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersAggTopics.Commands

  payload: AckPayeeFundsCommittedCmdPayload

  constructor (payload: AckPayeeFundsCommittedCmdPayload) {
    super()

    this.aggregateId = this.msgKey = payload?.transferId

    this.payload = payload
  }

  validatePayload (): void { }
}
