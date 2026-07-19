import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

/// Opens a PDF URL for viewing.
///
/// On web this opens the PDF in a new browser tab (browsers render PDFs
/// natively); on mobile/desktop it hands off to the system's external viewer.
/// This replaces the mobile-only `flutter_pdfview` so the app compiles and
/// works on Flutter web.
Future<void> openPdf(BuildContext context, String? url) async {
  if (url == null || url.isEmpty) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No PDF available for this item.')),
      );
    }
    return;
  }
  final messenger = ScaffoldMessenger.of(context);
  try {
    final ok = await launchUrl(
      Uri.parse(url),
      mode: LaunchMode.externalApplication,
      webOnlyWindowName: '_blank',
    );
    if (!ok) {
      messenger.showSnackBar(const SnackBar(content: Text('Could not open the PDF.')));
    }
  } catch (_) {
    messenger.showSnackBar(const SnackBar(content: Text('Could not open the PDF.')));
  }
}
