/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { BaseAggregate, IEntityStateRepository, IMessagePublisher, ILogger } from '@mojaloop-poc/lib-domain'
import { CreateTransferCmd } from '../messages/create_transfer_cmd'
import { TransferCreatedEvt } from '../messages/transfer_created_evt'
import { DuplicateTransferDetectedEvt } from '../messages/duplicate_transfer_evt'
import { UnknownTransferEvt } from '../messages/unknown_transfer_evt'
import { TransferEntity, TransferState, TransferInternalState } from './transfer_entity'
import { TransfersFactory } from './transfers_factory'
import { TransferReservedEvt } from '../messages/transfer_reserved_evt'
import { AcknowledgeTransferFundsCmd } from '../messages/acknowledge_transfer_funds_cmd'

export enum TransfersAggTopics {
  'Commands' = 'TransferCommands',
  'DomainEvents' = 'TransferDomainEvents',
}

export class TransfersAgg extends BaseAggregate<TransferEntity, TransferState> {
  constructor (entityStateRepo: IEntityStateRepository<TransferState>, msgPublisher: IMessagePublisher, logger: ILogger) {
    super(TransfersFactory.GetInstance(), entityStateRepo, msgPublisher, logger)
    this._registerCommandHandler('CreateTransferCmd', this.processCreateTransferCommand)
    this._registerCommandHandler('AcknowledgeTransferFundsCmd', this.processAcknowledgeTransferFundsReservedCommand)
  }

  async processCreateTransferCommand (commandMsg: CreateTransferCmd): Promise<boolean> {
    // try loading first to detect duplicates
    await this.load(commandMsg.payload.id, false)

    if (this._rootEntity != null) {
      this.recordDomainEvent(new DuplicateTransferDetectedEvt(commandMsg.payload.id))
      return false
    }

    /* TODO: validation of incoming payload */

    this.create(commandMsg.payload.id)

    this._rootEntity!.setupInitialState(
      commandMsg.payload.amount,
      commandMsg.payload.currencyId,
      commandMsg.payload.payerName,
      commandMsg.payload.payeeName
    )

    this.recordDomainEvent(new TransferCreatedEvt(this._rootEntity!))

    return true
  }

  async processAcknowledgeTransferFundsReservedCommand (commandMsg: AcknowledgeTransferFundsCmd): Promise<boolean> {
    await this.load(commandMsg.payload.id, false)

    if (this._rootEntity === null) {
      this.recordDomainEvent(new UnknownTransferEvt(commandMsg.payload.id))
      return false
    }

    this._rootEntity.changeStateTo(TransferInternalState.RESERVED)

    this.recordDomainEvent(new TransferReservedEvt(this._rootEntity))

    return true
  }
}
