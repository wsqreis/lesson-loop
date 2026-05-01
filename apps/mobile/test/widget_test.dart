import 'package:flutter_test/flutter_test.dart';

import 'package:lesson_loop_mobile/main.dart';

void main() {
  testWidgets('renders classroom app shell', (WidgetTester tester) async {
    await tester.pumpWidget(const LessonLoopApp());

    expect(find.text('LessonLoop Classroom'), findsOneWidget);
    expect(find.text('API base URL'), findsOneWidget);
    expect(find.text('Join session'), findsOneWidget);
  });
}
