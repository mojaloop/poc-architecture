/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

"use strict";

import {BaseEntity,BaseEntityState} from "shared";

export class ParticipantState extends BaseEntityState{
	limit: number = 0;
	position: number = 0;
	name: string = "";
}

export class ParticipantEntity extends BaseEntity<ParticipantState>{
	get limit():number{
		return this._state.limit;
	}

	get position():number{
		return this._state.position;
	}

	get name():string {
		return this._state.name;
	}

	static CreateInstance(initial_state?:ParticipantState ) {
		initial_state = initial_state || new ParticipantState();

		let entity: ParticipantEntity = new ParticipantEntity(initial_state);

		return entity;
	}

	setup_initial_state( name:string, limit:number, initial_position: number):void{
		this._state.name = name;
		this._state.limit = limit;
		this._state.position = initial_position;
	}

	can_reserve_funds(amount:number):boolean{
		if(amount<=0)
			return false;

		return this._state.position > amount;
	}

	reserve_funds(amount:number):void{
		this._state.position -= amount
	}

	reverse_fund_reservation(amount:number):void{
		this._state.position += amount
	}
}
