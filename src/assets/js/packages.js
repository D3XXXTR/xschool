/* ══════════════════════════════════════════════════════════
   Школа ИКС — PACKAGES
   Цены, скидки, атомарная покупка пакета (Payment + Package + уведомление).
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  if (!window.XSchool) {
    console.error('[xschool/packages] store.js не загружен'); return;
  }
  const Store = window.XSchool;

  /* ── Fallback-таблица: используется, если для предмета нет Service ─── */
  const FALLBACK_PRICE = {
    'math':     2400,
    'english':  2200,
    'it':       2800,
    'ege-math': 3000
  };
  const GROUP_RATIO = 0.55;          // групповое ≈ 55% от индивидуального
  const FALLBACK_DISCOUNT = { 4: 0, 8: 0.06, 16: 0.12 };
  const FALLBACK_SIZES = [4, 8, 16];

  /** Цена за одно занятие. Сначала смотрит в Service, fallback на таблицу. */
  function priceFor(subjectId, lessonType) {
    const svc = Store.getService(subjectId);
    if (svc && svc.prices) {
      const v = svc.prices[lessonType];
      if (typeof v === 'number' && v > 0) return v;
    }
    const base = FALLBACK_PRICE[subjectId] != null ? FALLBACK_PRICE[subjectId] : 2000;
    if (lessonType === 'group') return Math.round(base * GROUP_RATIO / 100) * 100;
    return base;
  }

  /** Скидка за размер пакета (доля 0..1). */
  function discountFor(subjectId, size) {
    // Совместимость со старым 1-аргументным вызовом: discountFor(size)
    if (typeof subjectId === 'number' && size === undefined) {
      size = subjectId; subjectId = null;
    }
    const svc = subjectId ? Store.getService(subjectId) : null;
    if (svc && Array.isArray(svc.packages)) {
      const pk = svc.packages.find(p => Number(p.lessons) === Number(size));
      if (pk) return (Number(pk.discount) || 0) / 100;
    }
    return FALLBACK_DISCOUNT[size] || 0;
  }

  function totalFor(subjectId, lessonType, size) {
    const price = priceFor(subjectId, lessonType);
    const subtotal = price * size;
    const disc = discountFor(subjectId, size);
    return Math.round(subtotal * (1 - disc));
  }

  /** Доступные размеры пакетов для предмета (из Service либо fallback). */
  function sizesFor(subjectId) {
    const svc = subjectId ? Store.getService(subjectId) : null;
    if (svc && Array.isArray(svc.packages) && svc.packages.length) {
      return svc.packages.map(p => Number(p.lessons)).filter(n => n > 0);
    }
    return FALLBACK_SIZES.slice();
  }
  /** Совместимость: статические размеры (использовалось до этапа 14). */
  const SIZES = FALLBACK_SIZES;

  /* ── Атомарная покупка пакета ─────────────────────────── *
   * payload: { parentId, studentId, subjectId, lessonType, size }
   * Возвращает: { ok, payment, package, error }                 */
  function purchasePackage(payload) {
    payload = payload || {};
    const state = Store.state;

    if (!payload.parentId)  return { ok: false, error: 'parent_required' };
    if (!payload.studentId) return { ok: false, error: 'student_required' };
    if (!payload.subjectId) return { ok: false, error: 'subject_required' };
    if (!['individual','group'].includes(payload.lessonType)) {
      return { ok: false, error: 'lessonType_invalid' };
    }

    // Проверяем услугу: должна существовать и быть активной
    const svc = Store.getService(payload.subjectId);
    if (svc && svc.active === false) {
      return { ok: false, error: 'service_inactive' };
    }
    // Проверяем тип занятий доступен (есть цена > 0)
    const priceCheck = priceFor(payload.subjectId, payload.lessonType);
    if (!priceCheck || priceCheck <= 0) {
      return { ok: false, error: 'lessonType_unavailable' };
    }
    // Доступные размеры — из Service или fallback
    const allowedSizes = sizesFor(payload.subjectId);
    if (!allowedSizes.includes(Number(payload.size))) {
      return { ok: false, error: 'size_invalid' };
    }

    const size = Number(payload.size);
    const pricePerLesson = priceFor(payload.subjectId, payload.lessonType);
    const total = totalFor(payload.subjectId, payload.lessonType, size);

    // 1) Создаём пакет
    const pkg = {
      id: Store.genId('pk'),
      studentId: payload.studentId,
      subjectId: payload.subjectId,
      lessonType: payload.lessonType,
      total: size,
      used: 0,
      remaining: size,
      pricePerLesson,
      totalPaid: total,
      startedAt: Store.nowIso(),
      endsAt: null,
      createdAt: Store.nowIso(),
      updatedAt: Store.nowIso()
    };
    state.packages.push(pkg);

    // 2) Создаём платёж (demo, статус paid)
    const payment = {
      id: Store.genId('pay'),
      parentId: payload.parentId,
      packageId: pkg.id,
      amount: total,
      method: 'demo',
      status: 'paid',
      comment: '',
      createdAt: Store.nowIso()
    };
    state.payments.push(payment);

    // 3) Сохраняем за один commit (один storage event).
    //    Уведомления удалены из MVP: подтверждение покупки показывает
    //    мастер на месте + сразу появляется новый пакет в списке.
    Store.state = state;
    return { ok: true, payment, package: pkg };
  }

  /* ── Экспорт ──────────────────────────────────────────── */
  window.XPackages = {
    priceFor,
    discountFor,
    totalFor,
    sizesFor,
    SIZES,
    purchasePackage
  };
})();
