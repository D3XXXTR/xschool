/* ══════════════════════════════════════════════════════════
   Школа ИКС — AUTH
   Вход по телефону + код (мок: 0000).
   Определение роли по phone, выбор при коллизии, выход.
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  if (!window.XSchool) {
    console.error('[xschool/auth] store.js не загружен');
    return;
  }
  const Store = window.XSchool;
  const MOCK_CODE = '0000';

  function redirectFor(role) {
    if (role === 'parent')  return 'parent.html';
    if (role === 'student') return 'student.html';
    if (role === 'teacher') return 'teacher.html';
    if (role === 'admin')   return 'admin.html';
    return 'index.html';
  }

  function normalizePhone(phone) {
    if (!phone) return '';
    let p = String(phone).replace(/[^\d+]/g, '');
    // упрощённая нормализация: 8XXXXXXXXXX → +7XXXXXXXXXX
    if (p.startsWith('8') && p.length === 11) p = '+7' + p.slice(1);
    if (p.startsWith('7') && p.length === 11) p = '+' + p;
    return p;
  }

  const Auth = {
    /* ── Шаг 1: запрос кода ───────────────────────────── */
    requestCode(phone) {
      const p = normalizePhone(phone);
      if (!p || p.length < 11) return { ok: false, error: 'invalid_phone' };
      // в реальной системе — отправка SMS; здесь — мок
      return { ok: true, expectedCode: MOCK_CODE };
    },

    /* ── Шаг 2: проверка кода ─────────────────────────── */
    verify(phone, code) {
      if (code !== MOCK_CODE) return { ok: false, error: 'invalid_code' };

      const p = normalizePhone(phone);
      const matches = Store.findUsersByPhone(p);
      if (matches.length === 0) return { ok: false, error: 'phone_not_found' };

      // Если на одном телефоне один пользователь — сразу логин.
      // Если несколько (например, родитель = ученик) — выбор роли.
      const roles = [...new Set(matches.map(u => u.role))];
      if (matches.length === 1 || roles.length === 1) {
        const user = matches[0];
        Store.setSession({ userId: user.id, role: user.role, phone: p });
        return { ok: true, role: user.role, redirect: redirectFor(user.role) };
      }
      return {
        ok: true,
        multipleRoles: true,
        options: matches.map(u => ({ userId: u.id, role: u.role, name: u.name }))
      };
    },

    /* ── Шаг 3 (опц.): выбор роли при коллизии ────────── */
    chooseRole(userId) {
      const user = Store.getUser(userId);
      if (!user) return { ok: false, error: 'user_not_found' };
      Store.setSession({ userId: user.id, role: user.role, phone: user.phone });
      return { ok: true, redirect: redirectFor(user.role) };
    },

    /* ── Гарды страниц ─────────────────────────────────── */
    requireSession(expectedRole) {
      const session = Store.getSession();
      if (!session) {
        window.location.href = 'auth.html';
        return null;
      }
      if (expectedRole && session.role !== expectedRole) {
        window.location.href = redirectFor(session.role);
        return null;
      }
      return session;
    },

    currentUser() {
      const s = Store.getSession();
      return s ? Store.getUser(s.userId) : null;
    },

    /* ── Выход ─────────────────────────────────────────── */
    logout() {
      Store.clearSession();
      window.location.href = 'auth.html';
    },

    /* ── Утилиты ───────────────────────────────────────── */
    normalizePhone,
    redirectFor,
    MOCK_CODE
  };

  window.XAuth = Auth;
})();
