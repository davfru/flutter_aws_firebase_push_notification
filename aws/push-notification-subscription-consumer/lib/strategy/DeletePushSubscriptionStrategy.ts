import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, DeleteEndpointCommand } from "@aws-sdk/client-sns";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PushSubscriptionStrategy } from "./PushSubscriptionStrategy";
import { MessageBody } from "../interfaces";

const PUSH_NOTIFICATION_TOKEN_TABLE: string = process.env.PUSH_NOTIFICATION_TOKEN_TABLE!;

const dynamoDbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const snsClient = new SNSClient({});

export class DeletePushSubscriptionStrategy extends PushSubscriptionStrategy {

    isValidMessage(message: MessageBody): boolean {
        return true;
    }

    async processMessage(message: MessageBody): Promise<void> {
        const { receiverId } = message.payload;

        try {
            // Step 1: Retrieve the existing record from DynamoDB
            const dynamoDBParams = {
                TableName: PUSH_NOTIFICATION_TOKEN_TABLE,
                Key: { id: receiverId },
            };

            const existingRecord = await dynamoDbClient.send(new GetCommand(dynamoDBParams));

            if (!existingRecord.Item) {
                console.log(`No record found for receiverId: ${receiverId}.`);
                return;
            }

            // Step 2: delete push subscription from sns
            console.log(`Deleting push token for receiverId ${receiverId} from sns`);
            await snsClient.send(new DeleteEndpointCommand({ EndpointArn: existingRecord.Item.snsEndpointArn }));
            console.log(`SNS Endpoint deleted for token: ${existingRecord.Item.pushToken}`);

            // Step 2: delete push subscription from sns
            console.log(`Deleting push token for receiverId ${receiverId} from dynamo`);
            await dynamoDbClient.send(new DeleteCommand(dynamoDBParams));
            console.log(`Push token for receiverId ${receiverId} from dynamo deleted`);

        } catch (error: any) {
            console.warn(`Something went wrong deleting push subiscription for ${receiverId}`);
        }
    }
}