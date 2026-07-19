import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/storage/hive_service.dart';
import '../../../shared/models/user_model.dart';

class AuthRepository {
  final _client = ApiClient().dio;

  Future<Map<String, dynamic>> registerStudent(Map<String, dynamic> data) async {
    final response = await _client.post(ApiConstants.register, data: data);
    return response.data;
  }

  Future<Map<String, dynamic>> registerTeacher(Map<String, dynamic> data) async {
    final response = await _client.post(ApiConstants.registerTeacher, data: data);
    return response.data;
  }

  Future<UserModel> verifyOTP(String userId, String otpCode) async {
    final response = await _client.post(ApiConstants.verifyOtp, data: {
      'user_id': userId,
      'otp_code': otpCode,
    });
    await ApiClient().saveTokens(response.data['access'], response.data['refresh']);
    final user = UserModel.fromJson(response.data['user']);
    HiveService.userProfile.put('current_user', response.data['user']);
    return user;
  }

  Future<void> resendOTP(String userId) async {
    await _client.post(ApiConstants.resendOtp, data: {'user_id': userId});
  }

  Future<UserModel> login(String email, String password) async {
    final response = await _client.post(ApiConstants.login, data: {
      'email': email,
      'password': password,
    });
    await ApiClient().saveTokens(response.data['access'], response.data['refresh']);
    final user = UserModel.fromJson(response.data['user']);
    HiveService.userProfile.put('current_user', response.data['user']);
    return user;
  }

  Future<void> logout(String refreshToken) async {
    try {
      await _client.post(ApiConstants.logout, data: {'refresh': refreshToken});
    } catch (_) {}
    await ApiClient().clearTokens();
    HiveService.userProfile.clear();
  }

  Future<UserModel> getProfile() async {
    final response = await _client.get(ApiConstants.profile);
    return UserModel.fromJson(response.data);
  }

  Future<UserModel> updateProfile(Map<String, dynamic> data) async {
    final response = await _client.patch(ApiConstants.profile, data: data);
    return UserModel.fromJson(response.data);
  }

  Future<void> changeLanguage(String lang) async {
    await _client.patch(ApiConstants.changeLanguage, data: {'language': lang});
  }

  UserModel? getCachedUser() {
    final data = HiveService.userProfile.get('current_user');
    if (data == null) return null;
    return UserModel.fromJson(Map<String, dynamic>.from(data));
  }
}
