import 'package:flutter/material.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';
import '../../../core/constants/app_colors.dart';

/// In-app native PDF viewer (Android/iOS). Renders a locally downloaded file,
/// so it works fully offline.
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
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: AppColors.textPrimary, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
      ),
      body: (filePath == null)
          ? Center(child: Text('File not available.', style: TextStyle(color: AppColors.textSecondary)))
          : PDFView(filePath: filePath!),
    );
  }
}
