import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import '../../../core/utils/pdf_launcher.dart';
// Native viewer on mobile, harmless stub on web (keeps flutter_pdfview out of
// the web build).
import '../screens/pdf_viewer_native.dart'
    if (dart.library.html) '../screens/pdf_viewer_web.dart';

/// Opens a content PDF for the current platform:
///  - Mobile with a downloaded local file → in-app native viewer (offline).
///  - Web, or not-yet-downloaded → open the URL in a new browser tab / external
///    viewer via url_launcher.
Future<void> openContentPdf(
  BuildContext context, {
  String? localPath,
  String? url,
  String title = 'PDF',
}) async {
  if (!kIsWeb && localPath != null) {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => PdfViewerScreen(filePath: localPath, title: title)),
    );
  } else {
    await openPdf(context, url);
  }
}
