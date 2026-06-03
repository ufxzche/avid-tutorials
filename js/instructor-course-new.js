document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('new-course-form');
  const langSelect = form?.querySelector('[name=lang]');
  if (!form) return;

  try {
    const { categories } = await AVID.getCategories();
    if (langSelect && categories?.length) {
      langSelect.innerHTML = categories
        .map((c) => `<option value="${c.slug}">${c.name}</option>`)
        .join('');
    }
  } catch (_) {}

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fb = document.getElementById('form-feedback');
    clearFieldErrors(form);

    const payload = {
      title: form.title.value.trim(),
      description: form.description.value.trim(),
      programming_language: form.lang.value,
      level: form.level.value,
      is_free: true,
      price: 0,
    };

    if (!validateNewCourse(payload, form)) return;

    try {
      const res = await AVID.createCourse(payload);
      fb.textContent = 'Kurs yaratildi. Boshqarish sahifasiga o\'tish...';
      fb.className = 'form-feedback success';
      setTimeout(() => (location.href = 'instructor-course-manage.html?id=' + res.id), 800);
    } catch (err) {
      fb.textContent = err.message;
      fb.className = 'form-feedback error';
    }
  });
});

function validateNewCourse(p, form) {
  let ok = true;
  if (p.title.length < 3) {
    setErr(form, 'title', 'Kamida 3 belgi');
    ok = false;
  }
  if (p.description.length < 20) {
    setErr(form, 'description', 'Kamida 20 belgi');
    ok = false;
  }
  return ok;
}

function setErr(form, name, msg) {
  let el = form.querySelector('[data-err="' + name + '"]');
  if (!el) {
    el = document.createElement('span');
    el.className = 'field-error';
    el.dataset.err = name;
    const input = form.querySelector('[name="' + name + '"]');
    input?.parentNode?.appendChild(el);
  }
  el.textContent = msg;
}

function clearFieldErrors(form) {
  form.querySelectorAll('.field-error').forEach((e) => (e.textContent = ''));
}
