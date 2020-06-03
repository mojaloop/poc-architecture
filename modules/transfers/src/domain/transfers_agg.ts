/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { BaseAggregate, IEntityStateRepository, IMessagePublisher, ILogger } from '@mojaloop-poc/lib-domain'
import { DuplicateTransferDetectedEvt, TransferPrepareAcceptedEvt, TransferNotFoundEvt, TransferPreparedEvt } from '@mojaloop-poc/lib-public-messages'
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
    await this.load(commandMsg.payload.transfer.id, false)

    if (this._rootEntity != null) {
      this.recordDomainEvent(new DuplicateTransferDetectedEvt(commandMsg.payload.transfer.id))
      return false
    }

    /* TODO: validation of incoming payload */

    this.create(commandMsg.payload?.transfer?.id)

    const initialState = Object.assign({}, new TransferState(), commandMsg.payload)
    this._rootEntity!.setupInitialState(initialState)

    const TransferPrepareAcceptedEvtPayload = { ...initialState }
    this.recordDomainEvent(new TransferPrepareAcceptedEvt(TransferPrepareAcceptedEvtPayload))

    return true
  }

  async processAckPayerFundsReservedCommand (commandMsg: AckPayerFundsReservedCmd): Promise<boolean> {
    await this.load(commandMsg.payload.id, false)

    if (this._rootEntity === null) {
      this.recordDomainEvent(new TransferNotFoundEvt(commandMsg.payload.id))
      return false
    }

    this._rootEntity.changeStateTo(TransferInternalStates.RESERVED)

    this.recordDomainEvent(new TransferPreparedEvt(this._rootEntity))

    return true
  }
}
