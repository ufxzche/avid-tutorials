document.addEventListener('DOMContentLoaded', async () => {
  const slug = new URLSearchParams(location.search).get('slug');
  const root = document.getElementById('course-detail');
  if (!root) return;

  if (!slug) {
    root.innerHTML = '<p class="courses-empty">Kurs tanlanmagan. <a href="index.html">Katalog</a></p>';
    return;
  }

  let me = null;
  try {
    me = await AVID.getMe();
  } catch {
    /* guest */
  }
  const isLoggedIn = !!me?.user;

  try {
    const data = await AVID.getCourse(slug);
    const c = data.course;
    document.title = 'AVID — ' + c.title;

    const thumb = window.AVID_MEDIA?.courseImage(c) || './img/lessons.png';
    const thumbClass =
      window.AVID_MEDIA?.courseImageClass(c) === 'courses-img courses-img--tech'
        ? 'course-detail-thumb courses-img--tech'
        : 'course-detail-thumb';

    root.innerHTML = `
      <div class="course-detail-hero">
        <div>
          <span class="course-badge">${esc(c.programming_language)}</span>
          <span class="course-badge">${levelLabel(c.level)}</span>
          <h1>${esc(c.title)}</h1>
          <p>${esc(c.description)}</p>
          <p class="course-meta"><strong>O'qituvchi:</strong> <a href="instructor.html?id=${c.instructor_id}&name=${encodeURIComponent(c.instructor_name || '')}">${esc(c.instructor_name)}</a></p>
          <p class="course-meta">${c.lesson_count} dars · ${c.duration_minutes} daqiqa</p>
          ${c.enrolled ? `
            <p class="course-progress-label">Jarayon: ${c.progress_percent || 0}%</p>
            <div class="progress-bar"><span style="width:${c.progress_percent || 0}%"></span></div>
          ` : ''}
          <div class="course-actions" id="course-actions"></div>
          <p class="form-feedback" id="course-feedback" hidden></p>
        </div>
        <div>
          <img src="${esc(thumb)}" alt="" class="${thumbClass}">
        </div>
      </div>
      <section class="module-block">
        <h2>Darslar ro'yxati</h2>
        <div id="modules-list"></div>
      </section>`;

    const actions = document.getElementById('course-actions');
    const firstLesson = findFirstAccessibleLesson(data.modules, c.enrolled);

    if (c.enrolled) {
      if (firstLesson?.id) {
        actions.innerHTML = `<a href="lesson.html?id=${firstLesson.id}" class="btn-primary">Davom etish</a>`;
      } else {
        actions.innerHTML =
          '<p class="courses-empty" style="margin:0">Darslar hali qo\'shilmagan. Keyinroq qaytib keling.</p>';
      }
    } else {
      const preview = findPreviewLesson(data.modules);
      let previewHtml = '';
      if (preview?.id) {
        const previewHref = isLoggedIn
          ? `lesson.html?id=${preview.id}`
          : `login.html?next=${encodeURIComponent('lesson.html?id=' + preview.id)}`;
        previewHtml = `<a href="${previewHref}" class="btn-secondary">Demo dars${isLoggedIn ? '' : ' (kirish kerak)'}</a>`;
      }
      actions.innerHTML = `<button class="btn-primary" id="btn-enroll">Kursga yozilish</button>${previewHtml}`;
    }

    document.getElementById('modules-list').innerHTML =
      data.modules.length === 0
        ? '<p class="courses-empty">Darslar ro\'yxati bo\'sh</p>'
        : data.modules
            .map(
              (m) => `
      <div class="module-block">
        <h4>${esc(m.title)}</h4>
        ${(m.lessons || [])
          .map((l) => lessonRowHtml(l, c.enrolled, isLoggedIn))
          .join('') || '<p class="courses-empty">Modulda dars yo\'q</p>'}
      </div>`
            )
            .join('');

    document.getElementById('btn-enroll')?.addEventListener('click', async () => {
      const fb = document.getElementById('course-feedback');
      try {
        await AVID.enroll(c.id);
        location.reload();
      } catch (e) {
        fb.hidden = false;
        fb.textContent = e.message;
        fb.className = 'form-feedback error';
        if (e.status === 401) {
          location.href =
            'login.html?next=' + encodeURIComponent(location.pathname + location.search);
        }
      }
    });
  } catch (e) {
    root.innerHTML = '<p class="courses-empty">' + esc(e.message) + '</p>';
  }
});

function findFirstAccessibleLesson(modules, enrolled) {
  for (const m of modules || []) {
    for (const l of m.lessons || []) {
      if (enrolled || l.is_preview) return l;
    }
  }
  return null;
}

function findPreviewLesson(modules) {
  for (const m of modules || []) {
    for (const l of m.lessons || []) {
      if (l.is_preview) return l;
    }
  }
  return null;
}

function lessonRowHtml(l, enrolled, isLoggedIn) {
  const canOpen = enrolled || l.is_preview;
  const label = esc(l.title) + (l.is_preview ? ' <span class="course-badge">demo</span>' : '');
  if (!canOpen) {
    return `<span class="lesson-link lesson-link--locked" title="Avval kursga yoziling">${label}</span>`;
  }
  const href = isLoggedIn
    ? `lesson.html?id=${l.id}`
    : `login.html?next=${encodeURIComponent('lesson.html?id=' + l.id)}`;
  return `<a class="lesson-link" href="${href}">${label}</a>`;
}

function levelLabel(level) {
  const map = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: "Ilg'or" };
  return map[level] || level;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;');
}
