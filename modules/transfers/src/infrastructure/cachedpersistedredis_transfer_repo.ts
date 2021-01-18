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

import { ILogger } from '@mojaloop-poc/lib-domain'
import { TransferState } from '../domain/transfer_entity'
import { ITransfersRepo } from '../domain/transfers_repo'
import NodeCache from 'node-cache'
import * as redis from 'redis'
// @ts-expect-error
import RedisClustr = require('redis-clustr')

export class CachedPersistedRedisTransferStateRepo implements ITransfersRepo {
  protected _redisClient!: redis.RedisClient
  protected _redisClustered: boolean
  private readonly _redisConnStr: string
  private readonly _redisConnClusterHost: string
  private readonly _redisConnClusterPort: number
  private readonly _logger: ILogger
  private _initialized: boolean = false
  private readonly keyPrefix: string = 'transfer_'
  private readonly _expirationInSeconds: number
  // private readonly _inMemorylist: Map<string, TransferState> = new Map<string, TransferState>()
  private readonly _nodeCache: NodeCache

  constructor (connStr: string, clusteredRedis: boolean, logger: ILogger, expirationInSeconds: number = -1) {
    this._redisConnStr = connStr
    this._redisClustered = clusteredRedis
    this._logger = logger
    this._expirationInSeconds = expirationInSeconds
    this._nodeCache = new NodeCache({
      stdTTL: 100, // (default: 0) the standard ttl as number in seconds for every generated cache element. 0 = unlimited
      checkperiod: 120, // (default: 600) The period in seconds, as a number, used for the automatic delete check interval. 0 = no periodic check.
      useClones: false // (default: true) en/disable cloning of variables. If true you'll get a copy of the cached variable. If false you'll save and get just the reference.
      // deleteOnExpire: true, // (default: true) whether variables will be deleted automatically when they expire. If true the variable will be deleted. If false the variable will remain. You are encouraged to handle the variable upon the event expired by yourself.
      // maxKeys: -1 // (default: -1) specifies a maximum amount of keys that can be stored in the cache. If a new item is set and the cache is full, an error is thrown and the key will not be saved in the cache. -1 disables the key limit.
    })

    const splited = connStr.split('//')[1]
    this._redisConnClusterHost = splited.split(':')[0]
    this._redisConnClusterPort = Number.parseInt(splited.split(':')[1])
  }

