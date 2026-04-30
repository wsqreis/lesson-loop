import 'dart:convert';

import 'package:http/http.dart' as http;

import 'models.dart';

class LessonLoopApiClient {
  LessonLoopApiClient({required this.baseUrl, http.Client? httpClient})
      : _httpClient = httpClient ?? http.Client();

  final String baseUrl;
  final http.Client _httpClient;

  Future<ClassroomSession> fetchSessionByJoinCode(String joinCode) async {
    final normalizedJoinCode = joinCode.trim().toUpperCase();
    final response = await _httpClient.get(
      Uri.parse('$baseUrl/sessions/join/$normalizedJoinCode'),
    );
    if (response.statusCode == 404) {
      throw Exception('No classroom session found for that join code.');
    }
    if (response.statusCode != 200) {
      throw Exception('Could not load the classroom session.');
    }

    return ClassroomSession.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<void> submitAnswer(AnswerSubmission submission) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/answers'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode(submission.toJson()),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Could not submit the answer.');
    }
  }
}
