import { PushAbstractStrategy } from "./PushAbstractStrategy";
import { ShopCreateAppointmentPushStrategy } from "./impl/ShopCreateAppointmentPushStrategy";
import { CustomerBookAppointmentPushStrategy } from "./impl/CustomerBookAppointmentPushStrategy";
import { PushNotificationType } from "../interfaces";
import { ShopConfirmedAppointmentPushStrategy } from "./impl/ShopConfirmedAppointmentPushStrategy";
import { ShopDeleteAppointmentPushStrategy } from "./impl/ShopDeleteAppointmentPushStrategy";
import { CustomerDeleteAppointmentPushStrategy } from "./impl/CustomerDeleteAppointmentPushStrategy";
import { CustomerAppointmentOneDayLeftReminderPushStrategy } from "./impl/CustomerAppointmentOneDayLeftReminderPushStrategy";

export class PushStrategyFactory {

    constructor() {
    }

    getStrategy(/*client: PoolClient, */event: PushNotificationType): PushAbstractStrategy | null {
        switch (event) {

            // push sent to a customer by shop
            case 'SHOP_CREATE_APPOINTMENT':
                return new ShopCreateAppointmentPushStrategy();
            case 'SHOP_CONFIRMED_APPOINTMENT':
                return new ShopConfirmedAppointmentPushStrategy();
            case 'SHOP_DELETE_APPOINTMENT':
                return new ShopDeleteAppointmentPushStrategy();

            // push sent to a shop by customer
            case 'CUSTOMER_BOOK_APPOINTMENT':
                return new CustomerBookAppointmentPushStrategy();
            case 'CUSTOMER_DELETE_APPOINTMENT':
                return new CustomerDeleteAppointmentPushStrategy();
                 
            // scheduled push notification
            case 'CUSTOMER_APPOINTMENT_ONE_DAY_LEFT_REMINDER':
                return new CustomerAppointmentOneDayLeftReminderPushStrategy();

            default:
                return null;
        }
    }
}