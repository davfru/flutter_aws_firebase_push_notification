import 'dart:async';
import 'dart:convert';
import 'dart:developer';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:push_notification/enums/push_enums.dart';
import 'package:push_notification/env_config.dart';
import 'package:push_notification/firebase_options.dart';
import 'package:push_notification/routing/app_router.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  // load flavor
  const String flavor = String.fromEnvironment('FLAVOR', defaultValue: 'prod');
  await EnvConfig.load(flavor);

  // ########
  // FIREBASE
  // ########

  // Initialize Firebase depending on flavor
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  // Initialize Flutter Local Notifications
  const AndroidInitializationSettings initializationSettingsAndroid =
      AndroidInitializationSettings('@mipmap/ic_launcher');
  const InitializationSettings initializationSettings =
      InitializationSettings(android: initializationSettingsAndroid);

  await flutterLocalNotificationsPlugin.initialize(
    initializationSettings,
    onDidReceiveNotificationResponse:
        (NotificationResponse notificationResponse) async {
      if (notificationResponse.payload != null) {
        Map<String, dynamic> payloadData =
            jsonDecode(notificationResponse.payload!);

        PushNotificationType pushType =
            PushNotificationType.fromJson(payloadData['type']);

        switch (pushType) {
          case PushNotificationType.customerBookAppointment:
            log(payloadData.toString());
            break;
          default:
            return;
        }
      }
    },
  );

  // allows the notification to show up even when the app is opened
  FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
      alert: true, badge: true, sound: true);

  // Called when the app closed
  FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
    await handlePushNotification(message);
  });

  runApp(
    MyApp(),
  );
}

Future<Map<String, String>> getChannelDetails() async {
  const platform =
      MethodChannel('com.example.push_notifications/notifications');

  try {
    final channelDetails =
        await platform.invokeMethod<Map<dynamic, dynamic>>('getChannelDetails');
    return Map<String, String>.from(channelDetails!);
  } catch (e) {
    log("Error retrieving channel details: $e");
    return {
      "id": "appointment_channel",
      "name": "appointment_channel_name",
      "description": "appointment_channel_description"
    };
  }
}

Future<void> handlePushNotification(RemoteMessage message) async {
  log("message received: $message");
  RemoteNotification? notification = message.notification;
  AndroidNotification? android = message.notification?.android;

  if (notification == null || android == null) {
    return;
  }

  final channelDetails = await getChannelDetails();

  AndroidNotificationDetails androidPlatformChannelSpecifics =
      AndroidNotificationDetails(
    channelDetails['id']!, // localized channel id
    channelDetails['name']!, // localized channel name
    channelDescription: channelDetails['description'], // channel description
    importance: Importance.max,
    priority: Priority.high,
    styleInformation: BigTextStyleInformation(notification.body ?? ''),
    showWhen: true,
  );

  NotificationDetails platformChannelSpecifics =
      NotificationDetails(android: androidPlatformChannelSpecifics);

  // show the notification
  await flutterLocalNotificationsPlugin.show(
    notification.hashCode,
    notification.title,
    notification.body,
    platformChannelSpecifics,
    payload: jsonEncode(message.data),
  );
}

Future<void> askPushNotificationPermission() async {
  PermissionStatus status = await Permission.notification.status;

  if (!status.isGranted) {
    // The permission is not granted, request it.
    status = await Permission.notification.request();
  }
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final AppRouter _appRouter = AppRouter();

  @override
  void initState() {
    super.initState();
    askPushNotificationPermission();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(useMaterial3: true, fontFamily: 'Poppins'),
      onGenerateRoute: _appRouter.onGenerateRoute,
      navigatorKey: navigatorKey,
    );
  }

  @override
  void dispose() {
    _appRouter.dispose();
    super.dispose();
  }
}
