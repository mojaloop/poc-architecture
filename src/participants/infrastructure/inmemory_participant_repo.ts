/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

"use strict";

import {IEntityStateRepository} from "../../shared/domain_abstractions/ientity_state_repository";
import {ParticipantState} from "../domain/participant_entity";

export class InMemoryParticipantStateRepo implements IEntityStateRepository<ParticipantState>{
	private _list:Map<string, ParticipantState> = new Map<string, ParticipantState>();

	init():Promise<void>{
		return Promise.resolve();
	}

	destroy():Promise<void>{
		return Promise.resolve();
	}

	can_call(): boolean {
		return true;
	}

	load(id: string): Promise<ParticipantState|null> {
		return new Promise((resolve, reject)=>{
			if(!this._list.has(id))
				resolve(null);

			resolve(this._list.get(id));
		});
	}

	remove(id:string): Promise<void> {
		return new Promise((resolve, reject)=>{
			if(!this._list.has(id))
				return reject(new Error("Not found")); // maybe fail silently?

			this._list.delete(id);
			resolve();
		});
	}

	store(entity_state: ParticipantState): Promise<void> {
		return new Promise((resolve, reject)=>{
			this._list.set(entity_state.id, entity_state);
			resolve();
		});
	}


}
