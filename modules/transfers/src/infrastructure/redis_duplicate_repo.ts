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

import * as redis from 'redis'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { IDuplicateTransfersRepo } from '../domain/transfers_repo'
import { TransferBloomState } from '../domain/transfer_bloom_entity'
// import * as BloomRedis from 'bloom-redis'
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const BloomRedis = require('bloom-redis')

export class RedisTransferDuplicateRepo implements IDuplicateTransfersRepo {
  protected _redisClient!: redis.RedisClient
  private readonly _redisConnStr: string
  private readonly _logger: ILogger
  private _initialized: boolean = false
  private readonly keyPrefix: string = 'transfer_'
  private _redisBloomFilter!: any
  private readonly _filterSizeInBytes: number
  private readonly _numOfHashes: number

  constructor (connStr: string, filterSizeInBytes: number, numOfHashes: number, logger: ILogger) {
    this._redisConnStr = connStr
    this._logger = logger
    this._filterSizeInBytes = filterSizeInBytes
    this._numOfHashes = numOfHashes
  }

  async init (): Promise<void> {
    return await new Promise((resolve, reject) => {
      this._redisClient = redis.createClient({ url: this._redisConnStr })

      this._redisClient.on('ready', () => {
        this._logger.info('Redis client ready')
        if (this._initialized) { return }
        this._redisBloomFilter = new BloomRedis.BloomFilter({
          client: this._redisClient, // make sure the Bloom module uses our newly created connection to Redis
          key: 'transfer-bloom-filter', // the Redis key

          // calculated size of the Bloom filter.
          // This is where your size / probability trade-offs are made
          // http://hur.st/bloomfilter?n=100000&p=1.0E-6
          // size: 3354770433, // ~500MB
          size: this._filterSizeInBytes,
          // size      : 3354770, // ~500MB
          // numHashes: 23
          numHashes: this._numOfHashes
        })
        this._initialized = true
        return resolve()
      })

      this._redisClient.on('error', (err) => {
        this._logger.error(err, 'A redis error has occurred:')
        if (!this._initialized) { return reject(err) }
      })
    })
  }

  async destroy (): Promise<void> {
    if (this._initialized) { this._redisClient.quit() }

    return await Promise.resolve()
  }

  canCall (): boolean {
    return this._initialized // for now, no circuit breaker exists
  }

  async load (id: string): Promise<TransferBloomState | null> {
    return await new Promise((resolve, reject) => {
      if (!this.canCall()) return reject(new Error('Repository not ready'))

      const key: string = this.keyWithPrefix(id)

      this._redisBloomFilter.contains(
        key, // the key from the query string
        (err: Error, result: boolean) => {
          if (err != null) {
            return reject(err)
          } else {
            const transferBloomState: TransferBloomState = new TransferBloomState()
            transferBloomState.id = id
            transferBloomState.result = result
            return resolve(transferBloomState)
          }
        }
      )
    })
  }

  async remove (id: string): Promise<void> {
    return await new Promise((resolve, reject) => {
      throw Error('not implemented')
    })
  }

  async store (entityState: TransferBloomState): Promise<void> {
    return await new Promise((resolve, reject) => {
      if (!this.canCall()) return reject(new Error('Repository not ready'))

      const key: string = this.keyWithPrefix(entityState.id)
      this._redisBloomFilter.add(
        key,
        (err: Error) => {
          if (err != null) {
            return reject(err)
          } else {
            return resolve()
          }
        }
      )
    })
  }

  private keyWithPrefix (key: string): string {
    return this.keyPrefix + key
  }
}
