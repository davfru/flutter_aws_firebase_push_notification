import { CustomerBookAppointmentPushNotificationPayload, CustomerBookAppointmentPushNotificationPayloadMetadata, CustomerBookAppointmentSqsMessagePayload, PushNotificationType, SqsMessagePayload } from "../../interfaces";
import { PushAbstractStrategy } from "../PushAbstractStrategy";

export class CustomerBookAppointmentPushStrategy extends PushAbstractStrategy {

    constructor() {
        super();
    }

    isValidMessage(message: CustomerBookAppointmentSqsMessagePayload): boolean {
        return message.data.specialistCognitoId != null;
    }

    getPushNotificationType(): PushNotificationType {
        return "CUSTOMER_BOOK_APPOINTMENT";
    }

    getPushNotificationReceiver(message: CustomerBookAppointmentSqsMessagePayload): string[] {
        return [message.data.specialistCognitoId];
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
            title: "Richiesta nuovo appuntamento",
            body: `${metadata.customerName} ha richiesto un appuntamento per il giorno ${new Date(metadata.appointmentStartAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}.`
        }
    }
}
