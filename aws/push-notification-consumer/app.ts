import { SQSEvent } from 'aws-lambda';
import { SqsMessagePayload, PushNotificationSub } from './lib/interfaces';
import { PushStrategyFactory } from './lib/strategy/PushStrategyFactory';
// import { Pool } from 'pg';
// import { initializePool } from './lib/pg';
// 
// let pool: Pool;

export const lambdaHandler = async (event: SQSEvent): Promise<void> => {

    // if (!pool) {
    //     pool = await initializePool();
    // } 
    // const client = await pool.connect();

    try {

        for (const record of event.Records) {

            console.info("Record: ", record);

            // record.body:  {
            //     Type: 'Notification',
            //     MessageId: 'ceb25f30-5155-5e97-ad72-0086fc6458b9',
            //     TopicArn: 'arn:aws:sns:eu-central-1:735523598888:prod-taro-appointment-topic',
            //     Message: '{"event":"CUSTOMER_BOOK_APPOINTMENT","data":{"shopId":"3ac03f4d-44a1-4e9d-8cb6-d48e8a59262b","customerName":"Davide","appointmentId":117,"specialistCognitoId":"2334d8a2-6091-70da-5b26-cd7bef287bea","appointmentDate":"2024-11-19T17:00:00+00:00"}}',
            //     Timestamp: '2024-11-19T15:12:49.673Z',
            //     SignatureVersion: '1',
            //     Signature: 'Z+2dCm58dzyY3gVH5at1y+6qRCupu3S8CQcvu+ywq6HUAahxYsLf92wMQ1kTfhVTsxQ5c5JXS8tA+nx8oQrasEx4luofitRN7hEzRhpvoaQxo8dhj9pn5PCYO/XrF5aTRY6r59vw7Df1RcEQHHGZD1H0wPQIcEM9/21Q95iWH3EdIdqGfT+tWmjAFAyRN0Ah8OmnLkujxmXqs/oPAhK5nYTyx9PhB3q8rz662gDao5be7RfLc8uTwPkl65jAxOGXZkbRhveu1vpDkWXzp3UlvxsOY+S4vdePjsqU1FsvLc76cB1OiWtUkxyRAgAlsQ7vGQuDKeQwtImMzOq/tWxRCw==',
            //     SigningCertURL: 'https://sns.eu-central-1.amazonaws.com/SimpleNotificationService-9c6465fa7f48f5cacd23014631ec1136.pem',
            //     UnsubscribeURL: 'https://sns.eu-central-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-central-1:735523598888:prod-taro-appointment-topic:7c5df6fc-5545-4216-817e-4190a1411b72'
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
            const cognitoSubs: string[] = await strategy.getPushNotificationReceiver(sqsMessagePayload);
            console.log(`cognitoSubs: ${cognitoSubs}`);

            if (!cognitoSubs.length) {
                console.log(`No receiver founds, returning...`);
                return;
            }

            for (let cognitoSub of cognitoSubs) {
                const pushSub: PushNotificationSub = await strategy.getPushNotificationSub(cognitoSub);

                if (!pushSub || !pushSub.pushToken || !pushSub.snsEndpointArn) {
                    console.error(`No pushToken or SNS Endpoint ARN found for sub: ${cognitoSub}`);
                    continue; // Skip to the next record if not found
                }

                const { pushToken } = pushSub;
                console.log(`PushToken retrieved for sub ${cognitoSub}: ${pushToken}`);

                const pushNotificationPayloadMetadata = await strategy.getPushNotificationPayloadMetadata(sqsMessagePayload);

                const pushNotificationPayload = strategy.getPushNotificationPayload(pushNotificationPayloadMetadata);

                await strategy.persistPushNotification(cognitoSub, pushNotificationPayload, pushNotificationPayloadMetadata);
                console.log(`push notification persisted for ${cognitoSub}`);

                await strategy.sendPushNotification(pushNotificationPayload,
                    pushNotificationPayloadMetadata,
                    pushSub);
                console.log(`push notification sent to ${cognitoSub}`);
            }
        }

    } catch (error) {
        console.error('Error processing SQS event:', error);
        throw error;
    } finally {
        // client.release();
    }
};
