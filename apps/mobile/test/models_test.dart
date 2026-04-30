import 'package:flutter_test/flutter_test.dart';
import 'package:lesson_loop_mobile/models.dart';

void main() {
  test('parses classroom session payload', () {
    final session = ClassroomSession.fromJson({
      'id': 'session-1',
      'title': 'Fractions Warm-up',
      'subject': 'Math',
      'grade': 'Grade 4',
      'activities': [
        {'id': 'activity-1', 'prompt': 'What equals 1/2?', 'kind': 'multiple_choice'},
      ],
    });

    expect(session.title, 'Fractions Warm-up');
    expect(session.activities.single.prompt, 'What equals 1/2?');
  });

  test('serializes answer submission payload', () {
    const submission = AnswerSubmission(
      sessionId: 'session-1',
      activityId: 'activity-1',
      studentCode: 'S-1001',
      answer: '2/4',
      isCorrect: true,
    );

    expect(submission.toJson(), {
      'sessionId': 'session-1',
      'activityId': 'activity-1',
      'studentCode': 'S-1001',
      'answer': '2/4',
      'isCorrect': true,
    });
  });
}
