export type ShopAppontmentPushNotificationType = "SHOP_CREATE_APPOINTMENT" | "SHOP_CONFIRMED_APPOINTMENT" | "SHOP_DELETE_APPOINTMENT"
export type CustomerAppontmentPushNotificationType = "CUSTOMER_BOOK_APPOINTMENT" | "CUSTOMER_DELETE_APPOINTMENT" | "CUSTOMER_APPOINTMENT_ONE_DAY_LEFT_REMINDER"
export type PushNotificationType = ShopAppontmentPushNotificationType | CustomerAppontmentPushNotificationType;

// ===========================================

export interface SqsMessagePayload {
    event: PushNotificationType
}

export interface ShopCreateAppointmentSqsMessagePayload extends SqsMessagePayload {
    data: {
        shopId: string
        appointmentId: number
        shopName: string
        customerId: string
        customerCognitoId: string
        appointmentDate: string
        customerName: string
        customerSurname: String
        customerEmail: string
        customerPhoneNumber: string
        customerPhoneNumberPrefix: string
    }
}

export interface ShopConfirmedAppointmentSqsMessagePayload extends SqsMessagePayload {
    data: {
        appointmentId: number
        customerCognitoId: string
        shopName: string
        appointmentDate: string
    }
}

export interface ShopDeletedAppointmentSqsMessagePayload extends SqsMessagePayload {
    data: {
        appointmentId: number
        customerCognitoId: string
        shopName: string
        appointmentDate: string
    }
}

export interface CustomerBookAppointmentSqsMessagePayload extends SqsMessagePayload {
    data: {
        shopId: string
        customerName: string
        appointmentId: number
        specialistCognitoId: string
        appointmentDate: string
    }
}

export interface CustomerDeleteAppointmentSqsMessagePayload extends SqsMessagePayload {
    data: {
        shopId: string
        customerName: string
        appointmentId: number
        specialistCognitoId: string
        appointmentDate: string
    }
}

export interface CustomerAppointmentOneDayLeftReminderSqsMessagePayload extends SqsMessagePayload {
    data: {
        appointmentId: number
        shopId: string
        shopName: string
        customerCognitoId: string
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

// push sent to a customer by shop

export interface ShopCreateAppointmentPushNotificationPayloadMetadata
    extends AppointmentPushNotificationPayloadMetadata {
    shopName: string
}

export interface ShopConfirmedAppointmentPushNotificationPayloadMetadata
    extends AppointmentPushNotificationPayloadMetadata {
    shopName: string
}

export interface ShopDeletedAppointmentPushNotificationPayloadMetadata
    extends AppointmentPushNotificationPayloadMetadata {
    shopName: string
}

// push sent to a shop by customer

export interface CustomerBookAppointmentPushNotificationPayloadMetadata
    extends AppointmentPushNotificationPayloadMetadata {
    customerName: string
}

export interface CustomerDeleteAppointmentPushNotificationPayloadMetadata
    extends AppointmentPushNotificationPayloadMetadata {
    customerName: string
}

// scheduled push notification

export interface CustomerAppointmentOneDayLeftReminderPushNotificationPayloadMetadata
    extends AppointmentPushNotificationPayloadMetadata {
    shopName: string
}

//----------------------------------------

export interface PushNotificationPayload {
    title: string,
    body: string
}

export interface ShopCreateAppointmentPushNotificationPayload
    extends PushNotificationPayload {
}

export interface ShopConfirmedAppointmentPushNotificationPayload
    extends PushNotificationPayload {
}

export interface ShopDeleteAppointmentPushNotificationPayload
    extends PushNotificationPayload {
}

export interface CustomerBookAppointmentPushNotificationPayload
    extends PushNotificationPayload {
}

export interface CustomerDeleteAppointmentPushNotificationPayload
    extends PushNotificationPayload {
}

export interface CustomerAppointmentOneDayLeftReminderPushNotificationPayload
    extends PushNotificationPayload {
}

// =====================================

type MobileOs = "android" | "iOS";

export interface PushNotificationSub {
    id: string, // cognito sub
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
