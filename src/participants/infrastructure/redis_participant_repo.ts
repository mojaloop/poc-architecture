/**
 * Created by pedrosousabarreto@gmail.com on 24/May/2020.
 */

"use strict";

import * as redis from "redis";
import {IEntityStateRepository} from "../../shared/domain_abstractions/ientity_state_repository";
import {ParticipantState} from "../domain/participant_entity";
import {ILogger} from "../../shared/utilities/logger";

export class RedisParticipantStateRepo implements IEntityStateRepository<ParticipantState>{
	protected _redis_client!: redis.RedisClient;
	private _redis_conn_str:string;
	private _logger:ILogger;
	private _initialized: boolean = false;
	private readonly key_prefix:string = "participant_";

	constructor(conn_str:string, logger:ILogger) {
		this._redis_conn_str = conn_str;
		this._logger = logger;
	}

	init():Promise<void>{
		return new Promise((resolve, reject)=> {
			this._redis_client = redis.createClient({url: this._redis_conn_str});

			this._redis_client.on("ready", () => {
				this._logger.info('Redis client ready');
				if (this._initialized)
					return;

				this._initialized = true;
				return resolve();
			});

			this._redis_client.on('error', (err) => {
				this._logger.error(err, 'A redis error has occurred:');
				if (!this._initialized)
					return reject(err);
			});

		});
	}

	destroy():Promise<void>{
		if(this._initialized)
			this._redis_client.quit();

		return Promise.resolve();
	}


	can_call(): boolean {
		return this._initialized; // for now, no circuit breaker exists
	}

	load(id: string): Promise<ParticipantState|null> {
		return new Promise((resolve, reject)=>{
			if(!this.can_call()) return reject("Repository not ready");

			const key:string = this.key_with_prefix(id);

			this._redis_client.get(key, (err?: Error|null, result?: string) => {
				if (err){
					this._logger.error(err, "Error fetching entity state from redis - for key: "+key);
					return reject();
				}
				if(!result){
					this._logger.debug("Entity state not found in redis - for key: "+key);
					return resolve(null);
				}

				try{
					let state:ParticipantState = JSON.parse(result);
					return resolve(state);
				}catch(err){
					this._logger.error(err, "Error parsing entity state from redis - for key: "+key);
					return reject();
				}
			});
		});
	}

	remove(id:string): Promise<void> {
		return new Promise((resolve, reject)=>{
			if(!this.can_call()) return reject("Repository not ready");

			const key:string = this.key_with_prefix(id);

			this._redis_client.del(key, (err?: Error|null, result?: number) => {
				if (err) {
					this._logger.error(err, "Error removing entity state from redis - for key: "+key);
					return reject();
				}
				if(result !== 1){
					this._logger.debug("Entity state not found in redis - for key: "+key);
					return resolve();
				}

				return resolve();
			});
		});
	}

	store(entity_state: ParticipantState): Promise<void> {
		return new Promise((resolve, reject)=>{
			if(!this.can_call()) return reject("Repository not ready");

			const key:string = this.key_with_prefix(entity_state.id);
			let string_value:string;
			try{
				string_value = JSON.stringify(entity_state);
			}catch(err){
				this._logger.error(err, "Error parsing entity state JSON - for key: "+key);
				return reject();
			}

			this._redis_client.set(key, string_value, (err: Error | null, reply: string) => {
				if (err) {
					this._logger.error(err, "Error storing entity state to redis - for key: "+key);
					return reject();
				}
				if(reply !== "OK"){
					this._logger.error("Unsuccessful attempt to store the entity state in redis - for key: "+key);
					return reject();
				}
				return resolve();
			});
		});
	}


	private key_with_prefix(key:string):string{
		return this.key_prefix + key;
	}

}
