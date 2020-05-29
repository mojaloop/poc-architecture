/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { IEntityFactory } from '@mojaloop-poc/lib-domain'
import { TransferEntity, TransferState } from './transfer_entity'

export class TransfersFactory implements IEntityFactory<TransferEntity, TransferState> {
  // singleton
  private static _instance: TransfersFactory
  static GetInstance (): TransfersFactory {
    if (this._instance == null) { this._instance = new TransfersFactory() }

    return this._instance
  }

  private constructor () {}

  create (): TransferEntity {
    return TransferEntity.CreateInstance(new TransferState())
  }

  createFromState (initialState: TransferState): TransferEntity {
    return TransferEntity.CreateInstance(initialState)
  }

  createWithId (initialId: string): TransferEntity {
    const initialState: TransferState = new TransferState()
    initialState.id = initialId

    return TransferEntity.CreateInstance(initialState)
  }
}
