/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { DomainEventMsg } from '@mojaloop-poc/lib-domain'
import { TransferEntity, TransferInternalState } from '../domain/transfer_entity'
import { TransfersAggTopics } from '../domain/transfers_agg'

export class TransferPrepareRequestedEvt extends DomainEventMsg {
  aggregateId: string
  aggregateName: string = 'Transfers'
  msgKey: string
  msgTopic: string = TransfersAggTopics.DomainEvents

  payload: {
    id: string
    amount: number
    currencyId: string
    transferInternalState: TransferInternalState
    payerId: string
    payeeId: string
  }

  constructor (transfer: TransferEntity) {
    super()

    this.aggregateId = this.msgKey = transfer.id

    this.payload = {
      id: transfer.id,
      amount: transfer.amount,
      currencyId: transfer.currencyId,
      transferInternalState: transfer.transferInternalState,
      payerId: transfer.payerId,
      payeeId: transfer.payeeId
    }
  }

  validatePayload (): void{ }
}
