/* ══════════════════════════════════════════════════════════
   Школа ИКС — HOMEWORK
   Жизненный цикл ДЗ и валидация переходов статусов.
   Опирается на docs/05_FEATURES.md (M7) и 01_PRODUCT_ARCHITECTURE.md.
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  if (!window.XSchool) {
    console.error('[xschool/homework] store.js не загружен'); return;
  }
  const Store = window.XSchool;

  const STATUSES = ['assigned', 'in_progress', 'submitted', 'checked', 'needs_revision'];

  /**
   * Допустимые переходы.
   * checked — финальный, дальше нет переходов.
   */
  const TRANSITIONS = {
    assigned:       ['in_progress', 'submitted'],
    in_progress:    ['submitted'],
    submitted:      ['checked', 'needs_revision'],
    needs_revision: ['in_progress', 'submitted'],
    checked:        []
  };

  function canTransition(from, to) {
    return (TRANSITIONS[from] || []).includes(to);
  }

  /**
   * transitionHomework(hwId, nextStatus, payload)
   *
   *   payload (опционально):
   *     studentAnswer  — текст ответа ученика
   *     files          — массив {name, size, type} (метаданные, до 5, jpg/png/pdf, 10МБ/50МБ)
   *     teacherComment — комментарий преподавателя
   *     score          — оценка (число 1..5 для MVP)
   *
   * Возвращает:
   *   { ok: true, homework, notifications }
   *   { ok: false, error }
   */
  function transitionHomework(hwId, nextStatus, payload) {
    payload = payload || {};
    const state = Store.state;

    const hw = state.homeworks.find(h => h.id === hwId);
    if (!hw) return { ok: false, error: 'homework_not_found' };
    if (!STATUSES.includes(nextStatus)) {
      return { ok: false, error: 'invalid_status', status: nextStatus };
    }
    if (!canTransition(hw.status, nextStatus)) {
      return { ok: false, error: 'invalid_transition', from: hw.status, to: nextStatus };
    }

    // Валидация файлов (если переданы): jpg/png/pdf, до 5, ≤10МБ/файл, ≤50МБ суммарно
    if (Array.isArray(payload.files)) {
      const fileCheck = validateFiles(payload.files);
      if (!fileCheck.ok) return fileCheck;
    }

    // Валидация оценки
    if (payload.score !== undefined && payload.score !== null) {
      const s = Number(payload.score);
      if (Number.isNaN(s) || s < 1 || s > 5) {
        return { ok: false, error: 'invalid_score' };
      }
    }

    // Применяем. ВАЖНО: payload.files может прилететь как Alpine reactive Proxy —
    // отсоединяем в чистый массив plain-объектов, иначе после JSON.stringify/parse
    // в localStorage возможны нестабильные перезаписи.
    const prev = hw.status;
    hw.status = nextStatus;
    if (payload.studentAnswer !== undefined) {
      hw.studentAnswer = String(payload.studentAnswer || '');
    }
    if (payload.files !== undefined) {
      hw.files = (Array.isArray(payload.files) ? payload.files : []).map(f => ({
        name: String(f && f.name || ''),
        size: Number(f && f.size || 0),
        type: String(f && f.type || '')
      }));
    }
    if (payload.teacherComment !== undefined) hw.teacherComment = String(payload.teacherComment || '');
    if (payload.score          !== undefined) hw.score = payload.score;
    if (nextStatus === 'submitted')           hw.submittedAt = Store.nowIso();
    if (nextStatus === 'checked')             hw.checkedAt   = Store.nowIso();
    hw.updatedAt = Store.nowIso();

    // Уведомления удалены из MVP. Сигналы видны в самих списках:
    //   • статус ДЗ в инбоксе ученика и родителя;
    //   • счётчик «К проверке» в sidebar преподавателя.
    Store.state = state;
    return { ok: true, homework: hw };
  }

  function validateFiles(files) {
    if (files.length > 5) return { ok: false, error: 'too_many_files', limit: 5 };
    const ok = ['image/jpeg', 'image/png', 'application/pdf'];
    let total = 0;
    for (const f of files) {
      if (f.type && !ok.includes(f.type) && !/\.(jpg|jpeg|png|pdf)$/i.test(f.name || '')) {
        return { ok: false, error: 'invalid_file_type', file: f.name };
      }
      const size = f.size || 0;
      if (size > 10 * 1024 * 1024) {
        return { ok: false, error: 'file_too_large', file: f.name, limit: 10 };
      }
      total += size;
    }
    if (total > 50 * 1024 * 1024) {
      return { ok: false, error: 'total_too_large', limit: 50 };
    }
    return { ok: true };
  }

  /**
   * Хелпер «открыть ДЗ ученику»: при первом открытии переводит
   * `assigned → in_progress`. Любой другой статус — оставляет как есть.
   * Возвращает свежий hw (или null, если не найден).
   */
  function openHomework(hwId) {
    const hw = Store.getHomework(hwId);
    if (!hw) return null;
    if (hw.status === 'assigned') {
      const r = transitionHomework(hwId, 'in_progress');
      if (r.ok) return r.homework;
    }
    return hw;
  }

  window.XHomework = {
    STATUSES,
    TRANSITIONS,
    canTransition,
    transitionHomework,
    openHomework,
    validateFiles
  };
})();
