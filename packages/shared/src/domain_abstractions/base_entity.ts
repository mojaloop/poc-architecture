/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

"use strict";

import {BaseEntityState} from "./base_entity_state";


export abstract class BaseEntity <S extends BaseEntityState>{
	protected _state: S;



	// id is a property of state data, not behaviour
	get id(): string {
		return this._state.id;
	}

	get version():number{
		return this._state.version;
	}

	protected constructor(initial_state:S){
		this._state = initial_state;
	};

	// required so we can export/persist the state and still forbid direct state changes
	export_state():S{
		const clone:S= Object.assign({}, this._state);
		return clone;
	}
}
