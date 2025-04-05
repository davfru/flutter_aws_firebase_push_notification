import { PushAbstractStrategy } from "./PushAbstractStrategy";
import { CustomerBookAppointmentPushStrategy } from "./impl/CustomerBookAppointmentPushStrategy";
import { PushNotificationType } from "../interfaces";

export class PushStrategyFactory {

    constructor() {
    }

    getStrategy(event: PushNotificationType): PushAbstractStrategy | null {
        switch (event) {

            // push sent to a shop by customer
            case 'CUSTOMER_BOOK_APPOINTMENT':
                return new CustomerBookAppointmentPushStrategy();

            default:
                return null;
        }
    }
}