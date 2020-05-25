/**
 * Created by pedrosousabarreto@gmail.com on 21/May/2020.
 */

"use strict";

import {BaseEntity} from "./base_entity";
import {BaseEntityState} from "./base_entity_state";
import {CommandMsg, DomainEventMsg, IDomainMessage} from "./messages";
import {IMessagePublisher} from "./imessage_publisher";
import {IEntityStateRepository} from "./ientity_state_repository";
import {IEntityFactory} from "./entity_factory";
import {ConsoleLogger, ILogger} from "../utilities/logger";

export abstract class BaseAggregate<E extends BaseEntity<S>,S extends BaseEntityState>{
	protected _logger:ILogger;
	// private _event_handlers: Map<string, (event:DomainEventMsg)=>Promise<void>>;
	private _command_handlers: Map<string, (cmd:CommandMsg)=>Promise<boolean>>;

	private _uncommitted_events:DomainEventMsg[];
	protected _root_entity:E | null;

	protected _entity_factory:IEntityFactory<E, S>;
	protected _msg_publisher:IMessagePublisher;
	protected _entity_state_repo:IEntityStateRepository<S>;

	constructor(entity_factory:IEntityFactory<E, S>, entity_state_repo:IEntityStateRepository<S>, msg_publisher:IMessagePublisher, logger?:ILogger) {
		this._logger = logger ? logger : new ConsoleLogger();

		// this._event_handlers = new Map<string, (event:DomainEventMsg, replayed?:boolean)=>Promise<void>>();
		this._command_handlers = new Map<string, (cmd:CommandMsg)=>Promise<boolean>>();
		this._uncommitted_events = [];
		this._root_entity = null;

		this._entity_factory = entity_factory;

		this._entity_state_repo = entity_state_repo;
		this._msg_publisher = msg_publisher;
	}

	async process_command(command_msg: CommandMsg): Promise<boolean>{
		return new Promise(async (resolve, reject)=>{
			const handler = this._command_handlers.get(command_msg.msg_name);
			if(!handler)
				return reject("Aggregate doesn't have a handler for a command with name" +  command_msg.msg_name);

			this._reset_state();
			// the local cmd handler code must either load or create the aggregate

			// TODO check for consistency, ie, versions
			await handler.call(this, command_msg).then(async (result:boolean)=>{
				await this.commit(); // send out the unpublished events regardless

				// until we have full event sourcing we have to persist
				if (result != true) {
					this._logger.info(`Command '${command_msg.msg_name}' execution failed`);
					return reject();
				}

				await this._entity_state_repo.store(this._root_entity!.export_state());
				this._logger.info(`Aggregate state persisted to repository at the end of command: ${command_msg.msg_name}`);
				return resolve();
			}).catch(async (err)=>{
				await this.commit(); // we still send out the unpublished events
				this._logger.error(err, `Aggregate state persited to repoistory at the end of command: ${command_msg.msg_name}`);

				reject(err);
			});

		});
	}

	/*protected _register_event_handler(event_name:string, handler:(event:DomainEventMsg, replayed?:boolean)=>Promise<void>){
		this._event_handlers.set(event_name, handler);
	}*/

	protected _register_command_handler(cmd_name:string, handler:(event:CommandMsg)=>Promise<boolean>){
		this._command_handlers.set(cmd_name, handler);
	}

/*	private apply_event(event_msg: DomainEventMsg, replayed?: boolean): Promise<void>{
		return new Promise(async(resolve, reject)=>{
			const handler: ((event: DomainEventMsg, replayed?:boolean) => Promise<void>) | undefined = this._event_handlers.get(event_msg.header.msg_name);
			if (!handler)
				return reject("Aggregate doesn't have a handler for event with name" +  event_msg.header.msg_name);

			// TODO check for consistency, ie, versions
			await handler(event_msg, replayed).then(()=>{
				resolve()
			}).catch((err)=>{
				reject(err);
			});
		});
	}

	private async apply_events(event_msgs: DomainEventMsg[], replayed?: boolean): Promise<void> {
		const promises = event_msgs.map(evt => this.apply_event(evt));

		return Promise.all(promises).then(()=> Promise.resolve());
	}*/

	protected create(id?: string): void{
		this._reset_state();
		this._root_entity = id ? this._entity_factory.create_with_id(id) : this._entity_factory.create();
	}

	protected async load(aggregate_id: string, throw_on_not_found:boolean = true): Promise<void>{
		return new Promise(async (resolve, reject) => {
			this._reset_state();

			// TODO implement load from snapshot events and state events, using a state events repository

			if (!this._entity_state_repo.can_call()){
				this._logger.error("Aggregate repository not available to be called");
				return reject(new Error("Aggregate repository not available to be called")); // TODO typify these errors
			}

			let entity_state = await this._entity_state_repo.load(aggregate_id);
			if (!entity_state && throw_on_not_found){
				this._logger.debug(`Aggregate with id: ${aggregate_id} not found`);
				return reject(new Error("Aggregate not found")); // TODO typify these errors
			}

			if(entity_state)
				this._root_entity = this._entity_factory.create_from_state(entity_state);

			// the reset_state() above already sets the root_entity to null
			resolve();
		});
	}

	protected record_domain_event(event:IDomainMessage):void{
		this._uncommitted_events.push(event);
	}

	protected async commit(): Promise<void>{
		return new Promise(async (resolve, reject)=>{
			if(this._uncommitted_events.length <= 0){
				this._logger.warn("Called aggregate commit without uncommitted events to commit");
				return resolve();
			}

			const event_names = this._uncommitted_events.map(evt=> evt.msg_name);

			await this._msg_publisher.publish_many(this._uncommitted_events);

			this._logger.debug(`Aggregate committed ${this._uncommitted_events.length} events - ${event_names}`);

			this._uncommitted_events = [];
			resolve();
		});
	}


	private _reset_state() {
		this._uncommitted_events = [];
		this._root_entity = null;
	}

}
