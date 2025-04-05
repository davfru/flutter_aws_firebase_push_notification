import { SQSEvent } from 'aws-lambda';
import { SqsMessagePayload, PushNotificationSub } from './lib/interfaces';
import { PushStrategyFactory } from './lib/strategy/PushStrategyFactory';

export const lambdaHandler = async (event: SQSEvent): Promise<void> => {

    try {

        for (const record of event.Records) {

            console.info("Record: ", record);

            // record.body:  {
            //     Type: 'Notification',
            //     Message: '{"event":"CUSTOMER_BOOK_APPOINTMENT","data":{"customerName":"Davide","appointmentId":117,"receiverId":"2334d8a2-6091-70da-5b26-cd7bef287bea","appointmentDate":"2024-11-19T17:00:00+00:00"}}',
            //     Timestamp: '2024-11-19T15:12:49.673Z',
            //   }

            const body = JSON.parse(record.body);
            const sqsMessagePayload = JSON.parse(body.Message) as SqsMessagePayload;
            console.info("Received message: ", sqsMessagePayload);

            const strategy = new PushStrategyFactory().getStrategy(sqsMessagePayload.event);

            if (!strategy) {
                console.info("strategy not found, skipping");
                continue;
            }

            if (!strategy.isValidMessage(sqsMessagePayload)) {
                console.info("message not valid, skipping");
                continue;
            }

            // the receivers of push notification
            console.info("message valid");
            const pushReceivers: string[] = await strategy.getPushNotificationReceiver(sqsMessagePayload);
            console.log(`pushReceivers: ${pushReceivers}`);

            if (!pushReceivers.length) {
                console.log(`No receiver founds, returning...`);
                return;
            }

            for (let receiverId of pushReceivers) {
                const pushSub: PushNotificationSub = await strategy.getPushNotificationSub(receiverId);

                if (!pushSub || !pushSub.pushToken || !pushSub.snsEndpointArn) {
                    console.error(`No pushToken or SNS Endpoint ARN found for receiverId: ${receiverId}`);
                    continue; // Skip to the next record if not found
                }

                const { pushToken } = pushSub;
                console.log(`PushToken retrieved for receiverId ${receiverId}: ${pushToken}`);

                const pushNotificationPayloadMetadata = await strategy.getPushNotificationPayloadMetadata(sqsMessagePayload);

                const pushNotificationPayload = strategy.getPushNotificationPayload(pushNotificationPayloadMetadata);

                await strategy.persistPushNotification(receiverId, pushNotificationPayload, pushNotificationPayloadMetadata);
                console.log(`push notification persisted for ${receiverId}`);

                await strategy.sendPushNotification(pushNotificationPayload,
                    pushNotificationPayloadMetadata,
                    pushSub);
                console.log(`push notification sent to ${receiverId}`);
            }
        }

    } catch (error) {
        console.error('Error processing SQS event:', error);
        throw error;
    } finally {
    }
};
