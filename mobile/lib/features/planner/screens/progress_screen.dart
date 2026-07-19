import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../data/planner_repository.dart';

class ProgressScreen extends ConsumerStatefulWidget {
  const ProgressScreen({super.key});
  @override
  ConsumerState<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends ConsumerState<ProgressScreen> {
  final _repo = PlannerRepository();
  // Amber-tint for the streak flame circle (design token #FAEEDA — not in the
  // locked AppColors palette, so kept as a local literal).
  static const _amberTint = Color(0xFFFAEEDA);
  Map<String, dynamic>? _data;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _repo.getProgress();
      if (mounted) setState(() { _data = data; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _openLogSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _LogSessionSheet(onLog: (minutes) async {
        await _repo.logSession(minutes);
        _load();
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.white, elevation: 0,
        leading: IconButton(icon: Icon(Icons.arrow_back_ios, color: AppColors.textPrimary, size: 20), onPressed: () => Navigator.pop(context)),
        title: Text('My progress', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _data == null
              ? Center(child: Text('Could not load progress', style: TextStyle(color: AppColors.textSecondary)))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    // Streak header
                    Row(children: [
                      Container(width: 64, height: 64, decoration: const BoxDecoration(color: _amberTint, shape: BoxShape.circle),
                          child: Icon(Icons.local_fire_department, color: AppColors.action, size: 32)),
                      const SizedBox(width: 16),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('${_data!['streak']} day streak', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                        const SizedBox(height: 4),
                        Text('Keep it up — best streak: ${_data!['best_streak']} days', style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
                      ])),
                    ]),
                    const SizedBox(height: 24),
                    // Stat cards
                    Row(children: [
                      _statCard('${_data!['total_hours']}h', 'Total hours'),
                      const SizedBox(width: 12),
                      _statCard('${_data!['quizzes_this_month']}', 'Quizzes this month'),
                      const SizedBox(width: 12),
                      _statCard('${_data!['ai_used']}/${_data!['ai_limit'] ?? '∞'}', 'AI queries used'),
                    ]),
                    const SizedBox(height: 20),
                    // Weekly chart
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.inputBorder, width: 0.5)),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('This week', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                        const SizedBox(height: 20),
                        _weekChart(),
                      ]),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(width: double.infinity, height: 56, child: ElevatedButton(
                      onPressed: _openLogSheet,
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.action, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), elevation: 0),
                      child: Text('Log study session', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.actionText)),
                    )),
                  ]),
                ),
    );
  }

  Widget _statCard(String value, String label) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 8),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.inputBorder, width: 0.5)),
      child: Column(children: [
        Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 12, color: AppColors.textSecondary), textAlign: TextAlign.center),
      ]),
    ),
  );

  Widget _weekChart() {
    final week = _data!['week'] as List;
    final maxMinutes = week.fold<int>(0, (m, d) => (d['minutes'] as int) > m ? d['minutes'] as int : m);
    final safeMax = maxMinutes == 0 ? 1 : maxMinutes;

    return SizedBox(
      height: 140,
      child: Row(crossAxisAlignment: CrossAxisAlignment.end, mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: week.map((d) {
          final minutes = d['minutes'] as int;
          final isToday = d['is_today'] as bool;
          final barHeight = (minutes / safeMax * 100).clamp(4.0, 100.0);
          return Column(mainAxisAlignment: MainAxisAlignment.end, children: [
            Container(
              width: 24, height: barHeight,
              decoration: BoxDecoration(
                color: isToday ? AppColors.action : (minutes > 0 ? AppColors.primaryMid : AppColors.primaryLight),
                borderRadius: BorderRadius.circular(6),
              ),
            ),
            const SizedBox(height: 8),
            Text(d['label'], style: TextStyle(fontSize: 12, fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
                color: isToday ? AppColors.action : AppColors.textSecondary)),
          ]);
        }).toList(),
      ),
    );
  }
}

class _LogSessionSheet extends StatefulWidget {
  final void Function(int minutes) onLog;
  const _LogSessionSheet({required this.onLog});
  @override
  State<_LogSessionSheet> createState() => _LogSessionSheetState();
}

class _LogSessionSheetState extends State<_LogSessionSheet> {
  double _minutes = 45;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Log study session', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        const SizedBox(height: 20),
        Center(child: Text('${_minutes.round()} min', style: TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: AppColors.primary))),
        const SizedBox(height: 16),
        SliderTheme(
          data: SliderTheme.of(context).copyWith(
            activeTrackColor: AppColors.action,
            inactiveTrackColor: AppColors.primaryLight,
            thumbColor: AppColors.action,
            overlayColor: AppColors.action.withOpacity(0.2),
          ),
          child: Slider(value: _minutes, min: 0, max: 180, divisions: 36, onChanged: (v) => setState(() => _minutes = v)),
        ),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('0 min', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          Text('180 min', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
        ]),
        const SizedBox(height: 24),
        SizedBox(width: double.infinity, height: 56, child: ElevatedButton(
          onPressed: _minutes > 0 ? () { widget.onLog(_minutes.round()); Navigator.pop(context); } : null,
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.action, disabledBackgroundColor: AppColors.actionDisabled,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), elevation: 0),
          child: Text('Log session', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.actionText)),
        )),
      ]),
    );
  }
}
