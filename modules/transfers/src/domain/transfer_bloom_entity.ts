/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { BaseEntityState, BaseEntity } from '@mojaloop-poc/lib-domain'

export class TransferBloomState extends BaseEntityState {
  result: boolean
}

export class TransferBloomStateEntity extends BaseEntity<TransferBloomState> {
  get result (): boolean {
    return this._state.result
  }

  static CreateInstance (initialState?: TransferBloomState): TransferBloomStateEntity {
    initialState = initialState ?? new TransferBloomState()

    const entity: TransferBloomStateEntity = new TransferBloomStateEntity(initialState)

    return entity
  }
}
