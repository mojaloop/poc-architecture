/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { BaseAggregate, IEntityStateRepository, IMessagePublisher, ILogger } from '@mojaloop-poc/lib-domain'
import { DuplicateTransferDetectedEvt, TransferPrepareAcceptedEvt, TransferFulfilledEvt, TransferFulfilledEvtPayload, TransferNotFoundEvt, TransferPreparedEvt, TransferPreparedEvtPayload, InvalidTransferEvt, InvalidTransferEvtPayload, TransferFulfilAcceptedEvt } from '@mojaloop-poc/lib-public-messages'
import { PrepareTransferCmd } from '../messages/prepare_transfer_cmd'
import { TransferEntity, TransferState, TransferInternalStates, PrepareTransferData } from './transfer_entity'
import { TransfersFactory } from './transfers_factory'
import { AckPayerFundsReservedCmd } from '../messages/ack_payer_funds_reserved_cmd'
import { FulfilTransferCmd } from '../messages/fulfil_transfer_cmd'
import { logger } from '../application'
import { AckPayeeFundsCommitedCmd } from '../messages/ack_payee_funds_reserved_cmd'

export enum TransfersAggTopics {
  'Commands' = 'TransferCommands',
  'DomainEvents' = 'TransferDomainEvents',
}

export class TransfersAgg extends BaseAggregate<TransferEntity, TransferState> {
  constructor (entityStateRepo: IEntityStateRepository<TransferState>, msgPublisher: IMessagePublisher, logger: ILogger) {
    super(TransfersFactory.GetInstance(), entityStateRepo, msgPublisher, logger)
    this._registerCommandHandler('PrepareTransferCmd', this.processPrepareTransferCommand)
    this._registerCommandHandler('AckPayerFundsReservedCmd', this.processAckPayerFundsReservedCommand)
    this._registerCommandHandler('AckPayeeFundsCommitedCmd', this.processAckPayeeFundsReservedCommand)
    this._registerCommandHandler('FulfilTransferCmd', this.processFulfilTransferCommand)
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
    const transferPrepareRequestData: PrepareTransferData = {
      id: commandMsg.payload.transferId,
      amount: commandMsg.payload.amount,
      currency: commandMsg.payload.currency,
      payerId: commandMsg.payload.payerId,
      payeeId: commandMsg.payload.payeeId
    }
    this._rootEntity!.prepareTransfer(transferPrepareRequestData)

    const transferPrepareAcceptedEvtPayload = {
      transferId: transferPrepareRequestData.id,
      amount: transferPrepareRequestData.amount,
      currency: transferPrepareRequestData.currency,
      payerId: transferPrepareRequestData.payerId,
      payeeId: transferPrepareRequestData.payeeId
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

    if (this._rootEntity.transferInternalState !== TransferInternalStates.RECEIVED_PREPARE) {
      const invalidTransferEvtPayload: InvalidTransferEvtPayload = {
        transferId: commandMsg.payload.transferId,
        reason: `transfer in invalid state of ${this._rootEntity.transferInternalState} while should be RECEIVED_PREPARE`
      }

      this.recordDomainEvent(new InvalidTransferEvt(invalidTransferEvtPayload))
      logger.info(`InvalidTransferEvtPayload: ${JSON.stringify(invalidTransferEvtPayload)}`)
      return false
    }

    this._rootEntity.acknowledgeTransferReserved()

    const transferPreparedEvtPayload: TransferPreparedEvtPayload = {
      transferId: this._rootEntity.id,
      amount: this._rootEntity.amount,
      currency: this._rootEntity.currency,
      payerId: this._rootEntity.payerId,
      payeeId: this._rootEntity.payeeId
    }
    this.recordDomainEvent(new TransferPreparedEvt(transferPreparedEvtPayload))

    return true
  }

  async processFulfilTransferCommand (commandMsg: FulfilTransferCmd): Promise<boolean> {
    await this.load(commandMsg.payload.transferId, false)

    if (this._rootEntity === null) {
      this.recordDomainEvent(new TransferNotFoundEvt(commandMsg.payload.transferId))
      return false
    }

    if (this._rootEntity.transferInternalState !== TransferInternalStates.RESERVED) {
      const invalidTransferEvtPayload: InvalidTransferEvtPayload = {
        transferId: commandMsg.payload.transferId,
        reason: `transfer in invalid state of ${this._rootEntity.transferInternalState} while should be RESERVED`
      }

      this.recordDomainEvent(new InvalidTransferEvt(invalidTransferEvtPayload))
      logger.info(`InvalidTransferEvtPayload: ${JSON.stringify(invalidTransferEvtPayload)}`)
      return false
    }

    /* TODO: validation of incoming payload */

    this._rootEntity.fulfilTransfer()

    const transferFulfilAcceptedEvtPayload = {
      transferId: this._rootEntity.id,
      amount: this._rootEntity.amount,
      currency: this._rootEntity.currency,
      payerId: this._rootEntity.payerId,
      payeeId: this._rootEntity.payeeId
    }
    this.recordDomainEvent(new TransferFulfilAcceptedEvt(transferFulfilAcceptedEvtPayload))

    return true
  }

  async processAckPayeeFundsReservedCommand (commandMsg: AckPayeeFundsCommitedCmd): Promise<boolean> {
    await this.load(commandMsg.payload.transferId, false)

    if (this._rootEntity === null) {
      this.recordDomainEvent(new TransferNotFoundEvt(commandMsg.payload.transferId))
      return false
    }

    if (this._rootEntity.transferInternalState !== TransferInternalStates.RECEIVED_FULFIL) {
      const invalidTransferEvtPayload: InvalidTransferEvtPayload = {
        transferId: commandMsg.payload.transferId,
        reason: `transfer in invalid state of ${this._rootEntity.transferInternalState} while should be RECEIVED_FULFIL`
      }

      this.recordDomainEvent(new InvalidTransferEvt(invalidTransferEvtPayload))
      logger.info(`InvalidTransferEvtPayload: ${JSON.stringify(invalidTransferEvtPayload)}`)
      return false
    }

    this._rootEntity.commitTransfer()

    const transferFulfiledEvtPayload: TransferFulfilledEvtPayload = {
      transferId: this._rootEntity.id,
      amount: this._rootEntity.amount,
      currency: this._rootEntity.currency,
      payerId: this._rootEntity.payerId,
      payeeId: this._rootEntity.payeeId
    }
    this.recordDomainEvent(new TransferFulfilledEvt(transferFulfiledEvtPayload))

    return true
  }
}
