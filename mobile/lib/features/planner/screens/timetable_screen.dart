import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../data/planner_repository.dart';

class TimetableScreen extends ConsumerStatefulWidget {
  const TimetableScreen({super.key});
  @override
  ConsumerState<TimetableScreen> createState() => _TimetableScreenState();
}

class _TimetableScreenState extends ConsumerState<TimetableScreen> {
  final _repo = PlannerRepository();
  static const _days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  static const _times = ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM'];
  static const _colors = [Color(0xFF7F77DD), Color(0xFFE8A020), Color(0xFF1D9E75), Color(0xFFE24B4A)];

  // entries: [{day: 0-6, slot: 0-8, subject: 'Maths', color: 0}]
  List<Map<String, dynamic>> _entries = [];
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final entries = await _repo.getTimetable();
      if (mounted) setState(() { _entries = List<Map<String, dynamic>>.from(entries); _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await _repo.saveTimetable(_entries);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Timetable saved')));
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not save')));
    }
    if (mounted) setState(() => _saving = false);
  }

  Map<String, dynamic>? _entryAt(int day, int slot) {
    for (final e in _entries) {
      if (e['day'] == day && e['slot'] == slot) return e;
    }
    return null;
  }

  void _onCellTap(int day, int slot) {
    final existing = _entryAt(day, slot);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _SessionSheet(
        initialSubject: existing?['subject'],
        initialColor: existing?['color'] ?? 0,
        isEdit: existing != null,
        onSave: (subject, color) {
          setState(() {
            _entries.removeWhere((e) => e['day'] == day && e['slot'] == slot);
            _entries.add({'day': day, 'slot': slot, 'subject': subject, 'color': color});
          });
        },
        onDelete: existing != null ? () {
          setState(() => _entries.removeWhere((e) => e['day'] == day && e['slot'] == slot));
        } : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.white, elevation: 0,
        leading: IconButton(icon: Icon(Icons.arrow_back_ios, color: AppColors.textPrimary, size: 20), onPressed: () => Navigator.pop(context)),
        title: Text('Timetable', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: GestureDetector(
              onTap: _saving ? null : _save,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(color: AppColors.action, borderRadius: BorderRadius.circular(12)),
                child: _saving
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text('Save', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.actionText)),
              ),
            ),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(12),
              child: Column(children: [
                // Header row
                Row(children: [
                  const SizedBox(width: 44),
                  ..._days.map((d) => Expanded(child: Center(
                      child: Text(d, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textSecondary))))),
                ]),
                const SizedBox(height: 8),
                // Grid rows
                ..._times.asMap().entries.map((timeEntry) {
                  final slot = timeEntry.key;
                  return Row(children: [
                    SizedBox(width: 44, child: Text(timeEntry.value, style: TextStyle(fontSize: 11, color: AppColors.textSecondary))),
                    ..._days.asMap().entries.map((dayEntry) {
                      final day = dayEntry.key;
                      final entry = _entryAt(day, slot);
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => _onCellTap(day, slot),
                          child: Container(
                            height: 64,
                            margin: const EdgeInsets.all(2),
                            decoration: BoxDecoration(
                              color: entry != null ? _colors[entry['color'] % _colors.length] : Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: entry == null ? Border.all(color: AppColors.inputBorder, width: 0.5) : null,
                            ),
                            child: entry != null
                                ? Center(child: Padding(
                                    padding: const EdgeInsets.all(2),
                                    child: Text(entry['subject'], style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                                        textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis)))
                                : null,
                          ),
                        ),
                      );
                    }),
                  ]);
                }),
              ]),
            ),
    );
  }
}

class _SessionSheet extends StatefulWidget {
  final String? initialSubject;
  final int initialColor;
  final bool isEdit;
  final void Function(String subject, int color) onSave;
  final VoidCallback? onDelete;
  const _SessionSheet({this.initialSubject, this.initialColor = 0, this.isEdit = false, required this.onSave, this.onDelete});
  @override
  State<_SessionSheet> createState() => _SessionSheetState();
}

class _SessionSheetState extends State<_SessionSheet> {
  late TextEditingController _controller;
  late int _color;
  static const _colors = [Color(0xFF7F77DD), Color(0xFFE8A020), Color(0xFF1D9E75), Color(0xFFE24B4A)];

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialSubject);
    _color = widget.initialColor;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(left: 20, right: 20, top: 24, bottom: MediaQuery.of(context).viewInsets.bottom + 24),
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(widget.isEdit ? 'Edit session' : 'Add session', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        const SizedBox(height: 16),
        TextField(controller: _controller, autofocus: true, decoration: InputDecoration(
          hintText: 'Subject (e.g. Maths)', hintStyle: TextStyle(color: AppColors.textMuted),
          filled: true, fillColor: AppColors.bg,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        )),
        const SizedBox(height: 16),
        Text('Colour', style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
        const SizedBox(height: 10),
        Row(children: List.generate(_colors.length, (i) => GestureDetector(
          onTap: () => setState(() => _color = i),
          child: Container(
            margin: const EdgeInsets.only(right: 12),
            width: 40, height: 40,
            decoration: BoxDecoration(color: _colors[i], shape: BoxShape.circle,
                border: _color == i ? Border.all(color: AppColors.textPrimary, width: 2) : null),
            child: _color == i ? const Icon(Icons.check, color: Colors.white, size: 20) : null,
          ),
        ))),
        const SizedBox(height: 24),
        SizedBox(width: double.infinity, height: 52, child: ElevatedButton(
          onPressed: () {
            if (_controller.text.trim().isNotEmpty) {
              widget.onSave(_controller.text.trim(), _color);
              Navigator.pop(context);
            }
          },
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.action, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), elevation: 0),
          child: Text(widget.isEdit ? 'Update' : 'Add', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.actionText)),
        )),
        if (widget.onDelete != null) ...[
          const SizedBox(height: 10),
          SizedBox(width: double.infinity, height: 52, child: TextButton(
            onPressed: () { widget.onDelete!(); Navigator.pop(context); },
            child: Text('Delete', style: TextStyle(fontSize: 16, color: AppColors.error, fontWeight: FontWeight.w500)),
          )),
        ],
      ]),
    );
  }
}
