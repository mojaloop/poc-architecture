/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { IDupTransferRepo } from '../domain/transfers_duplicate_repo'

export class InMemoryTransferDuplicateRepo implements IDupTransferRepo {
  private readonly _inMemorySet: Set<string> = new Set<string>()

  async init (): Promise<void> {
    return await Promise.resolve()
  }

  async destroy (): Promise<void> {
    return await Promise.resolve()
  }

  canCall (): boolean {
    return true
  }

  async remove (id: string): Promise<boolean> {
    return await new Promise((resolve, reject) => {
      if (!this._inMemorySet.has(id)) { return reject(new Error('Not found')) } // maybe fail silently?

      this._inMemorySet.delete(id)
      resolve(true)
    })
  }

  async exists (id: string): Promise<boolean> {
    return await new Promise((resolve, reject) => {
      if (this._inMemorySet.has(id)) {
        return resolve(true)
      } else {
        return resolve(false)
      }
    })
  }

  async add (id: string): Promise<boolean> {
    return await new Promise((resolve, reject) => {
      this._inMemorySet.add(id)
      resolve(true)
    })
  }
}
