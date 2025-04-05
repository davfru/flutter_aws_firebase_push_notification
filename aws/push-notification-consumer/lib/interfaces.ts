export type CustomerAppontmentPushNotificationType = "CUSTOMER_BOOK_APPOINTMENT"
export type PushNotificationType = CustomerAppontmentPushNotificationType;

// ===========================================

export interface SqsMessagePayload {
    event: PushNotificationType
}

export interface CustomerBookAppointmentSqsMessagePayload extends SqsMessagePayload {
    data: {
        customerName: string
        appointmentId: number
        receiverId: string
        appointmentDate: string
    }
}

// ----------------------------------------

export interface PushNotificationPayloadMetadata {
    type: PushNotificationType
}

export interface AppointmentPushNotificationPayloadMetadata extends PushNotificationPayloadMetadata {
    appointmentId: number
    appointmentStartAt: string
}

// push sent to a shop by customer

export interface CustomerBookAppointmentPushNotificationPayloadMetadata
    extends AppointmentPushNotificationPayloadMetadata {
    customerName: string
}

//----------------------------------------

export interface PushNotificationPayload {
    title: string,
    body: string
}

export interface CustomerBookAppointmentPushNotificationPayload
    extends PushNotificationPayload {
}

// =====================================

type MobileOs = "android" | "iOS";

export interface PushNotificationSub {
    id: string, // email or cognito sub
    pushToken: string
    os: MobileOs,
    insertAt: number,
    snsEndpointArn: string, // Include the new ARN
}

// ====================================

export interface PushNotificationDynamoDB {
    id: string
    insertAt: number
    expiration: number

    // type is the same inside metadata: PushNotificationPayloadMetadata below. 
    // I am also keeping it here for future query filtering.
    // type is used on Flutter side.
    type: PushNotificationType
    payload: PushNotificationPayload,
    metadata: PushNotificationPayloadMetadata
}
