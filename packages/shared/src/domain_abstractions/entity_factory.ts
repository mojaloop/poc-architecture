/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */
"use strict";

import {BaseEntity} from "./base_entity";
import {BaseEntityState} from "./base_entity_state";

export interface IEntityFactory<E extends BaseEntity<S>,S extends BaseEntityState>{
	create():E;
	create_from_state(initial_state:S):E; //optional initial id
	create_with_id(initial_id:string):E;
}
