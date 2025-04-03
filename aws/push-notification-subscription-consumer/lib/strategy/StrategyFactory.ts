import { MessageBody } from "../interfaces";
import { PushSubscriptionStrategy } from "./PushSubscriptionStrategy";
import { UpsertPushSubscriptionStrategy } from "./UpsertPushSubscriptionStrategy";
import { DeletePushSubscriptionStrategy } from "./DeletePushSubscriptionStrategy";

export class StrategyFactory {

    constructor() {}

    getStrategy(body: MessageBody): PushSubscriptionStrategy | null {
        switch (body.event) {
            case 'UPSERT_PUSH_TOKEN':
                return new UpsertPushSubscriptionStrategy();
            case 'DELETE_PUSH_TOKEN':
                return new DeletePushSubscriptionStrategy();
            default:
                return null;
        }
    }
}