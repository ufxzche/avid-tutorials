document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('instructor-dashboard');
  if (!root) return;
  try {
    const d = await AVID.instructorDashboard();
    const { courses } = await AVID.instructorCourses();

    root.innerHTML = `
      <h1>O'qituvchi paneli</h1>
      <div class="stat-cards stat-cards--compact">
        <div class="stat-card"><strong>${d.courses}</strong> Kurslar</div>
        <div class="stat-card"><strong>${d.students}</strong> Talabalar</div>
        <div class="stat-card"><strong>${d.completions}</strong> Tugatishlar</div>
        <div class="stat-card"><strong>${d.watch_hours}</strong> Soat video</div>
      </div>
      <div style="margin:20px 0;display:flex;gap:12px;flex-wrap:wrap">
        <a href="instructor-course-new.html" class="btn-primary">+ Yangi kurs</a>
      </div>
      <h2>Mening kurslarim</h2>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Nomi</th><th>Holat</th><th>Talabalar</th><th>Darslar</th><th></th>
            </tr>
          </thead>
          <tbody>
            ${
              courses.length
                ? courses
                    .map(
                      (c) => `<tr>
              <td>${esc(c.title)}</td>
              <td>${esc(c.status)}</td>
              <td>${c.enrollment_count}</td>
              <td>${c.lesson_count}</td>
              <td>
                <a href="instructor-course-manage.html?id=${c.id}">Boshqarish</a>
                · ${
                  c.status === 'published'
                    ? `<a href="course.html?slug=${c.slug}" target="_blank" rel="noopener">Ko'rish</a>`
                    : '<span title="Avval nashr qiling">Ko\'rish</span>'
                }
              </td>
            </tr>`
                    )
                    .join('')
                : '<tr><td colspan="5" class="courses-empty">Hali kurs yo\'q. <a href="instructor-course-new.html">Yangi kurs</a></td></tr>'
            }
          </tbody>
        </table>
      </div>
      <h3>Mashhur kurslar</h3>
      <ul>${(d.popular || []).map((p) => `<li>${esc(p.title)} — ${p.enrollment_count} talaba</li>`).join('') || '<li>—</li>'}</ul>`;
  } catch (e) {
    const msg =
      e.status === 401
        ? 'Kirish kerak.'
        : e.status === 403
          ? 'Faqat o\'qituvchi uchun.'
          : e.message;
    root.innerHTML =
      '<p class="courses-empty">' + esc(msg) + ' <a href="login.html">Kirish</a></p>';
  }
});

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}
