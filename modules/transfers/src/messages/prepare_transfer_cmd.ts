/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-27.
 */
'use strict'

import { CommandMsg } from '@mojaloop-poc/lib-domain'
import { TransfersAggTopics } from '../domain/transfers_agg'

export type PrepareTransferCmdPayload = {
  transferId: string
  amount: string
  currency: string
  payerId: string
  payeeId: string
  expiration: string
  condition: string
  prepare: {
    headers: {[key: string]: string}
    payload: string
  }
}

export class PrepareTransferCmd extends CommandMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersAggTopics.Commands

  payload: PrepareTransferCmdPayload

  constructor (payload: PrepareTransferCmdPayload) {
    super()

    this.aggregateId = this.msgKey = payload?.transferId

    this.payload = payload
  }

  validatePayload (): void { }
}
