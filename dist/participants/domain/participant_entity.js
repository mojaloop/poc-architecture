/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipantEntity = exports.ParticipantState = void 0;
const base_entity_state_1 = require("../../shared/domain_abstractions/base_entity_state");
const base_entity_1 = require("../../shared/domain_abstractions/base_entity");
class ParticipantState extends base_entity_state_1.BaseEntityState {
    constructor() {
        super(...arguments);
        this.limit = 0;
        this.position = 0;
        this.name = "";
    }
}
exports.ParticipantState = ParticipantState;
class ParticipantEntity extends base_entity_1.BaseEntity {
    get limit() {
        return this._state.limit;
    }
    get position() {
        return this._state.position;
    }
    get name() {
        return this._state.name;
    }
    static CreateInstance(initial_state) {
        initial_state = initial_state || new ParticipantState();
        let entity = new ParticipantEntity(initial_state);
        return entity;
    }
    setup_initial_state(name, limit, initial_position) {
        this._state.name = name;
        this._state.limit = limit;
        this._state.position = initial_position;
    }
    can_reserve_funds(amount) {
        if (amount <= 0)
            return false;
        return this._state.position > amount;
    }
    reserve_funds(amount) {
        this._state.position -= amount;
    }
    reverse_fund_reservation(amount) {
        this._state.position += amount;
    }
}
exports.ParticipantEntity = ParticipantEntity;
//# sourceMappingURL=participant_entity.js.map