import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../data/pdf_opener.dart';
import '../data/content_repository.dart';
import '../providers/content_provider.dart';

class QuestionDetailScreen extends ConsumerStatefulWidget {
  final Map item;
  const QuestionDetailScreen({super.key, required this.item});
  @override
  ConsumerState<QuestionDetailScreen> createState() => _QuestionDetailScreenState();
}

class _QuestionDetailScreenState extends ConsumerState<QuestionDetailScreen> {
  final _repo = ContentRepository();
  late bool _bookmarked;
  Map<String, dynamic>? _detail;
  DownloadStatus _status = DownloadStatus.notDownloaded;

  static const _examLabels = {
    'GCE_OL': 'GCE O/L', 'GCE_AL': 'GCE A/L', 'BAC_A': 'BAC A', 'BAC_C': 'BAC C',
    'BAC_D': 'BAC D', 'BAC_E': 'BAC E', 'BAC_TECH': 'BAC Technique', 'BEPC': 'BEPC',
    'PROBATOIRE': 'Probatoire', 'HND': 'HND', 'CEP': 'CEP',
  };

  String get _id => widget.item['id'];
  bool get _isFrench => (widget.item['language'] == 'fr');

  @override
  void initState() {
    super.initState();
    _bookmarked = widget.item['is_bookmarked'] ?? false;
    _status = _repo.isQuestionDownloaded(_id)
        ? DownloadStatus.downloaded
        : DownloadStatus.notDownloaded;
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    try {
      final data = await _repo.getQuestionDetail(_id);
      if (mounted) setState(() => _detail = data);
    } catch (_) {}
  }

  Future<void> _toggleBookmark() async {
    setState(() => _bookmarked = !_bookmarked);
    try {
      await _repo.toggleBookmark('question', _id);
    } catch (_) {
      if (mounted) setState(() => _bookmarked = !_bookmarked);
    }
  }

  Future<void> _download() async {
    setState(() => _status = DownloadStatus.downloading);
    try {
      final result = await _repo.requestQuestionDownload(_id);
      final url = result['pdf_url'] as String?;
      String? localPath;
      if (url != null) localPath = await _repo.downloadPdf(url, _id);
      _repo.markQuestionDownloaded(_id, Map<String, dynamic>.from(widget.item), localPath: localPath);
      if (mounted) setState(() => _status = DownloadStatus.downloaded);
    } catch (e) {
      final locked = isLockedError(e);
      if (mounted) {
        setState(() => _status = locked ? DownloadStatus.locked : DownloadStatus.notDownloaded);
        if (locked) context.push('/paywall');
      }
    }
  }

  void _viewPdf() => openContentPdf(
        context,
        localPath: _repo.localPathForQuestion(_id),
        url: _detail?['pdf_url'] ?? widget.item['pdf_url'],
        title: widget.item['title'] ?? 'PDF',
      );

  void _startQuiz() {
    final questions = (_detail?['json_data']?['questions'] as List?) ?? const [];
    if (questions.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Quiz not available for this paper yet.')));
      return;
    }
    context.push('/home/ai/quiz', extra: {'questions': questions, 'sessionId': null});
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final hasQuiz = item['format'] == 'json' || item['format'] == 'both';
    final sizeMb = ((item['file_size_kb'] ?? 0) / 1024).toStringAsFixed(1);
    final langLabel = _isFrench ? 'French' : 'English';

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: AppColors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text('Paper details',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        actions: [
          IconButton(
            icon: Icon(_bookmarked ? Icons.bookmark : Icons.bookmark_border,
                color: _bookmarked ? AppColors.action : AppColors.primaryMid),
            onPressed: _toggleBookmark,
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(item['title'] ?? '',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary, height: 1.3)),
            const SizedBox(height: 20),
            // Info card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.inputBorder, width: 0.5),
              ),
              child: Column(children: [
                _infoRow('Exam', _examLabels[item['exam_type']] ?? item['exam_type'] ?? '—'),
                _divider(),
                _infoRow('Subject', item['subject'] ?? '—'),
                _divider(),
                _infoRow('Year', item['year']?.toString() ?? '—'),
                _divider(),
                _infoRow('Specialty', (item['specialty']?.toString().isNotEmpty ?? false) ? item['specialty'] : '—'),
                _divider(),
                _infoRow('Language', langLabel),
                _divider(),
                _infoRow('File size', '$sizeMb MB'),
              ]),
            ),
            const SizedBox(height: 20),
            // View PDF button
            SizedBox(
              width: double.infinity, height: 54,
              child: ElevatedButton.icon(
                onPressed: _viewPdf,
                icon: Icon(Icons.description_outlined, color: AppColors.primary, size: 20),
                label: Text(_isFrench ? 'Voir le PDF' : 'View PDF',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.primary)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryLight,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ),
            const SizedBox(height: 14),
            _downloadSection(),
            if (hasQuiz) ...[
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity, height: 54,
                child: ElevatedButton(
                  onPressed: _startQuiz,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.action, elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text('Start Quiz',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.actionText)),
                ),
              ),
            ],
          ]),
        ),
      ),
    );
  }

  Widget _downloadSection() {
    switch (_status) {
      case DownloadStatus.downloaded:
        return Center(
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.check_circle, color: AppColors.success, size: 18),
            const SizedBox(width: 6),
            Text('Downloaded · Ready offline',
                style: TextStyle(fontSize: 14, color: AppColors.success, fontWeight: FontWeight.w500)),
          ]),
        );
      case DownloadStatus.downloading:
        return const Center(child: SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2)));
      case DownloadStatus.locked:
        return Column(children: [
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(Icons.lock_outline, color: AppColors.primaryMid, size: 18),
            const SizedBox(width: 6),
            Text('Upgrade to Pro to download', style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
          ]),
          const SizedBox(height: 10),
          _amberButton('Upgrade', () => context.push('/paywall')),
        ]);
      case DownloadStatus.notDownloaded:
        return _amberButton(_isFrench ? 'Télécharger hors ligne' : 'Download for offline', _download);
    }
  }

  Widget _amberButton(String label, VoidCallback onTap) => SizedBox(
        width: double.infinity, height: 54,
        child: ElevatedButton(
          onPressed: onTap,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.action, elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          child: Text(label, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.actionText)),
        ),
      );

  Widget _infoRow(String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label, style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
          const SizedBox(width: 12),
          Flexible(child: Text(value, textAlign: TextAlign.right,
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary))),
        ]),
      );

  Widget _divider() => Divider(height: 1, thickness: 0.5, color: AppColors.inputBorder);
}
