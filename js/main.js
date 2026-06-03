window.addEventListener('load', function () {
  document.body.classList.add('loaded_hiding');
  window.setTimeout(function () {
    document.body.classList.add('loaded');
    document.body.classList.remove('loaded_hiding');
  }, 500);
});

const toggle = document.querySelector('.toggle');
const headerNav = document.querySelector('.header-nav');

if (toggle && headerNav) {
  toggle.addEventListener('click', function () {
    toggle.classList.toggle('active');
    headerNav.classList.toggle('open');
  });

  headerNav.querySelectorAll('.header-nav-item, .nav-auth-logout').forEach(function (link) {
    link.addEventListener('click', function () {
      toggle.classList.remove('active');
      headerNav.classList.remove('open');
    });
  });
}

document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener('click', function (e) {
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;

    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

const contactForm = document.querySelector('.contact-form');
if (contactForm && window.AVID) {
  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = contactForm.querySelector('[name="name"]');
    const email = contactForm.querySelector('[name="email"]');
    const message = contactForm.querySelector('[name="message"]');
    const feedback = contactForm.querySelector('.form-feedback');
    const btn = contactForm.querySelector('button[type="submit"]');

    if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
      feedback.textContent = 'Iltimos, barcha maydonlarni to\'ldiring.';
      feedback.className = 'form-feedback error';
      return;
    }

    btn.disabled = true;
    try {
      const res = await AVID.sendContact({
        name: name.value.trim(),
        email: email.value.trim(),
        message: message.value.trim(),
      });
      feedback.textContent = res.message;
      feedback.className = 'form-feedback success';
      contactForm.reset();
    } catch (err) {
      feedback.textContent = err.message;
      feedback.className = 'form-feedback error';
    } finally {
      btn.disabled = false;
    }
  });
}

