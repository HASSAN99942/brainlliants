// Riverpod 3.x moved StateNotifier/StateNotifierProvider to the legacy library.
import 'package:flutter_riverpod/legacy.dart';
import '../data/auth_repository.dart';
import '../../../shared/models/user_model.dart';

class AuthState {
  final bool isLoading;
  final UserModel? user;
  final String? error;
  final bool isAuthenticated;
  final String? pendingUserId;
  final String? pendingEmail;

  const AuthState({
    this.isLoading = false,
    this.user,
    this.error,
    this.isAuthenticated = false,
    this.pendingUserId,
    this.pendingEmail,
  });

  AuthState copyWith({
    bool? isLoading, UserModel? user, String? error,
    bool? isAuthenticated, String? pendingUserId, String? pendingEmail,
  }) => AuthState(
    isLoading: isLoading ?? this.isLoading,
    user: user ?? this.user,
    error: error,
    isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    pendingUserId: pendingUserId ?? this.pendingUserId,
    pendingEmail: pendingEmail ?? this.pendingEmail,
  );
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repo;
  AuthNotifier(this._repo) : super(const AuthState()) {
    _checkCachedUser();
  }

  void _checkCachedUser() {
    final user = _repo.getCachedUser();
    if (user != null) state = state.copyWith(user: user, isAuthenticated: true);
  }

  Future<void> registerStudent(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _repo.registerStudent(data);
      state = state.copyWith(
        isLoading: false,
        pendingUserId: result['user_id'],
        pendingEmail: data['email'],
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _parseError(e));
    }
  }

  Future<void> registerTeacher(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _repo.registerTeacher(data);
      state = state.copyWith(
        isLoading: false,
        pendingUserId: result['user_id'],
        pendingEmail: data['email'],
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _parseError(e));
    }
  }

  Future<bool> verifyOTP(String otp) async {
    if (state.pendingUserId == null) return false;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _repo.verifyOTP(state.pendingUserId!, otp);
      state = state.copyWith(isLoading: false, user: user, isAuthenticated: true);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _parseError(e));
      return false;
    }
  }

  Future<void> resendOTP() async {
    if (state.pendingUserId == null) return;
    try { await _repo.resendOTP(state.pendingUserId!); } catch (_) {}
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _repo.login(email, password);
      state = state.copyWith(isLoading: false, user: user, isAuthenticated: true);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _parseError(e));
      return false;
    }
  }

  Future<void> logout() async {
    await _repo.logout('');
    state = const AuthState();
  }

  void setLanguage(String lang) {
    _repo.changeLanguage(lang);
  }

  String _parseError(dynamic e) {
    if (e is Exception) return e.toString().replaceAll('Exception: ', '');
    return 'Something went wrong. Please try again.';
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(AuthRepository());
});
