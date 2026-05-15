/* ══════════════════════════════════════════════════════════
   Школа ИКС — HOMEWORK TESTS
   Запуск: XHomeworkTests.run() или через tests.html.
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  if (!window.XSchool || !window.XHomework) {
    console.error('[xschool/homework.test] требуются store.js и homework.js'); return;
  }

  const Store = window.XSchool;

  function withSandbox(fn) {
    const backup = JSON.stringify(Store.state);
    Store.reset();
    try { return fn(); }
    finally { localStorage.setItem('xschool', backup); }
  }
  function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
  function eq(a, b, msg) { if (a !== b) throw new Error((msg || 'eq') + ': ' + a + ' !== ' + b); }

  function newHw(status) {
    return Store.addHomework({
      lessonId: 'l-1',
      studentId: 'u-student-1',
      teacherId: 'u-teacher-2',
      subjectId: 'english',
      title: 'Test HW',
      description: 'desc',
      deadline: new Date(Date.now() + 86400000).toISOString(),
      status: status || 'assigned'
    });
  }

  const cases = [];

  cases.push(['assigned → in_progress: ok', () => {
    const hw = newHw('assigned');
    const r = window.XHomework.transitionHomework(hw.id, 'in_progress');
    assert(r.ok && r.homework.status === 'in_progress');
  }]);

  cases.push(['assigned → submitted: ok (студент сразу сдал)', () => {
    const hw = newHw('assigned');
    const r = window.XHomework.transitionHomework(hw.id, 'submitted', {
      studentAnswer: 'мой ответ'
    });
    assert(r.ok);
    eq(r.homework.studentAnswer, 'мой ответ');
    eq(r.homework.status, 'submitted');
    assert(r.homework.submittedAt, 'submittedAt set');
  }]);

  cases.push(['assigned → checked: НЕЛЬЗЯ', () => {
    const hw = newHw('assigned');
    const r = window.XHomework.transitionHomework(hw.id, 'checked');
    assert(!r.ok);
    eq(r.error, 'invalid_transition');
  }]);

  cases.push(['submitted → checked: ok, поля сохранены', () => {
    const hw = newHw('submitted');
    const r = window.XHomework.transitionHomework(hw.id, 'checked', {
      teacherComment: 'Молодец', score: 5
    });
    assert(r.ok);
    eq(r.homework.status, 'checked');
    eq(r.homework.score, 5);
    eq(r.homework.teacherComment, 'Молодец');
    assert(r.homework.checkedAt, 'checkedAt set');
  }]);

  cases.push(['submitted → needs_revision: ok', () => {
    const hw = newHw('submitted');
    const r = window.XHomework.transitionHomework(hw.id, 'needs_revision', {
      teacherComment: 'переделай №3'
    });
    assert(r.ok);
    eq(r.homework.status, 'needs_revision');
  }]);

  cases.push(['needs_revision → in_progress: ok', () => {
    const hw = newHw('needs_revision');
    const r = window.XHomework.transitionHomework(hw.id, 'in_progress');
    assert(r.ok);
  }]);

  cases.push(['checked → anything: НЕЛЬЗЯ', () => {
    const hw = newHw('checked');
    for (const next of ['assigned','in_progress','submitted','needs_revision']) {
      const r = window.XHomework.transitionHomework(hw.id, next);
      assert(!r.ok, 'should reject ' + next);
    }
  }]);

  cases.push(['валидация файлов: лимит 5', () => {
    const hw = newHw('assigned');
    const files = Array.from({ length: 6 }, (_, i) => ({ name: `f${i}.jpg`, type: 'image/jpeg', size: 1000 }));
    const r = window.XHomework.transitionHomework(hw.id, 'submitted', { files });
    assert(!r.ok && r.error === 'too_many_files');
  }]);

  cases.push(['валидация файлов: тип', () => {
    const hw = newHw('assigned');
    const files = [{ name: 'x.exe', type: 'application/octet-stream', size: 100 }];
    const r = window.XHomework.transitionHomework(hw.id, 'submitted', { files });
    assert(!r.ok && r.error === 'invalid_file_type');
  }]);

  cases.push(['валидация файлов: 11 МБ — отказ', () => {
    const hw = newHw('assigned');
    const files = [{ name: 'big.pdf', type: 'application/pdf', size: 11 * 1024 * 1024 }];
    const r = window.XHomework.transitionHomework(hw.id, 'submitted', { files });
    assert(!r.ok && r.error === 'file_too_large');
  }]);

  cases.push(['валидация оценки: 0 — отказ, 5 — ok', () => {
    const hw1 = newHw('submitted');
    const r1 = window.XHomework.transitionHomework(hw1.id, 'checked', { score: 0 });
    assert(!r1.ok && r1.error === 'invalid_score');

    const hw2 = newHw('submitted');
    const r2 = window.XHomework.transitionHomework(hw2.id, 'checked', { score: 5 });
    assert(r2.ok);
  }]);

  /* ─── Этап 10: новые сценарии ───────────────────────── */

  cases.push(['submittedAt фиксируется при переходе в submitted', () => {
    const hw = newHw('in_progress');
    const before = Date.now();
    const r = window.XHomework.transitionHomework(hw.id, 'submitted', { studentAnswer: 'x' });
    assert(r.ok);
    assert(r.homework.submittedAt, 'submittedAt должно быть');
    const ts = new Date(r.homework.submittedAt).getTime();
    assert(ts >= before - 2000 && ts <= Date.now() + 2000, 'submittedAt близко к now');
  }]);

  cases.push(['default title: пустой title → «Домашнее задание»', () => {
    const hw = Store.addHomework({
      studentId: 'u-student-1',
      teacherId: 'u-teacher-1',
      subjectId: 'math'
      // title намеренно отсутствует
    });
    eq(hw.title, 'Домашнее задание');
  }]);

  cases.push(['пустая строка title → «Домашнее задание»', () => {
    const hw = Store.addHomework({
      studentId: 'u-student-1', teacherId: 'u-teacher-1', subjectId: 'math',
      title: '   '
    });
    eq(hw.title, 'Домашнее задание');
  }]);

  cases.push(['openHomework: assigned → in_progress автоматически', () => {
    const hw = newHw('assigned');
    const r = window.XHomework.openHomework(hw.id);
    assert(r);
    eq(r.status, 'in_progress');
  }]);

  cases.push(['openHomework: submitted остаётся submitted', () => {
    const hw = newHw('submitted');
    const r = window.XHomework.openHomework(hw.id);
    eq(r.status, 'submitted');
  }]);

  cases.push(['openHomework: checked остаётся checked', () => {
    // нельзя сразу assigned → checked, поэтому идём через submitted
    const hw = newHw('submitted');
    window.XHomework.transitionHomework(hw.id, 'checked', { teacherComment: 'ok' });
    const r = window.XHomework.openHomework(hw.id);
    eq(r.status, 'checked');
  }]);

  cases.push(['files: сохраняются именно как plain-объекты', () => {
    const hw = newHw('in_progress');
    const r = window.XHomework.transitionHomework(hw.id, 'submitted', {
      studentAnswer: 'a',
      files: [
        { name: 'one.pdf', size: 12345, type: 'application/pdf' },
        { name: 'two.png', size: 99,    type: 'image/png' }
      ]
    });
    assert(r.ok);
    eq(r.homework.files.length, 2);
    eq(r.homework.files[0].name, 'one.pdf');
    eq(r.homework.files[0].size, 12345);
    eq(r.homework.files[0].type, 'application/pdf');
    eq(r.homework.files[1].name, 'two.png');
    // дополнительно — не должны утечь лишние поля
    const keys = Object.keys(r.homework.files[0]).sort();
    assert(JSON.stringify(keys) === JSON.stringify(['name','size','type']),
      'у файла только name/size/type');
  }]);

  cases.push(['files: после reload (через subscribe-цикл) — те же значения', () => {
    const hw = newHw('in_progress');
    window.XHomework.transitionHomework(hw.id, 'submitted', {
      studentAnswer: 'a',
      files: [{ name: 'x.pdf', size: 123, type: 'application/pdf' }]
    });
    // эмулируем перезагрузку: читаем из стора заново
    const fresh = Store.getHomework(hw.id);
    eq(fresh.files.length, 1);
    eq(fresh.files[0].name, 'x.pdf');
    eq(fresh.files[0].size, 123);
  }]);

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

  window.XHomeworkTests = { run, cases };
})();
