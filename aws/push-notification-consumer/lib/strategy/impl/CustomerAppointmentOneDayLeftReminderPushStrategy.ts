import { CustomerAppointmentOneDayLeftReminderPushNotificationPayload, CustomerAppointmentOneDayLeftReminderPushNotificationPayloadMetadata, CustomerAppointmentOneDayLeftReminderSqsMessagePayload, CustomerBookAppointmentPushNotificationPayload, CustomerBookAppointmentPushNotificationPayloadMetadata, CustomerBookAppointmentSqsMessagePayload, PushNotificationType, SqsMessagePayload } from "../../interfaces";
import { PushAbstractStrategy } from "../PushAbstractStrategy";

export class CustomerAppointmentOneDayLeftReminderPushStrategy extends PushAbstractStrategy {

    constructor() {
        super();
    }

    isValidMessage(message: CustomerAppointmentOneDayLeftReminderSqsMessagePayload): boolean {
        return message.data.customerCognitoId != null;
    }

    getPushNotificationType(): PushNotificationType {
        return "CUSTOMER_APPOINTMENT_ONE_DAY_LEFT_REMINDER";
    }

    getPushNotificationReceiver(message: CustomerAppointmentOneDayLeftReminderSqsMessagePayload): string[] {
        return [message.data.customerCognitoId];
    }

    async getPushNotificationPayloadMetadata(message: CustomerAppointmentOneDayLeftReminderSqsMessagePayload):
        Promise<CustomerAppointmentOneDayLeftReminderPushNotificationPayloadMetadata> {
        return {
            type: this.getPushNotificationType(),
            appointmentId: message.data.appointmentId,
            shopName: message.data.shopName,
            appointmentStartAt: message.data.appointmentDate
        };
    }

    // TODO translate by lang
    getPushNotificationPayload(metadata: CustomerAppointmentOneDayLeftReminderPushNotificationPayloadMetadata):
        CustomerAppointmentOneDayLeftReminderPushNotificationPayload {
        return {
            title: "Manca solo un giorno al tuo appuntamento",
            body: `Ti ricordiamo il tuo appuntamento di domani presso ${metadata.shopName}.`
        }
    }
}
