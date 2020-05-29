/**
 * Created by pedrosousabarreto@gmail.com on 28/May/2020.
 */
import { CommandMsg } from '../../src/messages';
export declare type TestCommandPayload = {
    id: string;
    name: string;
    limit: number;
    initialPosition: number;
};
export declare class TestCommand extends CommandMsg {
    aggregate_name: string;
    msgTopic: string;
    aggregateId: string;
    msgKey: string;
    payload: TestCommandPayload;
    constructor(payload: TestCommandPayload);
    validatePayload(): void;
    specialMethod(): string;
}
