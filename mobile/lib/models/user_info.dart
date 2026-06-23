class UserInfo {
  final String id;
  final String name;
  final String email;
  final String role;
  final String avatar;
  final bool verified;
  final String language;
  final String theme;

  UserInfo({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.avatar = '',
    this.verified = false,
    this.language = 'en',
    this.theme = 'dark',
  });

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'user',
      avatar: json['avatar'] ?? '',
      verified: json['verified'] ?? false,
      language: json['language'] ?? 'en',
      theme: json['theme'] ?? 'dark',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'avatar': avatar,
      'verified': verified,
      'language': language,
      'theme': theme,
    };
  }
}
