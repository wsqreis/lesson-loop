class ClassroomActivity {
  const ClassroomActivity({
    required this.id,
    required this.prompt,
    required this.kind,
  });

  factory ClassroomActivity.fromJson(Map<String, dynamic> json) {
    return ClassroomActivity(
      id: json['id'] as String,
      prompt: json['prompt'] as String,
      kind: json['kind'] as String? ?? 'open_response',
    );
  }

  final String id;
  final String prompt;
  final String kind;
}

class ClassroomSession {
  const ClassroomSession({
    required this.id,
    required this.joinCode,
    required this.title,
    required this.subject,
    required this.grade,
    required this.activities,
  });

  factory ClassroomSession.fromJson(Map<String, dynamic> json) {
    final activitiesJson = json['activities'] as List<dynamic>? ?? const [];
    return ClassroomSession(
      id: json['id'] as String,
      joinCode: json['joinCode'] as String? ?? '',
      title: json['title'] as String,
      subject: json['subject'] as String,
      grade: json['grade'] as String,
      activities: activitiesJson
          .map((activity) => ClassroomActivity.fromJson(activity as Map<String, dynamic>))
          .toList(),
    );
  }

  final String id;
  final String joinCode;
  final String title;
  final String subject;
  final String grade;
  final List<ClassroomActivity> activities;
}

class AnswerSubmission {
  const AnswerSubmission({
    required this.sessionId,
    required this.activityId,
    required this.studentCode,
    required this.answer,
    required this.isCorrect,
  });

  Map<String, dynamic> toJson() {
    return {
      'sessionId': sessionId,
      'activityId': activityId,
      'studentCode': studentCode,
      'answer': answer,
      'isCorrect': isCorrect,
    };
  }

  final String sessionId;
  final String activityId;
  final String studentCode;
  final String answer;
  final bool isCorrect;
}
