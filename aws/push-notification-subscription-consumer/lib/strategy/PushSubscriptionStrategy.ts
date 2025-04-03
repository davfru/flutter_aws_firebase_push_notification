import { MessageBody } from "../interfaces";

export abstract class PushSubscriptionStrategy {
    abstract isValidMessage(message: MessageBody): boolean;
    abstract processMessage(message: MessageBody): void;
}