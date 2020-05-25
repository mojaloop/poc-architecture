/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipantsFactory = void 0;
const participant_entity_1 = require("./participant_entity");
class ParticipantsFactory {
    constructor() { }
    static GetInstance() {
        if (!this._instance)
            this._instance = new ParticipantsFactory();
        return this._instance;
    }
    create() {
        return participant_entity_1.ParticipantEntity.CreateInstance(new participant_entity_1.ParticipantState());
    }
    create_from_state(initial_state) {
        return participant_entity_1.ParticipantEntity.CreateInstance(initial_state);
    }
    create_with_id(initial_id) {
        let initial_state = new participant_entity_1.ParticipantState();
        initial_state.id = initial_id;
        return participant_entity_1.ParticipantEntity.CreateInstance(initial_state);
    }
}
exports.ParticipantsFactory = ParticipantsFactory;
//# sourceMappingURL=participants_factory.js.map