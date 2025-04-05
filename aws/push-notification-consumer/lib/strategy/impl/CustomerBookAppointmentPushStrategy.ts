import { CustomerBookAppointmentPushNotificationPayload, CustomerBookAppointmentPushNotificationPayloadMetadata, CustomerBookAppointmentSqsMessagePayload, PushNotificationType, SqsMessagePayload } from "../../interfaces";
import { PushAbstractStrategy } from "../PushAbstractStrategy";

export class CustomerBookAppointmentPushStrategy extends PushAbstractStrategy {

    constructor() {
        super();
    }

    isValidMessage(message: CustomerBookAppointmentSqsMessagePayload): boolean {
        return message.data.receiverId != null;
    }

    getPushNotificationType(): PushNotificationType {
        return "CUSTOMER_BOOK_APPOINTMENT";
    }

    getPushNotificationReceiver(message: CustomerBookAppointmentSqsMessagePayload): string[] {
        return [message.data.receiverId];
    }

    async getPushNotificationPayloadMetadata(message: CustomerBookAppointmentSqsMessagePayload): Promise<CustomerBookAppointmentPushNotificationPayloadMetadata> {
        // Return the payload metadata
        return {
            type: this.getPushNotificationType(),
            appointmentId: message.data.appointmentId,
            customerName: message.data.customerName,
            appointmentStartAt: message.data.appointmentDate, // assuming start_at is a Date object
        };
    }

    // TODO translate by lang
    getPushNotificationPayload(metadata: CustomerBookAppointmentPushNotificationPayloadMetadata): CustomerBookAppointmentPushNotificationPayload {
        return {
            title: "New appointment request",
            body: `${metadata.customerName} requested new appointment for ${new Date(metadata.appointmentStartAt)}.`
        }
    }
}
