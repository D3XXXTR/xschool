/* ══════════════════════════════════════════════════════════
   Школа ИКС — BILLING
   Реализация правил из docs/06_BILLING.md (источник истины).
   Главная функция: applyLessonStatus(lessonId, payload).
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  if (!window.XSchool) {
    console.error('[xschool/billing] store.js не загружен'); return;
  }
  const Store = window.XSchool;

  const HOURS_8_MS = 8 * 60 * 60 * 1000;

  /* ── Внутренние утилиты ────────────────────────────────── */

  function ms(iso) { return iso ? new Date(iso).getTime() : 0; }

  function shortName(u) {
    if (!u) return '';
    const parts = u.name.split(' ');
    return parts.length > 1
      ? parts[0] + ' ' + parts[1].charAt(0) + '.'
      : u.name;
  }

  function reasonTextFor(lesson, participant, reason, state) {
    const subj = state.subjects.find(s => s.id === lesson.subjectId);
    const teacher = state.users.find(u => u.id === lesson.teacherId);
    const start = new Date(lesson.startAt);
    const dateLabel = start.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
    const time      = start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const subjTitle = subj ? subj.title : lesson.subjectId;

    // Формат причины — максимально понятный для родителя.
    // Формулировка lesson_missed_late юридически и UX-точная:
    // правило касается именно отмены, сделанной заранее, а не «предупреждения».
    if (reason === 'lesson_done') {
      return `Урок списан: занятие проведено ${dateLabel}, ${time} — ${subjTitle}` +
             (teacher ? `, преподаватель ${shortName(teacher)}` : '') + '.';
    }
    if (reason === 'lesson_missed_late') {
      return `Урок списан: ученик не пришёл и отмена не была сделана минимум за 8 часов до начала занятия. (${dateLabel}, ${time}, ${subjTitle})`;
    }
    return '';
  }

  /**
   * Возвращает причину списания для участника или null, если списания нет.
   * Полностью соответствует §3.1–§3.3 и §7 из docs/06_BILLING.md.
   */
  function decideReason(lesson, participant) {
    const start = ms(lesson.startAt);

    if (participant.status === 'cancelled') {
      const by = participant.cancelledBy;
      if (by === 'teacher' || by === 'school') return null;
      const cancelAt = ms(participant.cancelledAt);
      const inTime = cancelAt > 0 && (start - cancelAt) >= HOURS_8_MS;
      return inTime ? null : 'lesson_missed_late';
    }
    if (participant.status === 'done') return 'lesson_done';
    if (participant.status === 'missed') {
      const cancelAt = ms(participant.cancelledAt);
      const inTime = cancelAt > 0 && (start - cancelAt) >= HOURS_8_MS;
      return inTime ? null : 'lesson_missed_late';
    }
    return null;
  }

  /**
   * Агрегирует статус всего урока из участников.
   * Если все финальны и есть хоть один done → done.
   * Иначе — missed (если все финальны без done) или сохраняется текущий.
   */
  function computeLessonStatus(lesson) {
    if (lesson.type === 'individual') {
      return (lesson.participants[0] && lesson.participants[0].status) || lesson.status || 'planned';
    }
    const statuses = lesson.participants.map(p => p.status);
    const final = ['done', 'missed', 'cancelled'];
    if (statuses.every(s => s === 'cancelled')) return 'cancelled';
    if (statuses.every(s => final.includes(s))) {
      return statuses.includes('done') ? 'done' : 'missed';
    }
    return lesson.status || 'planned';
  }

  /**
   * Главная функция этапа 5.
   *
   * applyLessonStatus(lessonId, payload)
   *   payload:
   *     studentId  — кого касается изменение (для group). Для individual может опускаться.
   *     status     — 'done' | 'missed' | 'cancelled' | 'planned' | 'tomorrow'
   *     actor      — 'parent' | 'student' | 'teacher' | 'school'
   *     noticeAt   — ISO момент уведомления об отмене (или missed-предупреждения)
   *     reason     — опционально, человекочитаемое (если хотим переопределить)
   *     comment    — опционально
   *
   * Возвращает:
   *   { ok: true, charge | null, lesson, participant, billingReason }
   *   { ok: false, error: '...' }
   */
  function applyLessonStatus(lessonId, payload) {
    payload = payload || {};
    const state = Store.state;

    const lesson = state.lessons.find(l => l.id === lessonId);
    if (!lesson) return { ok: false, error: 'lesson_not_found' };

    const studentId = payload.studentId
      || (lesson.participants[0] && lesson.participants[0].studentId);
    if (!studentId) return { ok: false, error: 'student_required' };

    const participant = lesson.participants.find(p => p.studentId === studentId);
    if (!participant) return { ok: false, error: 'participant_not_found' };

    // Дедуп: один и тот же (lessonId, studentId) не списываем дважды
    const existing = state.charges.find(c => c.lessonId === lessonId && c.studentId === studentId);
    if (existing) {
      // Можно обновить статус без повторного списания, но не плодить duplicate charge
      return { ok: false, error: 'already_charged', charge: existing };
    }

    // Применяем изменения к участнику
    const newStatus = payload.status;
    if (newStatus) participant.status = newStatus;

    if (newStatus === 'cancelled') {
      participant.cancelledAt = payload.noticeAt || Store.nowIso();
      participant.cancelledBy = payload.actor   || 'parent';
    } else if (newStatus === 'missed' && payload.noticeAt) {
      participant.cancelledAt = payload.noticeAt;
      participant.cancelledBy = payload.actor || 'parent';
    }

    // Решение о списании
    const billingReason = decideReason(lesson, participant);
    let charge = null;

    if (billingReason) {
      // Найти подходящий пакет (тот же ученик и предмет, с остатком).
      // Если такого нет — создаём «вне пакета».
      const pkg = state.packages
        .filter(p => p.studentId === studentId && p.subjectId === lesson.subjectId)
        .sort((a, b) => (b.remaining > 0 ? 1 : 0) - (a.remaining > 0 ? 1 : 0))[0] || null;

      const hasRoom = !!pkg && pkg.remaining > 0;
      charge = {
        id: Store.genId('c'),
        lessonId,
        packageId: hasRoom ? pkg.id : null,
        outOfPackage: !hasRoom,
        studentId,
        amount: 1,
        reason: billingReason,
        reasonText: payload.reason || reasonTextFor(lesson, participant, billingReason, state),
        comment: payload.comment || '',
        createdAt: Store.nowIso()
      };
      state.charges.push(charge);

      if (hasRoom) {
        pkg.used      = (pkg.used || 0) + 1;
        pkg.remaining = pkg.total - pkg.used;
        pkg.updatedAt = Store.nowIso();
      }
      // Уведомления удалены из MVP — родителю достаточно информации в
      // истории списаний и баннеров «Низкий остаток / Пакет закончился»
      // на главной (баннеры считаются на лету по packages.remaining).
    }

    // Агрегированный статус урока
    lesson.status = computeLessonStatus(lesson);
    lesson.updatedAt = Store.nowIso();

    Store.state = state;
    return { ok: true, charge, lesson, participant, billingReason };
  }

  /* ── Экспорт ───────────────────────────────────────────── */
  window.XBilling = {
    applyLessonStatus,
    decideReason,
    computeLessonStatus,
    HOURS_8_MS
  };
})();
