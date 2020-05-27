/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-27.
 */
'use strict'

import { CommandMsg } from '@mojaloop-poc/lib-domain'
import { TransfersAggTopics } from '../domain/transfers_agg'
import { TransferInternalState } from '../domain/transfer_entity'

export class CreateTransferCmd extends CommandMsg {
  aggregateId: string
  aggregate_name: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersAggTopics.Commands

  payload: {
    id: string
    amount: number
    currencyId: string
    transferInternalStateId: TransferInternalState
    payerName: string
    payeeName: string
  }

  constructor (id: string, amount: number, currencyId: string, payerName: string, payeeName: string) {
    super()

    this.aggregateId = this.msgKey = id

    this.payload = {
      id,
      amount,
      currencyId,
      transferInternalStateId: TransferInternalState.INVALID,
      payerName,
      payeeName
    }
  }
}
