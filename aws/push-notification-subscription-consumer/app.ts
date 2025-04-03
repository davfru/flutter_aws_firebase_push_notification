import { SQSEvent } from 'aws-lambda';
import { StrategyFactory } from './lib/strategy/StrategyFactory';
import { PushSubscriptionStrategy } from './lib/strategy/PushSubscriptionStrategy';
import { MessageBody } from './lib/interfaces';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - Sqs Event sent by /webhook API (api folder)
 *
 *
 */
export const lambdaHandler = async (event: SQSEvent): Promise<void> => {
    try {
        for (const record of event.Records) {

            console.log("Record: ", record);
            const body = JSON.parse(record.body) as MessageBody;
            console.log("event: ", event);

            const type: string = body.event;
            const strategy: PushSubscriptionStrategy | null = new StrategyFactory().getStrategy(body);

            if (!strategy) {
                console.log("Strategy not found for event: ", type, " - event skipped");
                return;
            }

            if(!strategy.isValidMessage(body)) {
                console.log("Not valid message ...");
                return;
            }

            console.log("Processing event ...");
            await strategy.processMessage(body);
            console.log("Event successfully processed");
        }
    } catch (error) {
        console.error('Error processing SQS event:', error);
        throw error;
    }
};