  async init (): Promise<void> {
    return await new Promise((resolve, reject) => {
      if (this._redisClustered) {
        this._redisClient = new RedisClustr({
          servers: [{ host: this._redisConnClusterHost, port: this._redisConnClusterPort }]
        })
      } else {
        this._redisClient = redis.createClient({ url: this._redisConnStr })
      }

      this._redisClient.on('ready', () => {
        this._logger.isInfoEnabled() && this._logger.info('Redis client ready')
        if (this._initialized) { return }

        this._initialized = true
        return resolve()
      })

      this._redisClient.on('error', (err: Error) => {
        this._logger.isErrorEnabled() && this._logger.error(err, 'A redis error has occurred:')
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

  async load (id: string): Promise<TransferState | null> {
    return await new Promise((resolve, reject) => {
      if (!this.canCall()) return reject(new Error('Repository not ready'))

      const key: string = this.keyWithPrefix(id)

      if (this._nodeCache.has(key)) {
        const result: TransferState | null | undefined = this._nodeCache.get(key)
        return resolve(result!)
      }

      this._redisClient.get(key, (err: Error | null, result: string | null) => {
        if (err != null) {
          this._logger.isErrorEnabled() && this._logger.error(err, 'Error fetching entity state from redis - for key: ' + key)
          return reject(err)
        }
        if (result == null) {
          this._logger.isDebugEnabled() && this._logger.debug('Entity state not found in redis - for key: ' + key)
          return resolve(null)
        }
        try {
          const state: TransferState = JSON.parse(result)

          this._nodeCache.set(key, state, this._expirationInSeconds)

          return resolve(state)
        } catch (err) {
          this._logger.isErrorEnabled() && this._logger.error(err, 'Error parsing entity state from redis - for key: ' + key)
          return reject(err)
        }
      })
    })
  }

  async remove (id: string): Promise<void> {
    return await new Promise((resolve, reject) => {
      if (!this.canCall()) return reject(new Error('Repository not ready'))

      const key: string = this.keyWithPrefix(id)

      if (this._nodeCache.has(key)) {
        this._nodeCache.del(key)
      }

      this._redisClient.del(key, (err?: Error|null, result?: number) => {
        if (err != null) {
          this._logger.isErrorEnabled() && this._logger.error(err, 'Error removing entity state from redis - for key: ' + key)
          return reject(err)
        }
        if (result !== 1) {
          this._logger.isDebugEnabled() && this._logger.debug('Entity state not found in redis - for key: ' + key)
          return resolve()
        }

        return resolve()
      })
    })
  }

  async store (entityState: TransferState): Promise<void> {
    return await new Promise((resolve, reject) => {
      if (!this.canCall()) return reject(new Error('Repository not ready'))

      const key: string = this.keyWithPrefix(entityState.id)

      this._logger.isDebugEnabled() && this._logger.debug(`CachedRedisParticipantStateRepo::store - storing ${entityState.id} in-memory only!`)

      this._nodeCache.set(key, entityState, this._expirationInSeconds)

      let stringValue: string
      try {
        stringValue = JSON.stringify(entityState)
      } catch (err) {
        this._logger.isErrorEnabled() && this._logger.error(err, 'CachedRedisParticipantStateRepo::store - Error parsing entity state JSON - for key: ' + key)
        return reject(err)
      }

      if (stringValue === null) {
        return resolve()
      }

      this._redisClient.setex(key, this._expirationInSeconds, stringValue, (err: Error | null, reply: string) => {
        if (err != null) {
          this._logger.isErrorEnabled() && this._logger.error(err, 'CachedRedisParticipantStateRepo::store - Error storing entity state to redis - for key: ' + key)
          return reject(err)
        }
        if (reply !== 'OK') {
          this._logger.isErrorEnabled() && this._logger.error('CachedRedisParticipantStateRepo::store - Unsuccessful attempt to store the entity state in redis - for key: ' + key)
          return reject(err)
        }
        return resolve()
      })
    })
  }

  async storeMany (entityStates: TransferState[]): Promise<void> {
    return await new Promise((resolve, reject) => {
      if (!this.canCall()) return reject(new Error('Repository not ready'))

      // Array to store all keys being processed, mainly for handling errors on the mset operation.
      const keys: string[] = []

      const redisMultiClient = this._redisClient.multi()

      entityStates.forEach((entityState: TransferState) => {
        const key: string = this.keyWithPrefix(entityState.id)

        this._logger.isDebugEnabled() && this._logger.debug(`CachedRedisParticipantStateRepo::storeMany - storing ${entityState.id} in-memory only!`)

        this._nodeCache.set(key, entityState, this._expirationInSeconds)

        let stringValue: string
        try {
          stringValue = JSON.stringify(entityState)
        } catch (err) {
          this._logger.isErrorEnabled() && this._logger.error(err, 'Error parsing entity state JSON - for key: ' + key)
          return reject(err)
        }

        if (stringValue === null) {
          return resolve()
        }

        this._logger.isDebugEnabled() && this._logger.debug(`CachedRedisParticipantStateRepo::storeMany - scheduling setex - for key: ${key}`)
        redisMultiClient.setex(key, this._expirationInSeconds, stringValue)
        keys.push(key)
      })

      this._logger.isDebugEnabled() && this._logger.debug(`CachedRedisParticipantStateRepo::storeMany - executing batch - for keys: ${JSON.stringify(keys)}`)
      redisMultiClient.exec((err: Error | null, replies: any) => {
        if (err != null) {
          this._logger.isErrorEnabled() && this._logger.error(err, 'CachedRedisParticipantStateRepo::storeMany - Error storing entity state to redis - for keys: ' + JSON.stringify(keys))
          return reject(err)
        }
        if (Array.isArray(replies)) {
          if (replies.length === 0) {
            this._logger.isErrorEnabled() && this._logger.error('CachedRedisParticipantStateRepo::storeMany - Unsuccessful attempt to store the entity state in redis - for keys: ' + JSON.stringify(keys))
            return reject(new Error('Unsuccessful attempt to store the entity state in redis - for keys: ' + JSON.stringify(keys)))
          }
          replies.forEach((reply, index) => {
            // TODO: Need to see if there are any failed replies here, and determine how best to deal with it.
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            this._logger.isDebugEnabled() && this._logger.debug(`CachedRedisParticipantStateRepo::storeMany - Reply ${index}:${reply.toString()}`)
          })
        } else {
          this._logger.isDebugEnabled() && this._logger.debug(`CachedRedisParticipantStateRepo::storeMany - Replies ${JSON.stringify(replies)}`)
        }
        return resolve()
      })
    })
  }

  /// / Commented this out for the above method to use multi-batch request which suppors expiration of entries.
  // async storeMany (entityStates: TransferState[]): Promise<void> {
  //   return await new Promise((resolve, reject) => {
  //     if (!this.canCall()) return reject(new Error('Repository not ready'))

  //     // Array to store redisClient.mset arguments.
  //     const redisArgs: string[] = []
  //     // Array to store all keys being processed, mainly for handling errors on the mset operation.
  //     const keys: string[] = []

  //     entityStates.forEach( (entityState:TransferState) => {
  //       const key: string = this.keyWithPrefix(entityState.id)

  //       this._logger.isDebugEnabled() && this._logger.debug(`CachedRedisParticipantStateRepo::store - storing ${entityState.id} in-memory only!`)

  //       this._logger.isWarnEnabled() && this._logger.debug(`CachedRedisParticipantStateRepo::store - warning storeMany does not support expiration of cache entry!`)
  //       // This is disabled due to redis not supporting mset with expiration. See below comment above the mset operation for more information.
  //       // this._nodeCache.set(key, entityState, this._expirationInSeconds)
  //       this._nodeCache.set(key, entityState)

  //       let stringValue: string
  //       try {
  //         stringValue = JSON.stringify(entityState)
  //       } catch (err) {
  //         this._logger.isErrorEnabled() && this._logger.error(err, 'Error parsing entity state JSON - for key: ' + key)
  //         return reject(err)
  //       }

  //       if (stringValue === null) {
  //         return resolve()
  //       }
  //       redisArgs.push(key)
  //       redisArgs.push(stringValue)
  //       keys.push(key)
  //     } )

  //     this._logger.isWarnEnabled() && this._logger.debug(`CachedRedisParticipantStateRepo::store - warning storeMany does not support expiration of store entry!`)
  //     // There unfortunately is no mset operation that supports setting expiration of each key-value. Ref: https://github.com/redis/redis/issues/5867
  //     this._redisClient.mset(...redisArgs, (err: Error | null, reply: boolean) => {
  //       if (err != null) {
  //         this._logger.isErrorEnabled() && this._logger.error(err, 'Error storing entity state to redis - for keys: ' + JSON.stringify(keys))
  //         return reject(err)
  //       }
  //       if (reply !== true) {
  //         this._logger.isErrorEnabled() && this._logger.error('Unsuccessful attempt to store the entity state in redis - for keys: ' + JSON.stringify(keys))
  //         return reject(new Error('Unsuccessful attempt to store the entity state in redis - for keys: ' + JSON.stringify(keys)))
  //       }
  //       return resolve()
  //     })
  //   })
  // }

  private keyWithPrefix (key: string): string {
    return this.keyPrefix + key
  }
}
