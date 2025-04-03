import { PushNotificationType, ShopDeleteAppointmentPushNotificationPayload, ShopDeletedAppointmentPushNotificationPayloadMetadata, ShopDeletedAppointmentSqsMessagePayload } from "../../interfaces";
import { PushAbstractStrategy } from "../PushAbstractStrategy";

export class ShopDeleteAppointmentPushStrategy extends PushAbstractStrategy {

    constructor() {
        super();
    }
    
    getPushNotificationType(): PushNotificationType {
        return "SHOP_DELETE_APPOINTMENT";
    }

    isValidMessage(message: ShopDeletedAppointmentSqsMessagePayload): boolean {
        return message.data.customerCognitoId != null;
    }

    // Retrieve the cognito ID of the customer whose appointment was deleted
    getPushNotificationReceiver(message: ShopDeletedAppointmentSqsMessagePayload): string[] {
        return [message.data.customerCognitoId]
    }

    // Retrieve metadata required for the push notification payload
    async getPushNotificationPayloadMetadata(message: ShopDeletedAppointmentSqsMessagePayload): Promise<ShopDeletedAppointmentPushNotificationPayloadMetadata> {
        return {
            type: this.getPushNotificationType(),
            appointmentId: message.data.appointmentId,
            shopName: message.data.shopName,
            appointmentStartAt: message.data.appointmentDate // Ensure the date is in ISO string format
        };
    }

    // Generate the push notification payload for the appointment deletion
    getPushNotificationPayload(metadata: ShopDeletedAppointmentPushNotificationPayloadMetadata): ShopDeleteAppointmentPushNotificationPayload {
        return {
            title: `Appuntamento annullato`,
            body: `L'appuntamento presso ${metadata.shopName} del ${new Date(metadata.appointmentStartAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })} è stato annullato.`
        };
    }
}
