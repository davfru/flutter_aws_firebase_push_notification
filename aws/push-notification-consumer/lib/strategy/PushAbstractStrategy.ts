import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SqsMessagePayload, PushNotificationSub, PushNotificationPayload, PushNotificationPayloadMetadata, PushNotificationType, PushNotificationDynamoDB } from "../interfaces";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";

const PUSH_NOTIFICATION_TOKEN_TABLE: string = process.env.PUSH_NOTIFICATION_TOKEN_TABLE!;
const PUSH_NOTIFICATION_TABLE: string = process.env.PUSH_NOTIFICATION_TABLE!;
const dynamoDbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }));
const snsClient = new SNSClient({ region: process.env.REGION });

export abstract class PushAbstractStrategy {

    constructor() {
    }

    isValidMessage(message: SqsMessagePayload): boolean {
        return true; // TODO
    };

    abstract getPushNotificationType(): PushNotificationType;

    /**
     * @returns a list of ids (a push notification can be sent to different receivers)
     */
    abstract getPushNotificationReceiver(message: SqsMessagePayload): string[]

    abstract getPushNotificationPayloadMetadata(message: SqsMessagePayload): Promise<PushNotificationPayloadMetadata>;

    abstract getPushNotificationPayload(metadata: PushNotificationPayloadMetadata): PushNotificationPayload;

    async getPushNotificationSub(receiverId: string): Promise<PushNotificationSub> {
        const getParams = {
            TableName: PUSH_NOTIFICATION_TOKEN_TABLE,
            Key: { id: receiverId },
        };

        console.log(`PushAbstractStrategy - getPushNotificationSub - params ${JSON.stringify(getParams)}`);

        const dynamoResponse = await dynamoDbClient.send(new GetCommand(getParams));
        const pushSub = dynamoResponse.Item as PushNotificationSub;
        return pushSub;
    }

    async sendPushNotification(payload: PushNotificationPayload, metadata: PushNotificationPayloadMetadata, pushSub: PushNotificationSub) {
        console.log(`sendPushNotification - message: ${JSON.stringify(payload)} - pushSub: ${JSON.stringify(pushSub)}`);

        let pushNotificationParams: { Message: any, MessageStructure: 'json', TargetArn: string } = {
            Message: {
                default: payload.body,
            },
            MessageStructure: 'json',
            TargetArn: pushSub.snsEndpointArn, // Using the endpoint ARN retrieved from DynamoDB
        }

        let osParams = {};

        switch (pushSub.os) {
            case 'android':
                osParams = {
                    GCM: JSON.stringify({
                        notification: payload, // used to display title and body of push notification in user mobile phone
                        data: metadata // used to determine where to navigate when user tap on push notification
                    }),
                };
                break;
            case 'iOS':
                osParams = {
                    APNS: JSON.stringify({
                        aps: {
                            alert: payload
                        },
                    }),
                };
                break;
            default:
                osParams = {}; // Empty object for other platforms or undefined OS
        }

        // Merge osParams into the pushNotificationParams.Message
        pushNotificationParams.Message = JSON.stringify({
            ...pushNotificationParams.Message,
            ...osParams
        });

        console.log(`Push notification params: ${JSON.stringify(pushNotificationParams)}`);

        try {
            const publishResponse = await snsClient.send(new PublishCommand(pushNotificationParams));
            console.log(`Push notification sent successfully with MessageId: ${publishResponse.MessageId}`);
        } catch (error) {
            console.error('Failed to send push notification:', error);
            throw error;
        }
    }


    async persistPushNotification(receiverId: string,
        payload: PushNotificationPayload,
        metadata: PushNotificationPayloadMetadata) {
        const insertAtInSeconds = parseInt(`${new Date().getTime() / 1000}`);
        const oneMonthsInSeconds = 1 * 30 * 24 * 60 * 60;
        const expiration = insertAtInSeconds + oneMonthsInSeconds;

        const putParams = {
            TableName: PUSH_NOTIFICATION_TABLE,
            Item: {
                id: receiverId,
                insertAt: insertAtInSeconds,
                expiration: expiration,
                type: this.getPushNotificationType(),
                payload: payload,
                metadata: metadata
            } as PushNotificationDynamoDB,
        };

        console.log(`PushAbstractStrategy - persistPushNotification - params ${putParams}`);

        try {
            await dynamoDbClient.send(new PutCommand(putParams));
            console.log(`Notification log inserted into DynamoDB for id: ${receiverId}`);
        } catch (dynamoError) {
            console.error(`Failed to insert notification log into DynamoDB: ${dynamoError}`);
        }
    }
};