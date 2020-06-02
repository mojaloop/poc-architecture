/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-27.
 */
'use strict'

import { CommandMsg } from '@mojaloop-poc/lib-domain'
import { TransfersAggTopics } from '../domain/transfers_agg'
import { TransferInternalState } from '../domain/transfer_entity'

export class PrepareTransferCmd extends CommandMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersAggTopics.Commands

  payload: {
    id: string
    amount: number
    currencyId: string
    transferInternalState: TransferInternalState
    payerId: string
    payeeId: string
  }

  constructor (id: string, amount: number, currencyId: string, payerId: string, payeeId: string) {
    super()

    this.aggregateId = this.msgKey = id

    this.payload = {
      id,
      amount,
      currencyId,
      transferInternalState: TransferInternalState.INVALID,
      payerId,
      payeeId
    }
  }

  validatePayload (): void{ }
}
