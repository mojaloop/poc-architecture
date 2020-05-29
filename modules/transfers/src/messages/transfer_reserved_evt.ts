/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-28.
 */
'use strict'

import { DomainEventMsg } from '@mojaloop-poc/lib-domain'
import { TransferEntity, TransferInternalState } from '../domain/transfer_entity'
import { TransfersAggTopics } from '../domain/transfers_agg'

export class TransferReservedEvt extends DomainEventMsg {
  aggregateId: string
  aggregate_name: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersAggTopics.DomainEvents

  payload: {
    id: string
    amount: number
    currencyId: string
    transferInternalStateId: TransferInternalState
    payerName: string
    payeeName: string
  }

  constructor (transfer: TransferEntity) {
    super()

    this.aggregateId = this.msgKey = transfer.id

    this.payload = {
      id: transfer.id,
      amount: transfer.amount,
      currencyId: transfer.currencyId,
      transferInternalStateId: transfer.transferInternalStateId,
      payerName: transfer.payerName,
      payeeName: transfer.payeeName
    }
  }
}
