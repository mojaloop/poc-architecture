/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-28.
 */
'use strict'

import { DomainEventMsg } from '@mojaloop-poc/lib-domain'
import { TransferEntity, TransferInternalStates } from '../domain/transfer_entity'
import { TransfersAggTopics } from '../domain/transfers_agg'

export class TransferPreparedEvt extends DomainEventMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersAggTopics.DomainEvents

  payload: {
    transferId: string
    amount: number
    currencyId: string
    TransferInternalStates: TransferInternalStates
    payerId: string
    payeeId: string
  }

  constructor (transfer: TransferEntity) {
    super()

    this.aggregateId = this.msgKey = transfer.transferId

    this.payload = {
      transferId: transfer.transferId,
      amount: transfer.amount,
      currencyId: transfer.currencyId,
      TransferInternalStates: transfer.TransferInternalStates,
      payerId: transfer.payerId,
      payeeId: transfer.payeeId
    }
  }

  validatePayload (): void{ }
}
