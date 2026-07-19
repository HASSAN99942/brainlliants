/// Web implementation: the browser has no persistent app-file storage for
/// downloads, so offline files are a mobile-only feature. These no-ops keep the
/// shared API identical to [download_helper_io.dart] so the rest of the app is
/// platform-agnostic. On web, PDFs are viewed by opening the URL in a new tab.
Future<String?> downloadPdfToDevice(
  String url,
  String id, {
  void Function(double)? onProgress,
}) async =>
    null;

bool downloadedFileExists(String? path) => false;
