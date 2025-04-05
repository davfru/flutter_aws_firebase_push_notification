import 'package:flutter/material.dart';
import 'package:push_notification/pages/get_started_screen.dart';

class AppRouter {
  Route onGenerateRoute(RouteSettings routeSettings) {
    switch (routeSettings.name) {
      case '/':
      case '/guest':
        return MaterialPageRoute(
            builder: (_) => GetStartedScreen(
                ));
      default:
        return MaterialPageRoute(
            builder: (_) => GetStartedScreen(
                ));
    }
  }

  void dispose() {}
}
