(function () {
  function setActiveNav() {
    const page = document.body.dataset.nav;
    if (!page) return;
    document.querySelectorAll('.header-nav-item[data-nav]').forEach((link) => {
      link.classList.toggle('active', link.dataset.nav === page);
    });
  }

  function clearNavAuth() {
    document.querySelectorAll('.header-nav .nav-auth').forEach((el) => el.remove());
  }

  function syncNavAuth(user) {
    clearNavAuth();
    document.querySelectorAll('.header-nav .nav-login').forEach((el) => {
      el.closest('li')?.classList.toggle('nav-login-hidden', !!user);
    });
  }

  function renderAuthUI(user) {
    const loginBox = document.querySelector('.header-login');
    if (!loginBox) return;

    if (user) {
      let extra = '';
      if (user.role === 'student') {
        extra = '<a href="student-dashboard.html" class="sign-up">O\'qishim</a>';
      }
      if (user.role === 'instructor') {
        extra = '<a href="instructor-dashboard.html" class="sign-up">O\'qituvchi</a>';
      }
      if (user.role === 'admin') {
        extra = '<a href="admin-dashboard.html" class="sign-up">Admin</a>';
      }
      loginBox.innerHTML =
        extra +
        '<a href="profile.html" class="sign-in">Profil</a>' +
        '<button type="button" class="sign-in btn-logout" id="btn-logout">Chiqish</button>';
      document.getElementById('btn-logout')?.addEventListener('click', async () => {
        await AVID.logout();
        location.href = 'index.html';
      });
    } else {
      loginBox.innerHTML =
        '<a href="register.html" class="sign-up">Ro\'yxatdan o\'tish</a>' +
        '<a href="login.html" class="sign-in">Kirish</a>';
    }

    syncNavAuth(user);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    setActiveNav();
    try {
      const data = await AVID.getMe();
      renderAuthUI(data?.user || null);
      document.body.dataset.userRole = data?.user?.role || 'guest';
    } catch {
      renderAuthUI(null);
    }
  });
})();
