/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { BaseAggregate, IEntityStateRepository, IMessagePublisher, ILogger } from '@mojaloop-poc/lib-domain'
import { DuplicateTransferDetectedEvt, TransferPrepareAcceptedEvt, TransferNotFoundEvt, TransferPreparedEvt, TransferPreparedEvtPayload } from '@mojaloop-poc/lib-public-messages'
import { PrepareTransferCmd } from '../messages/prepare_transfer_cmd'
import { TransferEntity, TransferState, TransferInternalStates } from './transfer_entity'
import { TransfersFactory } from './transfers_factory'
import { AckPayerFundsReservedCmd } from '../messages/acknowledge_transfer_funds_cmd'

export enum TransfersAggTopics {
  'Commands' = 'TransferCommands',
  'DomainEvents' = 'TransferDomainEvents',
}

export class TransfersAgg extends BaseAggregate<TransferEntity, TransferState> {
  constructor (entityStateRepo: IEntityStateRepository<TransferState>, msgPublisher: IMessagePublisher, logger: ILogger) {
    super(TransfersFactory.GetInstance(), entityStateRepo, msgPublisher, logger)
    this._registerCommandHandler('PrepareTransferCmd', this.processPrepareTransferCommand)
    this._registerCommandHandler('AckPayerFundsReservedCmd', this.processAckPayerFundsReservedCommand)
  }

  async processPrepareTransferCommand (commandMsg: PrepareTransferCmd): Promise<boolean> {
    // try loading first to detect duplicates

    await this.load(commandMsg.payload.transferId, false)

    if (this._rootEntity != null) {
      this.recordDomainEvent(new DuplicateTransferDetectedEvt(commandMsg.payload.transferId))
      return false
    }

    /* TODO: validation of incoming payload */

    this.create()
    const initialState: TransferState = new TransferState()
    initialState.id = commandMsg.payload.transferId
    initialState.amount = commandMsg.payload.amount
    initialState.currency = commandMsg.payload.currency
    initialState.payerId = commandMsg.payload.payerId
    initialState.payeeId = commandMsg.payload.payeeId
    this._rootEntity!.setupInitialState(initialState)

    const transferPrepareAcceptedEvtPayload = {
      transferId: initialState.id,
      amount: initialState.amount,
      currency: initialState.currency,
      payerId: initialState.payerId,
      payeeId: initialState.payeeId
    }
    this.recordDomainEvent(new TransferPrepareAcceptedEvt(transferPrepareAcceptedEvtPayload))

    return true
  }

  async processAckPayerFundsReservedCommand (commandMsg: AckPayerFundsReservedCmd): Promise<boolean> {
    await this.load(commandMsg.payload.transferId, false)

    if (this._rootEntity === null) {
      this.recordDomainEvent(new TransferNotFoundEvt(commandMsg.payload.transferId))
      return false
    }

    this._rootEntity.changeStateTo(TransferInternalStates.RESERVED)

    const transferPrepareAcceptedEvtPayload: TransferPreparedEvtPayload = {
      transferId: this._rootEntity.id,
      amount: this._rootEntity.amount,
      currency: this._rootEntity.currency,
      payerId: this._rootEntity.payerId,
      payeeId: this._rootEntity.payeeId
    }
    this.recordDomainEvent(new TransferPreparedEvt(transferPrepareAcceptedEvtPayload))

    return true
  }
}
