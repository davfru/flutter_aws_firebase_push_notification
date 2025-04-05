type MobileOs = "Android" | "iOS";

export interface MessageBody {
    event: "UPSERT_PUSH_TOKEN" | "DELETE_PUSH_TOKEN"
    payload: {
        pushToken: string
        os: MobileOs,
        receiverId: string
    }
}

export interface PushNotificationSub {
    id: string, // email or cognito sub
    pushToken: string
    os: MobileOs,
    insertAt: number,
    snsEndpointArn: string, // Include the new ARN
}