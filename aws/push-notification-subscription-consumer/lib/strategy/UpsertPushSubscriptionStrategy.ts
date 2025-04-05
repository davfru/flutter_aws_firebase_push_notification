import { DynamoDBDocumentClient, GetCommand, QueryCommand, DeleteCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, CreatePlatformEndpointCommand, DeleteEndpointCommand } from "@aws-sdk/client-sns";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PushSubscriptionStrategy } from "./PushSubscriptionStrategy";
import { MessageBody, PushNotificationSub } from "../interfaces";

const PUSH_NOTIFICATION_TOKEN_TABLE: string = process.env.PUSH_NOTIFICATION_TOKEN_TABLE!;
const SNS_PLATFORM_APPLICATION_ARN: string = process.env.SNS_PLATFORM_APPLICATION_ARN!;

const dynamoDbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const snsClient = new SNSClient({});

export class UpsertPushSubscriptionStrategy extends PushSubscriptionStrategy {

    isValidMessage(message: MessageBody): boolean {
        return true;
    }

    async processMessage(message: MessageBody): Promise<void> {
        const { receiverId, pushToken, os } = message.payload;

        let getItemResult;
        
        // Step 1: Retrieve the existing record from DynamoDB by `receiverId`
        const getParamsBySub = {
            TableName: PUSH_NOTIFICATION_TOKEN_TABLE,
            Key: { id: receiverId },
        };
        
        getItemResult = await dynamoDbClient.send(new GetCommand(getParamsBySub));
        console.log(`Existing record for receiverId: ${getItemResult.Item}`);

        let pushSub: PushNotificationSub = getItemResult.Item as PushNotificationSub;

        // If no record is found by receiverId, try to find it by `pushToken` using GSI
        if (!pushSub) {
            const queryParamsByToken = {
                TableName: PUSH_NOTIFICATION_TOKEN_TABLE,
                IndexName: "PushTokenIndex", // Ensure you have this index in your table
                KeyConditionExpression: "pushToken = :pushToken",
                ExpressionAttributeValues: {
                    ":pushToken": pushToken,
                },
            };

            const queryResult = await dynamoDbClient.send(new QueryCommand(queryParamsByToken));
            if (queryResult.Items && queryResult.Items.length > 0) {
                pushSub = queryResult.Items[0] as PushNotificationSub;
                console.log(`Existing record for pushToken: ${pushSub}`);
            }
        }

        // Step 2: If a record is found, delete it from SNS and DynamoDB
        if (pushSub && pushSub.snsEndpointArn) {
            try {
                await snsClient.send(new DeleteEndpointCommand({ EndpointArn: pushSub.snsEndpointArn }));
                console.log(`SNS endpoint deleted for ARN: ${pushSub.snsEndpointArn}`);
            } catch (error) {
                console.error(`Error deleting SNS endpoint: ${error}`);
            }

            try {
                const deleteParams = {
                    TableName: PUSH_NOTIFICATION_TOKEN_TABLE,
                    Key: { id: pushSub.id },
                };
                await dynamoDbClient.send(new DeleteCommand(deleteParams));
                console.log(`Record deleted from DynamoDB for id: ${pushSub.id}`);
            } catch (error) {
                console.error(`Error deleting record from DynamoDB: ${error}`);
            }
        }

        // Step 3: Create a new SNS endpoint
        let newEndpointArn: string;
        try {
            const endpointParams = {
                PlatformApplicationArn: SNS_PLATFORM_APPLICATION_ARN,
                Token: pushToken,
                CustomUserData: receiverId,
                Enabled: "true",
            };

            const response = await snsClient.send(new CreatePlatformEndpointCommand(endpointParams));
            newEndpointArn = response.EndpointArn!;
            console.log(`New SNS endpoint created with ARN: ${newEndpointArn}`);
        } catch (error: any) {
            if (error.name === "InvalidParameter" && error.message.includes("already exists with the same Token")) {
                console.warn(`Endpoint already exists for token: ${pushToken}. SNS operation not required.`);
                return;
            } else {
                console.error(`Error creating SNS platform endpoint: ${error}`);
                throw error;
            }
        }

        // Step 4: Insert the new record in DynamoDB
        const insertAt = new Date().getTime();
        const putParams = {
            TableName: PUSH_NOTIFICATION_TOKEN_TABLE,
            Item: {
                id: receiverId,
                pushToken,
                os,
                insertAt,
                snsEndpointArn: newEndpointArn,
            } as PushNotificationSub,
        };

        try {
            await dynamoDbClient.send(new PutCommand(putParams));
            console.log(`New record inserted/updated in DynamoDB for receiverId: ${receiverId}`);
        } catch (error) {
            console.error(`Error inserting record into DynamoDB: ${error}`);
            throw error;
        }
    }
}
