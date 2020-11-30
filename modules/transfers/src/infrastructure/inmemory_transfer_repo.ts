/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { IEntityStateRepository } from '@mojaloop-poc/lib-domain'
import { TransferState } from '../domain/transfer_entity'

export class InMemoryTransferStateRepo implements IEntityStateRepository<TransferState> {
  private readonly _list: Map<string, TransferState> = new Map<string, TransferState>()

  async init (): Promise<void> {
    return await Promise.resolve()
  }

  async destroy (): Promise<void> {
    return await Promise.resolve()
  }

  canCall (): boolean {
    return true
  }

  async load (id: string): Promise<TransferState | null> {
    return await new Promise((resolve, reject) => {
      if (this._list.has(id)) {
        return resolve(this._list.get(id)!)
      } else {
        return resolve(null)
      }
    })
  }

  async remove (id: string): Promise<void> {
    return await new Promise((resolve, reject) => {
      if (!this._list.has(id)) { return reject(new Error('Not found')) } // maybe fail silently?

      this._list.delete(id)
      resolve()
    })
  }

  async store (entityState: TransferState): Promise<void> {
    return await new Promise((resolve, reject) => {
      this._list.set(entityState.id, entityState)
      resolve()
    })
  }
}
