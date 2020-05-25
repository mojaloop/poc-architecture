/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryParticipantStateRepo = void 0;
class InMemoryParticipantStateRepo {
    constructor() {
        this._list = new Map();
    }
    can_call() {
        return true;
    }
    load(id) {
        return new Promise((resolve, reject) => {
            if (!this._list.has(id))
                resolve(null);
            resolve(this._list.get(id));
        });
    }
    remove(id) {
        return new Promise((resolve, reject) => {
            if (!this._list.has(id))
                return reject(new Error("Not found")); // maybe fail silently?
            this._list.delete(id);
            resolve();
        });
    }
    store(entity_state) {
        return new Promise((resolve, reject) => {
            this._list.set(entity_state.id, entity_state);
            resolve();
        });
    }
}
exports.InMemoryParticipantStateRepo = InMemoryParticipantStateRepo;
//# sourceMappingURL=inmemory_repo.js.map