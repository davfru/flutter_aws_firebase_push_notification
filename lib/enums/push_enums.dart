enum PushNotificationType {
  // sent to shop by customer
  customerBookAppointment('CUSTOMER_BOOK_APPOINTMENT'),

  unknown('UNKNOWN');

  const PushNotificationType(this.serverValue);

  final String serverValue;

  @override
  String toString() => name;

  factory PushNotificationType.fromJson(String serverValue) {
    switch (serverValue) {
      // received from shop by customer
      case "CUSTOMER_BOOK_APPOINTMENT":
        return PushNotificationType.customerBookAppointment;

      default:
        return PushNotificationType.unknown;
    }
  }
}