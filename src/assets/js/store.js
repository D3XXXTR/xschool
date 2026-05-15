/* ══════════════════════════════════════════════════════════
   Школа ИКС — STORE (localStorage)
   Namespace:   xschool.*  (см. docs/01_PRODUCT_ARCHITECTURE.md)
   Источник:    docs/06_BILLING.md (биллинг — источник истины)
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const KEY = 'xschool';
  const VERSION = 1;

  /* ───────── Demo seeds ───────── */
  function seeds() {
    const today = new Date();
    const day = (offset) => {
      const d = new Date(today); d.setDate(d.getDate() + offset);
      d.setHours(0, 0, 0, 0); return d;
    };
    const at = (d, h, m = 0) => {
      const x = new Date(d); x.setHours(h, m, 0, 0); return x;
    };
    const iso = (d) => d.toISOString();
    const dateLabel = (d) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });

    return {
      version: VERSION,
      session: null, // { userId, role, phone }

      /* === Пользователи === */
      users: [
        // Администратор / Директор
        { id: 'u-admin-1',  role: 'admin',   phone: '+79990000000', name: 'Директор Школы ИКС' },

        // Родители
        { id: 'u-parent-1', role: 'parent',  phone: '+79991110001', name: 'Анна Иванова' },
        { id: 'u-parent-2', role: 'parent',  phone: '+79991110002', name: 'Сергей Кузнецов' },

        // Ученики (parentPhone — ключ связки)
        { id: 'u-student-1', role: 'student', phone: '+79992220001', name: 'Настя Иванова',  grade: 7, parentPhone: '+79991110001' },
        { id: 'u-student-2', role: 'student', phone: '+79992220002', name: 'Артём Иванов',   grade: 4, parentPhone: '+79991110001' },
        { id: 'u-student-3', role: 'student', phone: '+79992220003', name: 'Маша Кузнецова', grade: 9, parentPhone: '+79991110002' },
        { id: 'u-student-4', role: 'student', phone: '+79992220004', name: 'Дима Соколов',   grade: 6, parentPhone: '+79991110002' },

        // Преподаватели
        { id: 'u-teacher-1', role: 'teacher', phone: '+79993330001', name: 'Ирина Иванова', subjects: ['math'] },
        { id: 'u-teacher-2', role: 'teacher', phone: '+79993330002', name: 'Анна Петрова',  subjects: ['english'] },
        { id: 'u-teacher-3', role: 'teacher', phone: '+79993330003', name: 'Дмитрий Орлов', subjects: ['it'] }
      ],

      /* === Предметы === */
      subjects: [
        { id: 'math',     mode: 'school',  title: 'Математика' },
        { id: 'english',  mode: 'school',  title: 'Английский' },
        { id: 'it',       mode: 'academy', title: 'IT-академия: Python' },
        { id: 'ege-math', mode: 'exam',    title: 'ЕГЭ Математика' }
      ],

      /* === Группы (для group-уроков) === */
      groups: [
        { id: 'g-1', subjectId: 'it', teacherId: 'u-teacher-3', title: 'Python — junior, вторник',
          studentIds: ['u-student-2', 'u-student-3', 'u-student-4'] }
      ],

      /* === Назначения преподавателей по предметам === */
      assignments: [
        { id: 'asn-1', teacherId: 'u-teacher-1', studentId: 'u-student-1', subjectId: 'math',    createdAt: iso(day(-30)) },
        { id: 'asn-2', teacherId: 'u-teacher-2', studentId: 'u-student-1', subjectId: 'english', createdAt: iso(day(-30)) },
        { id: 'asn-3', teacherId: 'u-teacher-3', studentId: 'u-student-2', subjectId: 'it',      createdAt: iso(day(-40)) },
        { id: 'asn-4', teacherId: 'u-teacher-3', studentId: 'u-student-3', subjectId: 'it',      createdAt: iso(day(-40)) },
        { id: 'asn-5', teacherId: 'u-teacher-3', studentId: 'u-student-4', subjectId: 'it',      createdAt: iso(day(-40)) }
      ],

      /* === Услуги / тарифы === */
      services: [
        { id: 'math',     title: 'Математика',          category: 'school',
          active: true,
          prices: { individual: 2400, group: 1300 },
          packages: [{ lessons: 4, discount: 0 }, { lessons: 8, discount: 6 }, { lessons: 16, discount: 12 }],
          createdAt: iso(day(-60)), updatedAt: iso(day(-60)) },
        { id: 'english',  title: 'Английский',          category: 'school',
          active: true,
          prices: { individual: 2200, group: 1200 },
          packages: [{ lessons: 4, discount: 0 }, { lessons: 8, discount: 6 }, { lessons: 16, discount: 12 }],
          createdAt: iso(day(-60)), updatedAt: iso(day(-60)) },
        { id: 'it',       title: 'IT-академия: Python', category: 'academy',
          active: true,
          prices: { individual: 2800, group: 1600 },
          packages: [{ lessons: 4, discount: 0 }, { lessons: 8, discount: 6 }, { lessons: 16, discount: 12 }],
          createdAt: iso(day(-60)), updatedAt: iso(day(-60)) },
        { id: 'ege-math', title: 'ЕГЭ Математика',      category: 'exam',
          active: true,
          prices: { individual: 3000, group: 1700 },
          packages: [{ lessons: 4, discount: 0 }, { lessons: 8, discount: 6 }, { lessons: 16, discount: 12 }],
          createdAt: iso(day(-60)), updatedAt: iso(day(-60)) }
      ],

      /* === Заявки с лендинга === */
      leads: [
        { id: 'lead-demo-1', name: 'Алексей Сидоров', phone: '+79998887766',
          mode: 'school', subject: 'Физика', source: 'contact',
          status: 'new', createdAt: iso(day(-1)) }
      ],

      /* === Уроки === */
      lessons: [
        // ✓ done — для истории и заполнения списания
        {
          id: 'l-1', subjectId: 'english', teacherId: 'u-teacher-2',
          type: 'individual',
          participants: [{ studentId: 'u-student-1', status: 'done' }],
          startAt: iso(at(day(-2), 17, 0)), durationMin: 60,
          status: 'done', topic: 'Reading: Unit 5'
        },
        // 🔵 завтра — статус 'planned'; «завтра» вычисляется по startAt в hydrateLesson
        {
          id: 'l-2', subjectId: 'math', teacherId: 'u-teacher-1',
          type: 'individual',
          participants: [{ studentId: 'u-student-1', status: 'planned' }],
          startAt: iso(at(day(1), 17, 0)), durationMin: 60,
          status: 'planned', topic: 'Уравнения с дробями'
        },
        // ⚪ через 3 дня — групповой
        {
          id: 'l-3', subjectId: 'it', teacherId: 'u-teacher-3',
          type: 'group', groupId: 'g-1',
          participants: [
            { studentId: 'u-student-2', status: 'planned' },
            { studentId: 'u-student-3', status: 'planned' },
            { studentId: 'u-student-4', status: 'planned' }
          ],
          startAt: iso(at(day(3), 18, 30)), durationMin: 90,
          status: 'planned', topic: 'Циклы while'
        },
        // ⚠ missed без отмены — для истории списаний
        {
          id: 'l-4', subjectId: 'it', teacherId: 'u-teacher-3',
          type: 'group', groupId: 'g-1',
          participants: [
            { studentId: 'u-student-2', status: 'missed', cancelledAt: null }
          ],
          startAt: iso(at(day(-5), 18, 30)), durationMin: 90,
          status: 'missed', topic: 'Условные операторы'
        }
      ],

      /* === Пакеты === */
      packages: [
        { id: 'pk-1', studentId: 'u-student-1', subjectId: 'math',    lessonType: 'individual',
          total: 10, used: 5, remaining: 5, pricePerLesson: 2400, totalPaid: 24000,
          startedAt: iso(day(-15)) },
        { id: 'pk-2', studentId: 'u-student-1', subjectId: 'english', lessonType: 'individual',
          total: 10, used: 4, remaining: 6, pricePerLesson: 2200, totalPaid: 22000,
          startedAt: iso(day(-10)) },
        { id: 'pk-3', studentId: 'u-student-2', subjectId: 'it',      lessonType: 'group',
          total: 10, used: 8, remaining: 2, pricePerLesson: 1600, totalPaid: 16000,
          startedAt: iso(day(-30)) }
      ],

      /* === Платежи === */
      payments: [
        { id: 'pay-1', parentId: 'u-parent-1', packageId: 'pk-1',
          amount: 24000, method: 'card', status: 'paid', createdAt: iso(day(-15)) },
        { id: 'pay-2', parentId: 'u-parent-1', packageId: 'pk-2',
          amount: 22000, method: 'card', status: 'paid', createdAt: iso(day(-10)) },
        { id: 'pay-3', parentId: 'u-parent-1', packageId: 'pk-3',
          amount: 16000, method: 'card', status: 'paid', createdAt: iso(day(-30)) }
      ],

      /* === Списания === */
      charges: [
        { id: 'c-1', lessonId: 'l-1', packageId: 'pk-2', studentId: 'u-student-1',
          amount: 1, reason: 'lesson_done',
          reasonText: 'Урок списан: занятие проведено ' + dateLabel(day(-2)) + ', 17:00 — Английский, преподаватель Петрова А.',
          createdAt: iso(day(-2)) },
        { id: 'c-2', lessonId: 'l-4', packageId: 'pk-3', studentId: 'u-student-2',
          amount: 1, reason: 'lesson_missed_late',
          reasonText: 'Урок списан: ученик не пришёл и отмена не была сделана минимум за 8 часов до начала занятия. (' + dateLabel(day(-5)) + ', 18:30, IT-академия)',
          createdAt: iso(day(-5)) }
      ],

      /* === Домашние задания === */
      homeworks: [
        { id: 'hw-1', lessonId: 'l-1', studentId: 'u-student-1', teacherId: 'u-teacher-2',
          subjectId: 'english',
          title: 'Reading: Unit 5',
          description: 'Прочитать текст и выписать 10 новых слов с переводом.',
          deadline: iso(at(day(1), 18, 0)),
          status: 'in_progress' },
        { id: 'hw-2', lessonId: 'l-2', studentId: 'u-student-1', teacherId: 'u-teacher-1',
          subjectId: 'math',
          title: 'Уравнения с дробями',
          description: 'Решить №№ 4.12–4.18.',
          deadline: iso(at(day(2), 18, 0)),
          status: 'assigned' }
      ]
    };
  }

  /* ───────── Persistence ───────── */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== VERSION) return null;
      return parsed;
    } catch (e) { return null; }
  }
  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  /**
   * Миграция сохранённого state: добавляет сущности, которых не было
   * в предыдущих версиях (admin user, assignments, leads), не трогая
   * существующие данные. Возвращает true, если что-то изменилось.
   */
  function migrate(state) {
    if (!state || typeof state !== 'object') return false;
    let dirty = false;

    if (!Array.isArray(state.users)) { state.users = []; dirty = true; }

    // Admin user (этап 13)
    const hasAdmin = state.users.some(u => u && u.role === 'admin');
    if (!hasAdmin) {
      state.users.unshift({
        id: 'u-admin-1',
        role: 'admin',
        phone: '+79990000000',
        name: 'Директор Школы ИКС'
      });
      dirty = true;
    }

    // Assignments (этап 13)
    if (!Array.isArray(state.assignments)) {
      state.assignments = [];
      dirty = true;
    }

    // Leads (этапы N1 + 13)
    if (!Array.isArray(state.leads)) {
      state.leads = [];
      dirty = true;
    }

    // На всякий случай — другие массивы, которые могут отсутствовать
    // в очень старом state
    ['lessons','packages','payments','charges','homeworks','subjects','groups']
      .forEach(k => {
        if (!Array.isArray(state[k])) { state[k] = []; dirty = true; }
      });

    // Старые payments без status → paid (этап 15)
    if (Array.isArray(state.payments)) {
      for (const p of state.payments) {
        if (!p.status) { p.status = 'paid'; dirty = true; }
      }
    }

    // Services / тарифы (этап 14): создаются автоматически из существующих
    // subjects с разумными дефолтами. Не перезаписывает уже существующие
    // записи services.
    if (!Array.isArray(state.services)) { state.services = []; dirty = true; }
    const DEFAULT_PRICES = { math:2400, english:2200, it:2800, 'ege-math':3000 };
    for (const subj of state.subjects) {
      if (state.services.some(s => s.id === subj.id)) continue;
      const baseInd = DEFAULT_PRICES[subj.id] || 2000;
      const baseGrp = Math.round(baseInd * 0.55 / 100) * 100;
      state.services.push({
        id: subj.id,
        title: subj.title,
        category: subj.mode || 'school',
        active: true,
        prices: { individual: baseInd, group: baseGrp },
        packages: [
          { lessons: 4,  discount: 0  },
          { lessons: 8,  discount: 6  },
          { lessons: 16, discount: 12 }
        ],
        createdAt: nowIso(),
        updatedAt: nowIso()
      });
      dirty = true;
    }

    return dirty;
  }

  function init() {
    let state = load();
    if (!state) {
      state = seeds();
      save(state);
      return state;
    }
    // Безопасная миграция — без потери пользовательских данных
    if (migrate(state)) save(state);
    return state;
  }
  function reset() {
    localStorage.removeItem(KEY);
    return init();
  }

  /* ───────── id/timestamp helpers ───────── */
  function genId(prefix) {
    return (prefix || 'x') + '-' +
      Date.now().toString(36) + '-' +
      Math.random().toString(36).slice(2, 6);
  }
  function nowIso() { return new Date().toISOString(); }

  /** Создаёт Package из черновика и пушит в state.packages.
   *  Используется при переходе платежа в 'paid'. */
  function _createPackageFromDraft(state, draft) {
    const total = Number(draft.total) || 0;
    const pkg = {
      id: genId('pk'),
      studentId: draft.studentId,
      subjectId: draft.subjectId,
      lessonType: draft.lessonType || 'individual',
      total, used: 0, remaining: total,
      pricePerLesson: Number(draft.pricePerLesson) || 0,
      totalPaid: Number(draft.totalPaid) || 0,
      startedAt: nowIso(),
      endsAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    if (!Array.isArray(state.packages)) state.packages = [];
    state.packages.push(pkg);
    return pkg;
  }

  /* ───────── Subscribers (in-tab + cross-tab) ───────── */
  const subs = new Set();
  function notifySubs() {
    const st = load();
    subs.forEach(cb => { try { cb(st); } catch (e) { console.error(e); } });
  }
  // cross-tab: при изменениях в другой вкладке тоже зовём подписчиков
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => { if (e.key === KEY) notifySubs(); });
  }
  function commit(state) {
    save(state);
    notifySubs();
  }

  /* ───────── Public API ───────── */
  const Store = {
    /* low-level */
    init, save, reset, seeds, migrate, genId, nowIso,

    get state()  { return load() || init(); },
    set state(v) { commit(v); },

    /* subscribers */
    subscribe(cb) { subs.add(cb); return () => subs.delete(cb); },

    /* session */
    setSession(s) { const st = this.state; st.session = s; commit(st); },
    getSession()  { return this.state.session; },
    clearSession(){ const st = this.state; st.session = null; commit(st); },

    /* lookups */
    getUser(id)              { return this.state.users.find(u => u.id === id); },
    findUsersByPhone(phone)  { return this.state.users.filter(u => u.phone === phone); },
    getSubject(id)           { return this.state.subjects.find(s => s.id === id); },
    getPackage(id)           { return this.state.packages.find(p => p.id === id); },
    getLesson(id)            { return this.state.lessons.find(l => l.id === id); },
    getHomework(id)          { return this.state.homeworks.find(h => h.id === id); },

    childrenOfParent(parentId) {
      const parent = this.getUser(parentId);
      if (!parent) return [];
      return this.state.users.filter(u => u.role === 'student' && u.parentPhone === parent.phone);
    },
    parentOfStudent(studentId) {
      const stu = this.getUser(studentId);
      if (!stu) return null;
      return this.state.users.find(u => u.role === 'parent' && u.phone === stu.parentPhone) || null;
    },
    packagesOfStudent(studentId) {
      return this.state.packages.filter(p => p.studentId === studentId);
    },
    lessonsOfStudent(studentId) {
      return this.state.lessons.filter(l =>
        l.participants && l.participants.some(p => p.studentId === studentId));
    },
    lessonsOfTeacher(teacherId) {
      return this.state.lessons.filter(l => l.teacherId === teacherId);
    },
    chargesOfStudent(studentId) {
      return this.state.charges.filter(c => c.studentId === studentId);
    },
    chargesOfLesson(lessonId, studentId) {
      return this.state.charges.filter(c =>
        c.lessonId === lessonId && (!studentId || c.studentId === studentId));
    },

    /* === Admin lookups: assignments === */
    assignmentsOfStudent(studentId) {
      const list = this.state.assignments || [];
      return list.filter(a => a.studentId === studentId);
    },
    assignmentsOfTeacher(teacherId) {
      const list = this.state.assignments || [];
      return list.filter(a => a.teacherId === teacherId);
    },
    /** Подсказка: рекомендованный преподаватель по (студент, предмет). */
    recommendTeacher(studentId, subjectId) {
      const list = this.state.assignments || [];
      const a = list.find(x => x.studentId === studentId && x.subjectId === subjectId);
      return a ? a.teacherId : null;
    },

    /* === Services / тарифы === */
    getService(id) {
      return (this.state.services || []).find(s => s.id === id) || null;
    },
    getServiceBySubject(subjectId) {
      return this.getService(subjectId);
    },
    activeServices() {
      return (this.state.services || []).filter(s => s.active);
    },
    /* notificationsOf удалён: уведомления убраны из MVP */

    /* ───────── WRITE API ─────────
       Все операции:
         • генерируют id, если не передан;
         • проставляют createdAt/updatedAt;
         • сохраняют через commit() (с уведомлением подписчиков). */

    addLesson(payload) {
      const st = this.state;
      const lesson = {
        id: payload.id || genId('l'),
        subjectId: payload.subjectId,
        teacherId: payload.teacherId,
        type: payload.type || 'individual',
        groupId: payload.groupId || null,
        participants: (payload.participants || []).map(p => ({
          studentId: p.studentId,
          status: p.status || 'planned',
          cancelledAt: p.cancelledAt || null,
          cancelledBy: p.cancelledBy || null
        })),
        startAt: payload.startAt,
        durationMin: payload.durationMin || 60,
        status: payload.status || 'planned',
        topic: payload.topic || '',
        notes: payload.notes || '',
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      st.lessons.push(lesson);
      commit(st);
      return lesson;
    },
    updateLesson(id, patch) {
      const st = this.state;
      const i = st.lessons.findIndex(l => l.id === id);
      if (i < 0) return null;
      st.lessons[i] = { ...st.lessons[i], ...patch, updatedAt: nowIso() };
      commit(st);
      return st.lessons[i];
    },

    addPackage(payload) {
      const st = this.state;
      const total = payload.total || 0;
      const used  = payload.used  || 0;
      const pkg = {
        id: payload.id || genId('pk'),
        studentId: payload.studentId,
        subjectId: payload.subjectId,
        lessonType: payload.lessonType || 'individual',
        total, used, remaining: total - used,
        pricePerLesson: payload.pricePerLesson || 0,
        totalPaid: payload.totalPaid || 0,
        startedAt: payload.startedAt || nowIso(),
        endsAt: payload.endsAt || null,
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      st.packages.push(pkg);
      commit(st);
      return pkg;
    },
    updatePackage(id, patch) {
      const st = this.state;
      const i = st.packages.findIndex(p => p.id === id);
      if (i < 0) return null;
      const next = { ...st.packages[i], ...patch, updatedAt: nowIso() };
      // remaining всегда производное
      if (typeof next.total === 'number' && typeof next.used === 'number') {
        next.remaining = next.total - next.used;
      }
      st.packages[i] = next;
      commit(st);
      return next;
    },

    addPayment(payload) {
      const st = this.state;
      const p = {
        id: payload.id || genId('pay'),
        parentId: payload.parentId,
        packageId: payload.packageId || null,
        packageDraft: payload.packageDraft || null,
        amount: Number(payload.amount) || 0,
        method: payload.method || 'card',
        status: payload.status || 'paid',
        dueAt: payload.dueAt || null,
        comment: payload.comment || '',
        createdAt: payload.createdAt || nowIso(),
        updatedAt: nowIso()
      };
      st.payments.push(p);

      // Если payment сразу paid и есть draft пакета — создаём пакет
      if (p.status === 'paid' && p.packageDraft && !p.packageId) {
        const pkg = _createPackageFromDraft(st, p.packageDraft);
        p.packageId = pkg.id;
      }

      commit(st);
      return p;
    },

    /** Патч платежа.
     *  Если статус меняется на 'paid' и есть packageDraft без packageId —
     *  создаётся Package, packageId записывается. Повторное сохранение
     *  не создаёт пакет дважды (защита по packageId). */
    updatePayment(paymentId, patch) {
      const st = this.state;
      const i = st.payments.findIndex(p => p.id === paymentId);
      if (i < 0) return null;
      const prev = st.payments[i];
      const next = { ...prev, ...patch, updatedAt: nowIso() };

      // ВАЖНО: dueAt и comment могут быть null/'' — пропускаем как есть
      if (patch.amount !== undefined) next.amount = Number(patch.amount) || 0;

      // Переход в paid + есть draft и нет packageId → создать пакет
      if (prev.status !== 'paid' && next.status === 'paid'
          && next.packageDraft && !next.packageId) {
        const pkg = _createPackageFromDraft(st, next.packageDraft);
        next.packageId = pkg.id;
      }

      st.payments[i] = next;
      commit(st);
      return next;
    },

    addCharge(payload) {
      const st = this.state;
      const c = {
        id: payload.id || genId('c'),
        lessonId: payload.lessonId,
        packageId: payload.packageId || null,
        outOfPackage: !!payload.outOfPackage,
        studentId: payload.studentId,
        amount: payload.amount || 1,
        reason: payload.reason,
        reasonText: payload.reasonText || '',
        comment: payload.comment || '',
        createdAt: payload.createdAt || nowIso()
      };
      st.charges.push(c);
      commit(st);
      return c;
    },


    addHomework(payload) {
      const st = this.state;
      // Title — желательно, но не обязательно. Если пусто — «Домашнее задание».
      const rawTitle = (payload.title || '').toString().trim();
      const hw = {
        id: payload.id || genId('hw'),
        lessonId: payload.lessonId || null,
        studentId: payload.studentId,
        teacherId: payload.teacherId,
        subjectId: payload.subjectId,
        title: rawTitle || 'Домашнее задание',
        description: payload.description || '',
        deadline: payload.deadline || null,           // допустим null
        status: payload.status || 'assigned',
        studentAnswer: payload.studentAnswer || '',
        files: Array.isArray(payload.files)
          ? payload.files.map(f => ({ name: f.name||'', size: f.size||0, type: f.type||'' }))
          : [],
        teacherComment: payload.teacherComment || '',
        score: payload.score ?? null,
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      st.homeworks.push(hw);
      commit(st);
      return hw;
    },
    updateHomework(id, patch) {
      const st = this.state;
      const i = st.homeworks.findIndex(h => h.id === id);
      if (i < 0) return null;
      st.homeworks[i] = { ...st.homeworks[i], ...patch, updatedAt: nowIso() };
      commit(st);
      return st.homeworks[i];
    },

    /* addNotification / markNotificationRead / markAllNotificationsRead
       удалены: уведомления убраны из MVP. */

    /* ═══════════ Admin write-API ═══════════ */

    /** Низкоуровневое создание пользователя. */
    addUser(payload) {
      const st = this.state;
      const user = {
        id: payload.id || genId('u'),
        role: payload.role,
        phone: (payload.phone || '').toString().trim(),
        name: (payload.name || '').toString().trim(),
        ...(payload.role === 'student' ? {
          grade: payload.grade,
          parentPhone: payload.parentPhone || '',
          modes: payload.modes || [],
          subjects: payload.subjects || []
        } : {}),
        ...(payload.role === 'teacher' ? { subjects: payload.subjects || [] } : {})
      };
      st.users.push(user);
      commit(st);
      return user;
    },

    updateUser(userId, patch) {
      const st = this.state;
      const i = st.users.findIndex(u => u.id === userId);
      if (i < 0) return null;
      st.users[i] = { ...st.users[i], ...patch };
      commit(st);
      return st.users[i];
    },

    /** Создаёт родителя. */
    addParent({ name, phone }) {
      return this.addUser({ role: 'parent', name, phone });
    },

    /** Создаёт преподавателя. */
    addTeacher({ name, phone, subjects }) {
      return this.addUser({ role: 'teacher', name, phone, subjects: subjects || [] });
    },

    /** Создаёт ученика и связывает его с родителем по phone родителя.
     *  Принимает parentId (из формы) — извлекаем phone и записываем в parentPhone. */
    addStudent({ name, phone, grade, parentId }) {
      const parent = parentId ? this.getUser(parentId) : null;
      const parentPhone = parent ? parent.phone : '';
      return this.addUser({
        role: 'student',
        name,
        phone: phone || '',
        grade: Number(grade) || null,
        parentPhone
      });
    },

    /** Связывает преподавателя со учеником по предмету (без создания урока).
     *  Дедуп по тройке (teacherId, studentId, subjectId). */
    assignTeacherToStudent({ teacherId, studentId, subjectId }) {
      const st = this.state;
      if (!Array.isArray(st.assignments)) st.assignments = [];
      const existing = st.assignments.find(a =>
        a.teacherId === teacherId && a.studentId === studentId && a.subjectId === subjectId);
      if (existing) return { ok: false, error: 'already_assigned', assignment: existing };
      const a = {
        id: genId('asn'),
        teacherId, studentId, subjectId,
        createdAt: nowIso()
      };
      st.assignments.push(a);
      commit(st);
      return { ok: true, assignment: a };
    },
    unassignTeacherFromStudent({ teacherId, studentId, subjectId }) {
      const st = this.state;
      const before = (st.assignments || []).length;
      st.assignments = (st.assignments || []).filter(a =>
        !(a.teacherId === teacherId && a.studentId === studentId && a.subjectId === subjectId));
      if (st.assignments.length === before) return { ok: false, error: 'not_found' };
      commit(st);
      return { ok: true };
    },
    removeAssignment(id) {
      const st = this.state;
      const before = (st.assignments || []).length;
      st.assignments = (st.assignments || []).filter(a => a.id !== id);
      if (st.assignments.length === before) return { ok: false, error: 'not_found' };
      commit(st);
      return { ok: true };
    },

    /* ─── Services write-API ─── */

    /** Создаёт услугу. Если subject с таким id отсутствует — создаёт его автоматически.
     *  payload: { id?, title, category, prices?, packages?, active? } */
    addService(payload) {
      const st = this.state;
      if (!Array.isArray(st.services)) st.services = [];
      const id = payload.id ? String(payload.id).trim() : genId('svc');
      if (st.services.some(s => s.id === id)) {
        return { ok: false, error: 'service_exists' };
      }
      const svc = {
        id,
        title: (payload.title || '').toString().trim() || id,
        category: payload.category || 'school',
        active: payload.active !== false,
        prices: {
          individual: Number(payload.prices && payload.prices.individual) || 0,
          group:      Number(payload.prices && payload.prices.group)      || 0
        },
        packages: Array.isArray(payload.packages) && payload.packages.length
          ? payload.packages.map(p => ({
              lessons: Number(p.lessons) || 0,
              discount: Number(p.discount) || 0
            })).filter(p => p.lessons > 0)
          : [
              { lessons: 4,  discount: 0  },
              { lessons: 8,  discount: 6  },
              { lessons: 16, discount: 12 }
            ],
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      st.services.push(svc);

      // Автоматически создаём subject, если его нет (id = service.id)
      if (!st.subjects.some(x => x.id === id)) {
        st.subjects.push({ id, mode: svc.category, title: svc.title });
      }

      commit(st);
      return { ok: true, service: svc };
    },

    /** Патч услуги. Меняет title/category и в связанном subject. */
    updateService(serviceId, patch) {
      const st = this.state;
      if (!Array.isArray(st.services)) st.services = [];
      const i = st.services.findIndex(s => s.id === serviceId);
      if (i < 0) return null;
      const next = { ...st.services[i], updatedAt: nowIso() };
      if (patch.title !== undefined)    next.title = String(patch.title).trim() || next.title;
      if (patch.category !== undefined) next.category = patch.category;
      if (patch.active !== undefined)   next.active = !!patch.active;
      if (patch.prices) {
        next.prices = {
          individual: Number(patch.prices.individual ?? next.prices.individual) || 0,
          group:      Number(patch.prices.group      ?? next.prices.group)      || 0
        };
      }
      if (Array.isArray(patch.packages)) {
        next.packages = patch.packages.map(p => ({
          lessons: Number(p.lessons) || 0,
          discount: Number(p.discount) || 0
        })).filter(p => p.lessons > 0);
      }
      st.services[i] = next;

      // Синхронизируем связанный subject (title / mode = category)
      const j = st.subjects.findIndex(x => x.id === serviceId);
      if (j >= 0) {
        st.subjects[j] = { ...st.subjects[j], title: next.title, mode: next.category };
      }

      commit(st);
      return next;
    },

    toggleServiceActive(serviceId) {
      const svc = this.getService(serviceId);
      if (!svc) return null;
      return this.updateService(serviceId, { active: !svc.active });
    },

    updateServicePrice(serviceId, lessonType, price) {
      const svc = this.getService(serviceId);
      if (!svc) return null;
      const next = { ...svc.prices, [lessonType]: Number(price) || 0 };
      return this.updateService(serviceId, { prices: next });
    },

    updateServicePackage(serviceId, lessons, patch) {
      const svc = this.getService(serviceId);
      if (!svc) return null;
      const packages = (svc.packages || []).slice();
      const i = packages.findIndex(p => p.lessons === lessons);
      if (i < 0) {
        packages.push({ lessons: Number(lessons) || 0, discount: Number(patch.discount) || 0 });
      } else {
        packages[i] = {
          lessons: patch.lessons !== undefined ? Number(patch.lessons) : packages[i].lessons,
          discount: patch.discount !== undefined ? Number(patch.discount) : packages[i].discount
        };
      }
      return this.updateService(serviceId, { packages });
    },

    /** Патч заявки с лендинга. */
    updateLead(leadId, patch) {
      const st = this.state;
      if (!Array.isArray(st.leads)) return null;
      const i = st.leads.findIndex(l => l.id === leadId);
      if (i < 0) return null;
      st.leads[i] = { ...st.leads[i], ...patch, updatedAt: nowIso() };
      commit(st);
      return st.leads[i];
    },

    /** Заявка с лендинга (trial / lead).
     *  Минимальный набор: name, phone. Остальное — свободно. */
    addLead(payload) {
      const st = this.state;
      if (!Array.isArray(st.leads)) st.leads = [];
      const lead = {
        id: payload.id || genId('lead'),
        name: (payload.name || '').toString().trim(),
        phone: (payload.phone || '').toString().trim(),
        mode: payload.mode || '',
        direction: payload.direction || payload.mode || '',
        subject: (payload.subject || '').toString().trim(),
        comment: (payload.comment || '').toString().trim(),
        source: payload.source || 'landing',
        status: 'new',
        createdAt: nowIso()
      };
      st.leads.push(lead);
      commit(st);
      return lead;
    }
  };

  /* expose */
  window.XSchool = Store;

  /* auto-init on load */
  init();
})();
