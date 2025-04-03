import {
    PushNotificationType,
    ShopCreateAppointmentPushNotificationPayload,
    ShopCreateAppointmentPushNotificationPayloadMetadata,
    ShopCreateAppointmentSqsMessagePayload,
} from "../../interfaces";
import { PushAbstractStrategy } from "../PushAbstractStrategy";

export class ShopCreateAppointmentPushStrategy extends PushAbstractStrategy {

    constructor() {
        super();
    }

    getPushNotificationType(): PushNotificationType {
        return "SHOP_CREATE_APPOINTMENT";
    }

    isValidMessage(message: ShopCreateAppointmentSqsMessagePayload): boolean {
        return message.data.customerCognitoId != null;
    }

    getPushNotificationReceiver(message: ShopCreateAppointmentSqsMessagePayload): string[] {
        return [message.data.customerCognitoId];
    }

    // Fetch the metadata required for the notification payload
    async getPushNotificationPayloadMetadata(message: ShopCreateAppointmentSqsMessagePayload): Promise<ShopCreateAppointmentPushNotificationPayloadMetadata> {
        return {
            type: this.getPushNotificationType(),
            appointmentId: message.data.appointmentId,
            shopName: message.data.shopName,
            appointmentStartAt: message.data.appointmentDate// Ensure date is in ISO string format
        };
    }

    // Generate the push notification payload with translated content
    getPushNotificationPayload(metadata: ShopCreateAppointmentPushNotificationPayloadMetadata): ShopCreateAppointmentPushNotificationPayload {
        return {
            title: `Hai un nuovo appuntamento`,
            body: `Hai un nuovo appuntamento presso ${metadata.shopName} il ${new Date(metadata.appointmentStartAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}.`
        };
    }
}
