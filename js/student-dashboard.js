document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('student-dashboard');
  if (!root) return;

  try {
    const d = await AVID.studentDashboard();
    let enrollments = [];
    try {
      const en = await AVID.getEnrollments();
      enrollments = en.enrollments || [];
    } catch (e) {
      root.innerHTML =
        '<p class="courses-empty">' +
        esc(e.status === 401 ? 'Kirish kerak.' : e.message) +
        ' <a href="login.html">Kirish</a></p>';
      return;
    }

    root.innerHTML = `
      <h1>Mening o'quvim</h1>
      <p class="dashboard-lead">Kurslaringiz va o'rganish jarayoni</p>
      <div class="stat-cards stat-cards--compact">
        <div class="stat-card"><strong>${d.enrollments}</strong> Faol kurslar</div>
        <div class="stat-card"><strong>${d.completed}</strong> Tugatilgan</div>
      </div>
      <h2>Kurslarim</h2>
      <div class="courses-card-container dashboard-courses">${enrollments
        .map(
          (e) => `
        <a href="course.html?slug=${e.slug}" class="courses-card courses-card--progress">
          <img class="courses-img" src="${esc(e.icon_url || e.thumbnail_url || './img/lessons.png')}" alt="">
          <div class="courses-body">
            <span class="course-badge">${esc(e.programming_language)}</span>
            <div class="courses-body-title">${esc(e.title)}</div>
            <div class="progress-bar"><span style="width:${e.progress_percent}%"></span></div>
            <div class="courses-body-number">${e.progress_percent}% · ${e.lesson_count || '—'} dars</div>
            <span class="courses-body-link">Davom etish</span>
          </div>
        </a>`
        )
        .join('') || '<p class="courses-empty">Hali kurs yo\'q. <a href="index.html">Katalogdan tanlang</a></p>'}</div>`;
  } catch (e) {
    const msg =
      e.status === 401
        ? 'Kirish kerak.'
        : e.status === 403
          ? 'Bu sahifa faqat talabalar uchun.'
          : e.message;
    root.innerHTML =
      '<p class="courses-empty">' + esc(msg) + ' <a href="login.html">Kirish</a></p>';
  }
});

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}
