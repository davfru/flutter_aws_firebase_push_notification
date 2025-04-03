import { DynamoDBDocumentClient, GetCommand, QueryCommand, DeleteCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, CreatePlatformEndpointCommand, DeleteEndpointCommand } from "@aws-sdk/client-sns";
import sinon from "sinon";
import assert from "assert";
import { MessageBody } from "../../../interfaces";
import { UpsertPushSubscriptionStrategy } from "../../UpsertPushSubscriptionStrategy";

describe('UpsertPushSubscriptionStrategy', () => {
    let strategy: UpsertPushSubscriptionStrategy;
    let dynamoDbClientStub: sinon.SinonStubbedInstance<DynamoDBDocumentClient>;
    let snsClientStub: sinon.SinonStubbedInstance<SNSClient>;

    beforeEach(() => {
        strategy = new UpsertPushSubscriptionStrategy();
        dynamoDbClientStub = sinon.stub(DynamoDBDocumentClient.prototype);
        snsClientStub = sinon.stub(SNSClient.prototype);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should delete and create a new token (found by sub)', async () => {
        const message: MessageBody = {
            event: "UPSERT_PUSH_TOKEN",
            payload: {
                sub: 'user123',
                pushToken: 'same-token',
                os: 'iOS'
            }
        };

        // Stub the DynamoDB GetCommand to return a record for the sub
        dynamoDbClientStub.send.withArgs(sinon.match.instanceOf(GetCommand)).resolves({
            Item: { id: 'user123', pushToken: 'same-token', snsEndpointArn: 'arn:old' }
        });

        // Stub the SNS delete and create commands
        snsClientStub.send.withArgs(sinon.match.instanceOf(DeleteEndpointCommand)).resolves({});
        snsClientStub.send.withArgs(sinon.match.instanceOf(CreatePlatformEndpointCommand)).resolves({ EndpointArn: 'arn:new' });

        await strategy.processMessage(message);

        // Assertions
        sinon.assert.calledWith(dynamoDbClientStub.send, sinon.match.instanceOf(GetCommand)); // Check by sub
        sinon.assert.calledWith(snsClientStub.send, sinon.match.instanceOf(DeleteEndpointCommand)); // Delete old SNS endpoint
        sinon.assert.calledWith(snsClientStub.send, sinon.match.instanceOf(CreatePlatformEndpointCommand)); // Create new SNS endpoint
        sinon.assert.calledWith(dynamoDbClientStub.send, sinon.match.instanceOf(PutCommand)); // Insert new record
    });

    it('should delete and create a new token (found by pushToken)', async () => {
        const message: MessageBody = {
            event: "UPSERT_PUSH_TOKEN",
            payload: {
                sub: 'user123',
                pushToken: 'different-token',
                os: 'Android'
            }
        };

        // Stub the DynamoDB GetCommand to return no record for the sub
        dynamoDbClientStub.send.withArgs(sinon.match.instanceOf(GetCommand)).resolves({ Item: undefined });

        // Stub the DynamoDB QueryCommand to return a record for the pushToken
        dynamoDbClientStub.send.withArgs(sinon.match.instanceOf(QueryCommand)).resolves({
            Items: [{ id: 'user456', pushToken: 'different-token', snsEndpointArn: 'arn:old-token' }]
        });

        // Stub the SNS delete and create commands
        snsClientStub.send.withArgs(sinon.match.instanceOf(DeleteEndpointCommand)).resolves({});
        snsClientStub.send.withArgs(sinon.match.instanceOf(CreatePlatformEndpointCommand)).resolves({ EndpointArn: 'arn:new-token' });

        await strategy.processMessage(message);

        // Assertions
        sinon.assert.calledWith(dynamoDbClientStub.send, sinon.match.instanceOf(GetCommand)); // First attempt by sub
        sinon.assert.calledWith(dynamoDbClientStub.send, sinon.match.instanceOf(QueryCommand)); // Second attempt by pushToken
        sinon.assert.calledWith(snsClientStub.send, sinon.match.instanceOf(DeleteEndpointCommand)); // Delete old SNS endpoint
        sinon.assert.calledWith(snsClientStub.send, sinon.match.instanceOf(CreatePlatformEndpointCommand)); // Create new SNS endpoint
        sinon.assert.calledWith(dynamoDbClientStub.send, sinon.match.instanceOf(PutCommand)); // Insert new record
    });

    it('should handle errors during SNS endpoint creation', async () => {
        const message: MessageBody = {
            event: "UPSERT_PUSH_TOKEN",
            payload: {
                sub: 'user123',
                pushToken: 'new-token',
                os: 'iOS'
            }
        };

        // Stub the DynamoDB GetCommand to return no record
        dynamoDbClientStub.send.withArgs(sinon.match.instanceOf(GetCommand)).resolves({ Item: undefined });

        // Stub the DynamoDB QueryCommand to return no record
        dynamoDbClientStub.send.withArgs(sinon.match.instanceOf(QueryCommand)).resolves({ Items: [] });

        // Stub the SNS create endpoint command to throw an error
        snsClientStub.send.withArgs(sinon.match.instanceOf(CreatePlatformEndpointCommand)).rejects(new Error('SNS Error'));

        // Assertions for error during SNS operation
        await assert.rejects(strategy.processMessage(message), /SNS Error/);
        sinon.assert.calledOnce(snsClientStub.send); // Only the create should have been called
        sinon.assert.calledTwice(dynamoDbClientStub.send); // Get and Query should have been called
    });

    it('should handle no existing records and create a new one', async () => {
        const message: MessageBody = {
            event: "UPSERT_PUSH_TOKEN",
            payload: {
                sub: 'user789',
                pushToken: 'new-token',
                os: 'Android'
            }
        };

        // Stub DynamoDB to return no record for both sub and pushToken
        dynamoDbClientStub.send.withArgs(sinon.match.instanceOf(GetCommand)).resolves({ Item: undefined });
        dynamoDbClientStub.send.withArgs(sinon.match.instanceOf(QueryCommand)).resolves({ Items: [] });

        // Stub the SNS create endpoint command to return a new ARN
        snsClientStub.send.withArgs(sinon.match.instanceOf(CreatePlatformEndpointCommand)).resolves({ EndpointArn: 'arn:new-endpoint' });

        await strategy.processMessage(message);

        // Assertions
        sinon.assert.calledWith(dynamoDbClientStub.send, sinon.match.instanceOf(GetCommand)); // Check by sub
        sinon.assert.calledWith(dynamoDbClientStub.send, sinon.match.instanceOf(QueryCommand)); // Check by pushToken
        sinon.assert.calledWith(snsClientStub.send, sinon.match.instanceOf(CreatePlatformEndpointCommand)); // Create new SNS endpoint
        sinon.assert.calledWith(dynamoDbClientStub.send, sinon.match.instanceOf(PutCommand)); // Insert new record
    });
});
