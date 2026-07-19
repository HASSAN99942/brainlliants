import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _formKey = GlobalKey<FormState>();
  String _lang = 'en';

  // Student fields
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _dob = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  final _specialty = TextEditingController();
  bool _showPassword = false;
  bool _showConfirm = false;

  // Teacher extra fields
  final _institution = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final isTeacher = _tabs.index == 1;
    final data = {
      'first_name': _firstName.text,
      'last_name': _lastName.text,
      'email': _email.text,
      'phone': '+237${_phone.text}',
      'password': _password.text,
      'confirm_password': _confirmPassword.text,
      'interface_language': _lang,
      if (!isTeacher) ...{
        'specialty': _specialty.text,
        'subsystem': 'anglophone',
        'exam_level': 'GCE_AL',
      },
      if (isTeacher) ...{
        'institution': _institution.text,
        'subjects_taught': [],
      },
    };
    if (isTeacher) {
      await ref.read(authProvider.notifier).registerTeacher(data);
    } else {
      await ref.read(authProvider.notifier).registerStudent(data);
    }
    final state = ref.read(authProvider);
    if (state.pendingUserId != null && mounted) {
      context.go('/otp', extra: {'email': _email.text});
    }
  }

  InputDecoration _inputDecoration(String label, {String? hint, Widget? prefix}) => InputDecoration(
    labelText: label,
    hintText: hint,
    prefixIcon: prefix,
    labelStyle: TextStyle(color: AppColors.textSecondary, fontSize: 13),
    hintStyle: TextStyle(color: AppColors.textMuted),
    filled: true,
    fillColor: Colors.white,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.inputBorder, width: 0.5)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.inputBorder, width: 0.5)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.inputBorderFocus, width: 1.5)),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
  );

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authProvider);
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text('Create your account', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              ),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Container(
                height: 44,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(12)),
                child: TabBar(
                  controller: _tabs,
                  indicator: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
                  indicatorSize: TabBarIndicatorSize.tab,
                  labelColor: AppColors.primary,
                  unselectedLabelColor: AppColors.textSecondary,
                  labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                  tabs: const [Tab(text: 'Student'), Tab(text: 'Teacher')],
                ),
              ),
            ),
            Expanded(
              child: Form(
                key: _formKey,
                child: TabBarView(
                  controller: _tabs,
                  children: [_buildStudentForm(state), _buildTeacherForm(state)],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStudentForm(AuthState state) => SingleChildScrollView(
    padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
    child: Column(children: [
      Row(children: [
        Expanded(child: TextFormField(controller: _firstName, decoration: _inputDecoration('First name', hint: 'Kofi'), validator: (v) => v!.isEmpty ? 'Required' : null)),
        const SizedBox(width: 12),
        Expanded(child: TextFormField(controller: _lastName, decoration: _inputDecoration('Last name', hint: 'Abena'), validator: (v) => v!.isEmpty ? 'Required' : null)),
      ]),
      const SizedBox(height: 14),
      TextFormField(controller: _email, decoration: _inputDecoration('Email', hint: 'kofi@example.com'), keyboardType: TextInputType.emailAddress, validator: (v) => v!.isEmpty ? 'Required' : null),
      const SizedBox(height: 14),
      TextFormField(
        controller: _phone,
        decoration: _inputDecoration('Phone', hint: '6 XX XX XX XX').copyWith(
          prefix: Text('+237  ', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 15)),
        ),
        keyboardType: TextInputType.phone,
      ),
      const SizedBox(height: 14),
      TextFormField(controller: _dob, decoration: _inputDecoration('Date of birth', hint: 'DD / MM / YYYY'), keyboardType: TextInputType.datetime),
      const SizedBox(height: 14),
      TextFormField(controller: _password, decoration: _inputDecoration('Password').copyWith(suffixIcon: IconButton(icon: Icon(_showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: AppColors.textMuted), onPressed: () => setState(() => _showPassword = !_showPassword))), obscureText: !_showPassword, validator: (v) => v!.length < 8 ? 'Min 8 characters' : null),
      const SizedBox(height: 14),
      TextFormField(controller: _confirmPassword, decoration: _inputDecoration('Confirm password').copyWith(suffixIcon: IconButton(icon: Icon(_showConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: AppColors.textMuted), onPressed: () => setState(() => _showConfirm = !_showConfirm))), obscureText: !_showConfirm),
      const SizedBox(height: 14),
      TextFormField(controller: _specialty, decoration: _inputDecoration('Specialty', hint: 'e.g. Science')),
      const SizedBox(height: 14),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text('App', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        Row(children: [
          GestureDetector(onTap: () => setState(() => _lang = 'en'), child: Text('EN', style: TextStyle(fontSize: 14, color: _lang == 'en' ? AppColors.textSecondary : AppColors.textMuted))),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => setState(() => _lang = 'fr'),
            child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), decoration: BoxDecoration(color: _lang == 'fr' ? AppColors.primary : Colors.transparent, borderRadius: BorderRadius.circular(8)),
              child: Text('FR', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: _lang == 'fr' ? Colors.white : AppColors.textMuted))),
          ),
        ]),
      ]),
      const SizedBox(height: 24),
      if (state.error != null) ...[
        Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: AppColors.errorLight, borderRadius: BorderRadius.circular(10)), child: Text(state.error!, style: TextStyle(color: AppColors.error, fontSize: 13))),
        const SizedBox(height: 12),
      ],
      SizedBox(width: double.infinity, height: 56, child: ElevatedButton(
        onPressed: state.isLoading ? null : _submit,
        style: ElevatedButton.styleFrom(backgroundColor: AppColors.action, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), elevation: 0),
        child: state.isLoading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : Text('Create account', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.actionText)),
      )),
      const SizedBox(height: 16),
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Text('Already have an account? ', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
        GestureDetector(onTap: () => context.go('/login'), child: Text('Log in', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 14))),
      ]),
    ]),
  );

  Widget _buildTeacherForm(AuthState state) => SingleChildScrollView(
    padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
    child: Column(children: [
      Row(children: [
        Expanded(child: TextFormField(controller: _firstName, decoration: _inputDecoration('First name', hint: 'Marie'))),
        const SizedBox(width: 12),
        Expanded(child: TextFormField(controller: _lastName, decoration: _inputDecoration('Last name', hint: 'Ngono'))),
      ]),
      const SizedBox(height: 14),
      TextFormField(controller: _email, decoration: _inputDecoration('Email'), keyboardType: TextInputType.emailAddress),
      const SizedBox(height: 14),
      TextFormField(controller: _phone, decoration: _inputDecoration('Phone', hint: '6 XX XX XX XX').copyWith(prefix: Text('+237  ', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 15))), keyboardType: TextInputType.phone),
      const SizedBox(height: 14),
      TextFormField(controller: _dob, decoration: _inputDecoration('Date of birth', hint: 'DD / MM / YYYY')),
      const SizedBox(height: 14),
      TextFormField(controller: _institution, decoration: _inputDecoration('Institution', hint: 'e.g. Lycée Général Leclerc')),
      const SizedBox(height: 14),
      TextFormField(controller: _password, decoration: _inputDecoration('Password').copyWith(suffixIcon: IconButton(icon: Icon(Icons.visibility_outlined, color: AppColors.textMuted), onPressed: () => setState(() => _showPassword = !_showPassword))), obscureText: !_showPassword),
      const SizedBox(height: 14),
      TextFormField(controller: _confirmPassword, decoration: _inputDecoration('Confirm password'), obscureText: true),
      const SizedBox(height: 24),
      SizedBox(width: double.infinity, height: 56, child: ElevatedButton(
        onPressed: state.isLoading ? null : _submit,
        style: ElevatedButton.styleFrom(backgroundColor: AppColors.action, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), elevation: 0),
        child: Text('Create account', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.actionText)),
      )),
      const SizedBox(height: 16),
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Text('Already have an account? ', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
        GestureDetector(onTap: () => context.go('/login'), child: Text('Log in', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 14))),
      ]),
    ]),
  );
}
