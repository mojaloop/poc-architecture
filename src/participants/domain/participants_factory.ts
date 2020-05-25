/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

"use strict";

import {ParticipantEntity, ParticipantState} from "./participant_entity";
import {IEntityFactory} from "../../shared/domain_abstractions/entity_factory";

export class ParticipantsFactory implements IEntityFactory<ParticipantEntity, ParticipantState>{
	// singleton
	private static _instance:ParticipantsFactory;
	static GetInstance():ParticipantsFactory{
		if(!this._instance)
			this._instance = new ParticipantsFactory();

		return this._instance;
	}
	private constructor(){}

	create():ParticipantEntity{
		return ParticipantEntity.CreateInstance(new ParticipantState());
	}

	create_from_state(initial_state: ParticipantState): ParticipantEntity {
		return ParticipantEntity.CreateInstance(initial_state);
	}

	create_with_id(initial_id: string): ParticipantEntity {
		let initial_state:ParticipantState = new ParticipantState();
		initial_state.id = initial_id;

		return ParticipantEntity.CreateInstance(initial_state);
	}
}
