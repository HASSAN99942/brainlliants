import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';

/// Mobile/desktop implementation: downloads the PDF to the app documents
/// directory so it can be opened offline later.
Future<String?> downloadPdfToDevice(
  String url,
  String id, {
  void Function(double)? onProgress,
}) async {
  final dir = await getApplicationDocumentsDirectory();
  final path = '${dir.path}/brailliants_$id.pdf';
  await Dio().download(
    url,
    path,
    onReceiveProgress: (received, total) {
      if (total > 0 && onProgress != null) onProgress(received / total);
    },
  );
  return path;
}

bool downloadedFileExists(String? path) =>
    path != null && path.isNotEmpty && File(path).existsSync();
