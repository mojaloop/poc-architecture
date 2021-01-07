/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list (alphabetical ordering) of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Coil
 - Donovan Changfoot <donovan.changfoot@coil.com>

 * Crosslake
 - Pedro Sousa Barreto <pedrob@crosslaketech.com>

 * ModusBox
 - Miguel de Barros <miguel.debarros@modusbox.com>
 - Roman Pietrzak <roman.pietrzak@modusbox.com>

 --------------
******/

'use strict'

import { ILogger, IEntityStateRepository } from '@mojaloop-poc/lib-domain'

import { TransferState } from '../domain/transfer_entity'
import NodeCache from 'node-cache'

export class InMemoryNodeCacheTransferStateRepo implements IEntityStateRepository<TransferState> {
  private readonly _logger: ILogger
  private readonly _nodeCache: NodeCache
  private readonly _initialized: boolean = false
  private readonly _expirationInSeconds: number

  constructor (logger: ILogger, expirationInSeconds: number = -1) {
    this._expirationInSeconds = expirationInSeconds
    this._nodeCache = new NodeCache({
      stdTTL: 100, // (default: 0) the standard ttl as number in seconds for every generated cache element. 0 = unlimited
      checkperiod: 120, // (default: 600) The period in seconds, as a number, used for the automatic delete check interval. 0 = no periodic check.
      useClones: false // (default: true) en/disable cloning of variables. If true you'll get a copy of the cached variable. If false you'll save and get just the reference.
      // deleteOnExpire: true, // (default: true) whether variables will be deleted automatically when they expire. If true the variable will be deleted. If false the variable will remain. You are encouraged to handle the variable upon the event expired by yourself.
      // maxKeys: -1 // (default: -1) specifies a maximum amount of keys that can be stored in the cache. If a new item is set and the cache is full, an error is thrown and the key will not be saved in the cache. -1 disables the key limit.
    })
  }

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
      if (this._nodeCache.has(id)) {
        const result: TransferState | null | undefined = this._nodeCache.get(id)
        return resolve(result!)
      } else {
        return resolve(null)
      }
    })
  }

  async remove (id: string): Promise<void> {
    return await new Promise((resolve, reject) => {
      if (!this._nodeCache.has(id)) { return reject(new Error('Not found')) } // maybe fail silently?
      this._nodeCache.del(id)
      resolve()
    })
  }

  async store (entityState: TransferState): Promise<void> {
    return await new Promise((resolve, reject) => {
      this._nodeCache.set(entityState.id, entityState, this._expirationInSeconds)
      resolve()
    })
  }
}
