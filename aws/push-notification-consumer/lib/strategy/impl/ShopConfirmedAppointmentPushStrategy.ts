import { PushNotificationType, ShopConfirmedAppointmentPushNotificationPayload, ShopConfirmedAppointmentPushNotificationPayloadMetadata, ShopConfirmedAppointmentSqsMessagePayload } from "../../interfaces";
import { PushAbstractStrategy } from "../PushAbstractStrategy";

export class ShopConfirmedAppointmentPushStrategy extends PushAbstractStrategy {

    constructor() {
        super();
    }

    getPushNotificationType(): PushNotificationType {
        return "SHOP_CONFIRMED_APPOINTMENT";
    }

    isValidMessage(message: ShopConfirmedAppointmentSqsMessagePayload): boolean {
        return message.data.customerCognitoId != null;
    }

    // Retrieve the cognito ID of the customer associated with the confirmed appointment
    getPushNotificationReceiver(message: ShopConfirmedAppointmentSqsMessagePayload): string[] {
        return [message.data.customerCognitoId];
    }

    // Retrieve metadata for the notification payload (shop name, appointment start time, etc.)
    async getPushNotificationPayloadMetadata(message: ShopConfirmedAppointmentSqsMessagePayload): Promise<ShopConfirmedAppointmentPushNotificationPayloadMetadata> {
        return {
            type: this.getPushNotificationType(),
            appointmentId: message.data.appointmentId,
            shopName: message.data.shopName,
            appointmentStartAt: message.data.appointmentDate // Assuming start_at is a Date object
        };
    }

    // Generate the push notification payload with translated content
    getPushNotificationPayload(metadata: ShopConfirmedAppointmentPushNotificationPayloadMetadata): ShopConfirmedAppointmentPushNotificationPayload {
        return {
            title: `Appuntamento confermato`,
            body: `Il tuo appuntamento presso ${metadata.shopName} del ${new Date(metadata.appointmentStartAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })} è stato confermato.`
        }
    }
}
