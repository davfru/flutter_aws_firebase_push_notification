import { CustomerDeleteAppointmentSqsMessagePayload, CustomerDeleteAppointmentPushNotificationPayloadMetadata, 
    PushNotificationType, 
    CustomerDeleteAppointmentPushNotificationPayload} from "../../interfaces";
import { PushAbstractStrategy } from "../PushAbstractStrategy";

export class CustomerDeleteAppointmentPushStrategy extends PushAbstractStrategy {

    constructor() {
        super();
    }

    isValidMessage(message: CustomerDeleteAppointmentSqsMessagePayload): boolean {
        return message.data.specialistCognitoId != null;
    }

    getPushNotificationType(): PushNotificationType {
        return "CUSTOMER_DELETE_APPOINTMENT";
    }

    getPushNotificationReceiver(message: CustomerDeleteAppointmentSqsMessagePayload): string[] {
        return [message.data.specialistCognitoId];
    }

    async getPushNotificationPayloadMetadata(message: CustomerDeleteAppointmentSqsMessagePayload): 
        Promise<CustomerDeleteAppointmentPushNotificationPayloadMetadata> {

        // Return the payload metadata
        return {
            type: this.getPushNotificationType(),
            appointmentId: message.data.appointmentId,
            customerName: message.data.customerName,
            appointmentStartAt: message.data.appointmentDate
        };
    }

    // TODO translate by lang
    getPushNotificationPayload(metadata: CustomerDeleteAppointmentPushNotificationPayloadMetadata): 
        CustomerDeleteAppointmentPushNotificationPayload {
        return {
            title: "Appuntamento annullato",
            body: `${metadata.customerName} ha annullato l'appuntamento del giorno ${new Date(metadata.appointmentStartAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}.`
        }
    }
}
