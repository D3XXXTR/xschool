/* ══════════════════════════════════════════════════════════
   Школа ИКС — APP HELPERS
   Форматирование, склонения, классы прогресс-баров,
   ярлыки статусов уроков и ДЗ.
   Используется во всех ЛК.
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Форматирование ────────────────────────────────────── */
  const fmt = {
    date(iso) {
      if (!iso) return '';
      try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
      } catch (e) { return ''; }
    },
    dateLong(iso) {
      if (!iso) return '';
      try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
      } catch (e) { return ''; }
    },
    time(iso) {
      if (!iso) return '';
      try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      } catch (e) { return ''; }
    },
    money(n) {
      try { return new Intl.NumberFormat('ru-RU').format(n) + ' ₽'; }
      catch (e) { return n + ' ₽'; }
    },
    /** Склонение русского слова: plural(5, ['урок','урока','уроков']) */
    plural(n, forms) {
      const a = Math.abs(n) % 100;
      const b = a % 10;
      if (a > 10 && a < 20) return forms[2];
      if (b > 1 && b < 5)   return forms[1];
      if (b === 1)          return forms[0];
      return forms[2];
    }
  };

  /* ── Прогресс-бары пакетов (см. 06_BILLING.md §10) ─────── */
  function progressClass(used, total) {
    if (!total) return 'progress';
    const remaining = total - used;
    const ratio = remaining / total;
    if (remaining <= 2) return 'progress danger';
    if (ratio <= 0.3)   return 'progress warn';
    return 'progress';
  }
  function progressPct(used, total) {
    if (!total) return 0;
    return Math.min(100, Math.max(0, Math.round((used / total) * 100)));
  }

  /* ── Ярлыки статусов уроков ────────────────────────────── */
  const lessonStatus = {
    planned:   { label: 'Запланирован',  badge: '',        icon: '⚪' },
    tomorrow:  { label: 'Завтра',         badge: 'blue',    icon: '🔵' },
    done:      { label: 'Проведён',       badge: 'green',   icon: '✓'  },
    missed:    { label: 'Пропуск',        badge: 'yellow',  icon: '⚠'  },
    cancelled: { label: 'Отменён',        badge: 'red',     icon: '✕'  }
  };

  /* ── Ярлыки ДЗ ─────────────────────────────────────────── */
  const homeworkStatus = {
    assigned:     { label: 'Задано',         badge: 'violet' },
    in_progress:  { label: 'В работе',       badge: 'yellow' },
    submitted:    { label: 'На проверке',    badge: 'blue'   },
    checked:      { label: 'Проверено',      badge: 'green'  },
    needs_revision: { label: 'Нужно доработать', badge: 'red'  }
  };

  /* ── Дедлайн отмены без списания (8h) ─────────────────── */
  function cancelDeadline(startAtIso) {
    try {
      const d = new Date(startAtIso);
      d.setHours(d.getHours() - 8);
      return d;
    } catch (e) { return null; }
  }

  /* ── Лейбл дедлайна для ДЗ ─────────────────────────────
     Возвращает { text, className } для использования в badge.
       null/невалид  → 'без дедлайна'  (no class)
       прошло        → 'просрочено · DD MMM' (red)
       сегодня       → 'сегодня, HH:MM' (yellow)
       завтра        → 'завтра, HH:MM' (blue)
       через 2..7    → 'через N дн.'    (no class)
       дальше        → 'до DD MMM'      (no class)                 */
  function deadlineLabel(iso) {
    if (!iso) return { text: 'без дедлайна', className: '' };
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { text: 'без дедлайна', className: '' };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dlDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((dlDay - today) / 86400000);
    const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const shortDate = d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });

    if (d.getTime() < now.getTime()) {
      return { text: 'просрочено · ' + shortDate, className: 'red' };
    }
    if (diffDays === 0) return { text: 'сегодня, ' + time, className: 'yellow' };
    if (diffDays === 1) return { text: 'завтра, ' + time, className: 'blue' };
    if (diffDays >= 2 && diffDays <= 7) {
      return {
        text: 'через ' + diffDays + ' ' + fmt.plural(diffDays, ['день','дня','дней']),
        className: ''
      };
    }
    return { text: 'до ' + shortDate, className: '' };
  }

  /* ── Иконка для файла (по type/имени) ──────────────────── */
  function fileIcon(typeOrFile, maybeName) {
    let t = '', n = '';
    if (typeOrFile && typeof typeOrFile === 'object') {
      t = String(typeOrFile.type || '');
      n = String(typeOrFile.name || '');
    } else {
      t = String(typeOrFile || '');
      n = String(maybeName || '');
    }
    t = t.toLowerCase(); n = n.toLowerCase();
    if (t.startsWith('image/') || /\.(jpe?g|png|gif|webp)$/.test(n)) return '🖼️';
    if (t === 'application/pdf' || /\.pdf$/.test(n)) return '📄';
    return '📎';
  }

  /* ── Toast (минимальный) ──────────────────────────────── */
  function toast(message, ms = 2400) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), ms);
  }

  /* ── Lifecycle ────────────────────────────────────────── */
  function bootGuard(role) {
    // вызов из inline-скрипта страницы ЛК
    if (!window.XAuth) return null;
    return window.XAuth.requireSession(role);
  }

  /* ── Хеш-роутинг ──────────────────────────────────────── */
  function parseHashView(valid, defaultView) {
    const h = (location.hash || '').replace(/^#/, '').trim();
    return valid.includes(h) ? h : defaultView;
  }
  /**
   * watchHash(view => { ... })
   * подписывает обработчик на hashchange и сразу вызывает один раз.
   * Возвращает функцию-отписку.
   */
  function watchHash(handler) {
    const fn = () => handler(location.hash.replace(/^#/, ''));
    fn();
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }

  /* ── Hydrators (присоединяют связные сущности к карточкам) ─
     viewerStudentIds: id «своих» учеников зрителя.
       • если задан → имена «чужих» участников НЕ попадают в _ownParticipants;
         их количество отдаётся отдельно в _otherParticipantsCount.
       • в _participants остаются ВСЕ — это бизнес-данные, нужны для CRM. */
  function hydrateLesson(lesson, store, viewerStudentIds) {
    if (!lesson) return null;
    const subj = store.getSubject(lesson.subjectId);
    const teacher = store.getUser(lesson.teacherId);
    const all = (lesson.participants || []).map(p => {
      const u = store.getUser(p.studentId);
      return { ...p, _name: u ? u.name : p.studentId };
    });
    let own = all, others = 0;
    if (Array.isArray(viewerStudentIds)) {
      const vset = new Set(viewerStudentIds);
      own    = all.filter(p => vset.has(p.studentId));
      others = all.length - own.length;
    }
    // «Завтра» — производное от startAt, не хранится в данных
    const isTomorrow = isLessonTomorrow(lesson.startAt);
    // Если урок запланирован (или имеет старый статус 'tomorrow') и реально
    // приходится на завтра — показываем синий бейдж «Завтра».
    let statusInfo = lessonStatus[lesson.status] || lessonStatus.planned;
    if (isTomorrow && (lesson.status === 'planned' || lesson.status === 'tomorrow')) {
      statusInfo = lessonStatus.tomorrow;
    }
    return {
      ...lesson,
      _subjectTitle: subj ? subj.title : '',
      _teacherName:  teacher ? teacher.name : '',
      _date:         fmt.dateLong(lesson.startAt),
      _time:         fmt.time(lesson.startAt),
      _statusInfo:   statusInfo,
      _isTomorrow:   isTomorrow,
      _participants: all,         // ВСЕ — для CRM
      _ownParticipants: own,      // только свои — для родителя/ученика
      _otherParticipantsCount: others,
      _cancelDeadline: cancelDeadline(lesson.startAt)
    };
  }
  /** Урок «завтра», если startAt попадает в диапазон [start_of_tomorrow, end_of_tomorrow]. */
  function isLessonTomorrow(iso) {
    if (!iso) return false;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const endOfTomorrow   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);
    const t = d.getTime();
    return t >= startOfTomorrow.getTime() && t <= endOfTomorrow.getTime();
  }
  /** утилита-обёртка: фильтрует уже гидрированный урок под другого зрителя */
  function visibleParticipants(lesson, viewerStudentIds) {
    const all = lesson._participants || lesson.participants || [];
    const set = new Set(viewerStudentIds || []);
    const own = all.filter(p => set.has(p.studentId));
    return { own, others: all.length - own.length };
  }
  function hydratePackage(pkg, store) {
    if (!pkg) return null;
    const subj = store.getSubject(pkg.subjectId);
    const stu  = store.getUser(pkg.studentId);
    return {
      ...pkg,
      _subjectTitle: subj ? subj.title : '',
      _studentName:  stu ? stu.name : '',
      _progressClass: progressClass(pkg.used, pkg.total),
      _progressPct:   progressPct(pkg.used, pkg.total)
    };
  }
  function hydrateHomework(hw, store) {
    if (!hw) return null;
    const subj = store.getSubject(hw.subjectId);
    const stu  = store.getUser(hw.studentId);
    const t    = store.getUser(hw.teacherId);
    let deadlineText = 'без дедлайна';
    if (hw.deadline) {
      const d = fmt.dateLong(hw.deadline);
      const t2 = fmt.time(hw.deadline);
      deadlineText = (d && t2) ? (d + ' · ' + t2) : (d || t2 || 'без дедлайна');
    }
    return {
      ...hw,
      _subjectTitle: subj ? subj.title : '',
      _studentName:  stu ? stu.name : '',
      _teacherName:  t ? t.name : '',
      _deadline:     deadlineText,
      _deadlineInfo: deadlineLabel(hw.deadline),
      _statusInfo:   homeworkStatus[hw.status] || homeworkStatus.assigned
    };
  }
  function hydratePayment(p, store) {
    if (!p) return null;
    const pkg  = p.packageId ? store.getPackage(p.packageId) : null;
    // Если самого пакета ещё нет (pending), используем packageDraft для отображения
    const draft = p.packageDraft || null;
    const subjId = pkg ? pkg.subjectId : (draft ? draft.subjectId : null);
    const stuId  = pkg ? pkg.studentId : (draft ? draft.studentId : null);
    const subj   = subjId ? store.getSubject(subjId) : null;
    const stu    = stuId  ? store.getUser(stuId)    : null;

    // Просрочено: pending + dueAt в прошлом
    const now = Date.now();
    const dueMs = p.dueAt ? new Date(p.dueAt).getTime() : 0;
    const isOverdue = p.status === 'pending' && dueMs > 0 && dueMs < now;

    let label, badge;
    if (isOverdue)                      { label = 'Просрочено'; badge = 'red'; }
    else if (p.status === 'paid')       { label = 'Оплачено';   badge = 'green'; }
    else if (p.status === 'pending')    { label = 'Ожидает';    badge = 'yellow'; }
    else if (p.status === 'cancelled')  { label = 'Отменено';   badge = ''; }
    else if (p.status === 'failed')     { label = 'Ошибка';     badge = 'red'; }
    else                                { label = p.status;     badge = ''; }

    let daysOverdue = 0;
    if (isOverdue) daysOverdue = Math.floor((now - dueMs) / 86400000);

    return {
      ...p,
      _date:         fmt.dateLong(p.createdAt) + ' · ' + fmt.time(p.createdAt),
      _dueDate:      p.dueAt ? fmt.dateLong(p.dueAt) : '',
      _subjectTitle: subj ? subj.title : '',
      _studentName:  stu  ? stu.name   : '',
      _lessonType:   pkg ? pkg.lessonType : (draft ? draft.lessonType : ''),
      _size:         pkg ? pkg.total     : (draft ? draft.total       : 0),
      _isOverdue:    isOverdue,
      _daysOverdue:  daysOverdue,
      _statusLabel:  label,
      _statusBadge:  badge
    };
  }
  function hydrateCharge(ch, store) {
    if (!ch) return null;
    const stu = store.getUser(ch.studentId);
    return {
      ...ch,
      _studentName: stu ? stu.name : '',
      _date: fmt.dateLong(ch.createdAt) + ' · ' + fmt.time(ch.createdAt),
      _icon: ch.reason === 'lesson_done' ? '✓' : '⚠',
      _badge: ch.reason === 'lesson_done' ? 'green' : 'yellow'
    };
  }
  window.XApp = {
    fmt,
    progressClass,
    progressPct,
    lessonStatus,
    homeworkStatus,
    cancelDeadline,
    deadlineLabel,
    fileIcon,
    toast,
    bootGuard,
    parseHashView,
    watchHash,
    hydrateLesson,
    isLessonTomorrow,
    visibleParticipants,
    hydratePackage,
    hydratePayment,
    hydrateHomework,
    hydrateCharge
  };
})();
