/* ══════════════════════════════════════════════════════════
   Школа ИКС — BILLING TESTS
   Запуск из консоли: XBillingTests.run()
   Или через страницу tests.html.
   Без фреймворков. Каждый тест работает в «песочнице»:
   состояние сбрасывается через XSchool.reset() и восстанавливается обратно.
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  if (!window.XSchool || !window.XBilling) {
    console.error('[xschool/billing.test] требуются store.js и billing.js');
    return;
  }

  const Store = window.XSchool;
  const HOUR_MS = 60 * 60 * 1000;

  /* ── Хелперы ─────────────────────────────────────────────── */
  function withSandbox(fn) {
    const backup = JSON.stringify(Store.state);
    Store.reset();
    try { return fn(); }
    finally { localStorage.setItem('xschool', backup); }
  }

  function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'assertion failed');
  }

  function eq(a, b, msg) {
    if (a !== b) throw new Error((msg || 'eq') + ': ' + a + ' !== ' + b);
  }

  function makeIndividualLesson(opts) {
    // создаёт индивидуальный урок в произвольное время + опционально пакет
    const teacher = Store.state.users.find(u => u.role === 'teacher');
    const student = Store.state.users.find(u => u.id === 'u-student-1');
    const startAt = opts.startAt || new Date(Date.now() + 24 * HOUR_MS).toISOString();

    const lesson = Store.addLesson({
      subjectId: opts.subjectId || 'math',
      teacherId: teacher.id,
      type: 'individual',
      startAt,
      participants: [{ studentId: student.id, status: 'planned' }]
    });

    if (opts.withPackage !== false) {
      // используем pk-1 (math, 5 уроков остатка) — он уже в seeds
    }
    return { lesson, student, teacher };
  }

  /* ── Сценарии ────────────────────────────────────────────── */
  const cases = [];

  cases.push(['done → списано 1 урок', () => {
    const { lesson, student } = makeIndividualLesson({ subjectId: 'math' });
    const before = Store.state.packages.find(p => p.id === 'pk-1').remaining;

    const r = window.XBilling.applyLessonStatus(lesson.id, {
      studentId: student.id, status: 'done', actor: 'teacher'
    });
    assert(r.ok, 'ok');
    assert(r.charge, 'charge created');
    eq(r.charge.reason, 'lesson_done');

    const after = Store.state.packages.find(p => p.id === 'pk-1').remaining;
    eq(after, before - 1, 'remaining decremented');
    assert(/Урок списан/.test(r.charge.reasonText), 'reasonText human');
    assert(/занятие проведено/.test(r.charge.reasonText), 'reasonText explains why');
  }]);

  cases.push(['cancelled родителем за >=8h → НЕ списывается', () => {
    const { lesson, student } = makeIndividualLesson({
      subjectId: 'math',
      startAt: new Date(Date.now() + 24 * HOUR_MS).toISOString()
    });
    const before = Store.state.packages.find(p => p.id === 'pk-1').remaining;

    const r = window.XBilling.applyLessonStatus(lesson.id, {
      studentId: student.id, status: 'cancelled', actor: 'parent',
      noticeAt: new Date().toISOString()  // отмена сейчас, до старта 24h
    });
    assert(r.ok, 'ok');
    assert(r.charge === null, 'no charge for in-time cancel');

    const after = Store.state.packages.find(p => p.id === 'pk-1').remaining;
    eq(after, before, 'remaining unchanged');
  }]);

  cases.push(['cancelled родителем за <8h → списывается как missed_late', () => {
    const start = new Date(Date.now() + 4 * HOUR_MS); // через 4 часа
    const { lesson, student } = makeIndividualLesson({
      subjectId: 'math', startAt: start.toISOString()
    });
    const before = Store.state.packages.find(p => p.id === 'pk-1').remaining;

    const r = window.XBilling.applyLessonStatus(lesson.id, {
      studentId: student.id, status: 'cancelled', actor: 'parent',
      noticeAt: new Date().toISOString()
    });
    assert(r.ok, 'ok');
    assert(r.charge, 'charge expected');
    eq(r.charge.reason, 'lesson_missed_late');
    assert(/Урок списан/.test(r.charge.reasonText), 'reasonText starts with «Урок списан»');
    assert(/отмена не была сделана минимум за 8 часов/.test(r.charge.reasonText),
      'reasonText упоминает правило отмены за 8 часов');

    const after = Store.state.packages.find(p => p.id === 'pk-1').remaining;
    eq(after, before - 1, 'remaining decremented');
  }]);

  cases.push(['cancelled преподавателем за 1ч → НЕ списывается', () => {
    const start = new Date(Date.now() + 1 * HOUR_MS);
    const { lesson, student } = makeIndividualLesson({
      subjectId: 'math', startAt: start.toISOString()
    });
    const before = Store.state.packages.find(p => p.id === 'pk-1').remaining;

    const r = window.XBilling.applyLessonStatus(lesson.id, {
      studentId: student.id, status: 'cancelled', actor: 'teacher',
      noticeAt: new Date().toISOString()
    });
    assert(r.ok, 'ok');
    assert(r.charge === null, 'no charge for teacher cancel');
    eq(Store.state.packages.find(p => p.id === 'pk-1').remaining, before);
  }]);

  cases.push(['cancelled школой за 1ч → НЕ списывается', () => {
    const start = new Date(Date.now() + 1 * HOUR_MS);
    const { lesson, student } = makeIndividualLesson({
      subjectId: 'math', startAt: start.toISOString()
    });
    const before = Store.state.packages.find(p => p.id === 'pk-1').remaining;

    const r = window.XBilling.applyLessonStatus(lesson.id, {
      studentId: student.id, status: 'cancelled', actor: 'school',
      noticeAt: new Date().toISOString()
    });
    assert(r.ok, 'ok');
    assert(r.charge === null);
    eq(Store.state.packages.find(p => p.id === 'pk-1').remaining, before);
  }]);

  cases.push(['missed без отмены → списывается как missed_late', () => {
    const past = new Date(Date.now() - 1 * HOUR_MS);
    const { lesson, student } = makeIndividualLesson({
      subjectId: 'math', startAt: past.toISOString()
    });
    const before = Store.state.packages.find(p => p.id === 'pk-1').remaining;

    const r = window.XBilling.applyLessonStatus(lesson.id, {
      studentId: student.id, status: 'missed', actor: 'teacher'
    });
    assert(r.ok, 'ok');
    assert(r.charge, 'charge expected');
    eq(r.charge.reason, 'lesson_missed_late');
    eq(Store.state.packages.find(p => p.id === 'pk-1').remaining, before - 1);
  }]);

  cases.push(['групповой: один done, второй cancel за 24h, третий missed без отмены', () => {
    // готовим групповой урок руками с полным набором участников
    const teacher = Store.state.users.find(u => u.role === 'teacher');
    const start = new Date(Date.now() + 24 * HOUR_MS);
    const lesson = Store.addLesson({
      subjectId: 'it', teacherId: teacher.id, type: 'group',
      startAt: start.toISOString(),
      participants: [
        { studentId: 'u-student-2', status: 'planned' },
        { studentId: 'u-student-3', status: 'planned' },
        { studentId: 'u-student-4', status: 'planned' }
      ]
    });

    // Один пришёл
    const r1 = window.XBilling.applyLessonStatus(lesson.id, {
      studentId: 'u-student-2', status: 'done', actor: 'teacher'
    });
    assert(r1.ok && r1.charge && r1.charge.reason === 'lesson_done');

    // Второй отменил за 24ч
    const r2 = window.XBilling.applyLessonStatus(lesson.id, {
      studentId: 'u-student-3', status: 'cancelled', actor: 'parent',
      noticeAt: new Date().toISOString()
    });
    assert(r2.ok && r2.charge === null, 'no charge for in-time cancel');

    // Третий missed без отмены
    const r3 = window.XBilling.applyLessonStatus(lesson.id, {
      studentId: 'u-student-4', status: 'missed', actor: 'teacher'
    });
    assert(r3.ok && r3.charge && r3.charge.reason === 'lesson_missed_late');

    // У ученика-2 должен быть один charge, у ученика-3 — ноль, у ученика-4 — один
    const charges = Store.state.charges.filter(c => c.lessonId === lesson.id);
    eq(charges.length, 2, 'two charges total');
    eq(charges.find(c => c.studentId === 'u-student-2').reason, 'lesson_done');
    eq(charges.find(c => c.studentId === 'u-student-4').reason, 'lesson_missed_late');
  }]);

  cases.push(['дедуп: повторный applyLessonStatus → already_charged', () => {
    const { lesson, student } = makeIndividualLesson({ subjectId: 'math' });
    const r1 = window.XBilling.applyLessonStatus(lesson.id, {
      studentId: student.id, status: 'done', actor: 'teacher'
    });
    assert(r1.ok && r1.charge);

    const r2 = window.XBilling.applyLessonStatus(lesson.id, {
      studentId: student.id, status: 'done', actor: 'teacher'
    });
    assert(!r2.ok && r2.error === 'already_charged');
  }]);

  cases.push(['пакет с remaining=0 → outOfPackage charge', () => {
    // обнулим pk-1
    Store.updatePackage('pk-1', { used: 10 });
    const { lesson, student } = makeIndividualLesson({ subjectId: 'math' });

    const r = window.XBilling.applyLessonStatus(lesson.id, {
      studentId: student.id, status: 'done', actor: 'teacher'
    });
    assert(r.ok && r.charge);
    assert(r.charge.outOfPackage === true, 'outOfPackage flag');
    eq(r.charge.packageId, null);
  }]);

  /* ── Раннер ──────────────────────────────────────────────── */
  function run() {
    const results = [];
    for (const [name, fn] of cases) {
      try {
        withSandbox(fn);
        results.push({ name, ok: true });
        console.log('%cPASS', 'color:#10b981;font-weight:700', name);
      } catch (e) {
        results.push({ name, ok: false, error: e.message });
        console.error('%cFAIL', 'color:#ef4444;font-weight:700', name, '\n  ' + e.message);
      }
    }
    const passed = results.filter(r => r.ok).length;
    console.log(`%c${passed}/${results.length} passed`,
      passed === results.length ? 'color:#10b981;font-weight:700' : 'color:#fbbf24;font-weight:700');
    return results;
  }

  window.XBillingTests = { run, cases };
})();
