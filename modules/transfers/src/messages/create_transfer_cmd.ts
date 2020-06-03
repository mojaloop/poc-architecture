/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-27.
 */
'use strict'

import { CommandMsg } from '@mojaloop-poc/lib-domain'
import { TransfersAggTopics } from '../domain/transfers_agg'
import { TransferInternalStates } from '../domain/transfer_entity'

export class CreateTransferCmd extends CommandMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersAggTopics.Commands

  payload: {
    id: string
    amount: number
    currencyId: string
    transferInternalStateId: TransferInternalStates
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
      transferInternalStateId: TransferInternalStates.INVALID,
      payerName,
      payeeName
    }
  }

  validatePayload (): void{ }
}
