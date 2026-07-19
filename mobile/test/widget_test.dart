// Basic unit test for the Sprint 1 user model.
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/shared/models/user_model.dart';

void main() {
  test('UserModel.fromJson parses fields and derives fullName/initials', () {
    final user = UserModel.fromJson({
      'id': 'abc-123',
      'email': 'kofi@example.com',
      'first_name': 'Kofi',
      'last_name': 'Abena',
      'role': 'student',
      'interface_language': 'en',
      'is_verified': true,
      'is_teacher_verified': false,
      'is_pro': false,
    });

    expect(user.fullName, 'Kofi Abena');
    expect(user.initials, 'KA');
    expect(user.isVerified, isTrue);
    expect(user.subjectsTaught, isEmpty);
  });
}
