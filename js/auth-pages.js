function getQuery(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function safeRedirectPath(next) {
  if (!next) return 'index.html';
  try {
    const url = new URL(next, window.location.origin);
    if (url.origin !== window.location.origin) return 'index.html';
    return url.pathname + url.search + url.hash;
  } catch {
    return 'index.html';
  }
}

function showFeedback(el, text, type) {
  el.textContent = text;
  el.className = 'form-feedback ' + type;
}

document.addEventListener('DOMContentLoaded', function () {
  const page = document.body.dataset.authPage;
  if (!page || !window.AVID) return;

  if (page === 'login') bindLogin();
  if (page === 'register') bindRegister();
  if (page === 'forgot') bindForgot();
  if (page === 'reset') bindReset();
  if (page === 'profile') bindProfile();
});

function bindLogin() {
  const form = document.getElementById('auth-form');
  const fb = document.getElementById('auth-feedback');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await AVID.login({
        email: form.email.value.trim(),
        password: form.password.value,
      });
      window.location.href = safeRedirectPath(getQuery('next'));
    } catch (err) {
      showFeedback(fb, err.message, 'error');
    }
  });
}

function bindRegister() {
  const form = document.getElementById('auth-form');
  const fb = document.getElementById('auth-feedback');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.password.value !== form.password2.value) {
      showFeedback(fb, 'Parollar mos kelmaydi', 'error');
      return;
    }
    if (!/[A-Za-z]/.test(form.password.value) || !/\d/.test(form.password.value)) {
      showFeedback(fb, 'Parol harf va raqamdan iborat bo\'lishi kerak', 'error');
      return;
    }
    try {
      await AVID.register({
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        password: form.password.value,
        role: form.role?.value || 'student',
      });
      window.location.href = 'index.html';
    } catch (err) {
      showFeedback(fb, err.message, 'error');
    }
  });
}

function bindForgot() {
  const form = document.getElementById('auth-form');
  const fb = document.getElementById('auth-feedback');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await AVID.forgotPassword({ email: form.email.value.trim() });
      showFeedback(fb, res.message, 'success');
      if (res.resetUrl) {
        fb.innerHTML =
          res.message +
          '<br><a href="' +
          res.resetUrl +
          '">Tiklash havolasi (dev)</a>';
      }
    } catch (err) {
      showFeedback(fb, err.message, 'error');
    }
  });
}

function bindReset() {
  const token = getQuery('token');
  const form = document.getElementById('auth-form');
  const fb = document.getElementById('auth-feedback');
  if (!token) {
    showFeedback(fb, 'Token topilmadi', 'error');
    form.style.display = 'none';
    return;
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.password.value !== form.password2.value) {
      showFeedback(fb, 'Parollar mos kelmaydi', 'error');
      return;
    }
    try {
      await AVID.resetPassword({ token, password: form.password.value });
      showFeedback(fb, 'Parol yangilandi. Login sahifasiga o\'tish...', 'success');
      setTimeout(() => (window.location.href = 'login.html'), 2000);
    } catch (err) {
      showFeedback(fb, err.message, 'error');
    }
  });
}

async function bindProfile() {
  const fb = document.getElementById('auth-feedback');
  const form = document.getElementById('profile-form');
  const guest = document.getElementById('profile-guest');

  let me;
  try {
    me = await AVID.getMe();
  } catch (err) {
    guest.hidden = false;
    form.hidden = true;
    const guestMsg = guest.querySelector('p');
    if (guestMsg) {
      guestMsg.textContent =
        err.status === 401
          ? 'Siz tizimga kirmagansiz.'
          : 'Server bilan aloqa xatosi. Keyinroq urinib ko\'ring.';
    }
    return;
  }

  if (!me?.user) {
    guest.hidden = false;
    form.hidden = true;
    return;
  }

  guest.hidden = true;
  form.hidden = false;
  form.name.value = me.user.name;
  form.email.value = me.user.email;
  if (form.bio) form.bio.value = me.user.bio || '';
  document.getElementById('profile-created').textContent = me.user.created_at || '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await AVID.updateProfile({
        name: form.name.value.trim(),
        bio: form.bio?.value?.trim() ?? '',
      });
      const avatarInput = document.getElementById('avatar');
      if (avatarInput?.files?.[0]) {
        await AVID.uploadAvatar(avatarInput.files[0]);
      }
      showFeedback(fb, 'Profil yangilandi', 'success');
    } catch (err) {
      showFeedback(fb, err.message, 'error');
    }
  });

  document.getElementById('btn-profile-logout')?.addEventListener('click', async () => {
    await AVID.logout();
    window.location.href = 'index.html';
  });
}
