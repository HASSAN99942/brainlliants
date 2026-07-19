class UserModel {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? phone;
  final String role;
  final String? subsystem;
  final String? examLevel;
  final String? specialty;
  final String? institution;
  final List<String> subjectsTaught;
  final int? yearsExperience;
  final String interfaceLanguage;
  final bool isVerified;
  final bool isTeacherVerified;
  final bool isPro;
  final String? proExpiry;
  final String? profilePhotoUrl;

  UserModel({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.phone,
    required this.role,
    this.subsystem,
    this.examLevel,
    this.specialty,
    this.institution,
    this.subjectsTaught = const [],
    this.yearsExperience,
    required this.interfaceLanguage,
    required this.isVerified,
    required this.isTeacherVerified,
    required this.isPro,
    this.proExpiry,
    this.profilePhotoUrl,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
    id: json['id'],
    email: json['email'],
    firstName: json['first_name'],
    lastName: json['last_name'],
    phone: json['phone'],
    role: json['role'],
    subsystem: json['subsystem'],
    examLevel: json['exam_level'],
    specialty: json['specialty'],
    institution: json['institution'],
    subjectsTaught: List<String>.from(json['subjects_taught'] ?? []),
    yearsExperience: json['years_experience'],
    interfaceLanguage: json['interface_language'] ?? 'en',
    isVerified: json['is_verified'] ?? false,
    isTeacherVerified: json['is_teacher_verified'] ?? false,
    isPro: json['is_pro'] ?? false,
    proExpiry: json['pro_expiry'],
    profilePhotoUrl: json['profile_photo_url'],
  );

  String get fullName => '$firstName $lastName';
  String get initials => '${firstName[0]}${lastName[0]}'.toUpperCase();
}
