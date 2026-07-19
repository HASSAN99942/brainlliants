import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

/// Web stub for the native PDF viewer. Web never routes here (PDFs open in a new
/// browser tab via url_launcher), but this keeps [PdfViewerScreen] resolvable in
/// the web build without pulling in the mobile-only flutter_pdfview plugin.
class PdfViewerScreen extends StatelessWidget {
  final String? filePath;
  final String title;
  const PdfViewerScreen({super.key, this.filePath, this.title = 'PDF'});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(title,
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
      ),
      body: Center(
        child: Text('PDFs open in a new browser tab on web.',
            style: TextStyle(color: AppColors.textSecondary)),
      ),
    );
  }
}
