document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('instructor-page');
  if (!root || !window.AVID) return;

  const params = new URLSearchParams(location.search);
  const instructorId = params.get('id');
  const instructorName = params.get('name') || 'Aziz Juraev';

  try {
    const catalogParams = { sort: 'popular' };
    if (instructorName) {
      catalogParams.instructor = instructorName;
    }
    const { courses } = await AVID.getCatalog(catalogParams);
    let list = courses || [];
    if (instructorId) {
      list = list.filter((c) => String(c.instructor_id) === String(instructorId));
    }
    if (!list.length && courses?.length) {
      list = courses.filter((c) =>
        (c.instructor_name || '').toLowerCase().includes('aziz')
      );
    }

    const profile = list[0] || {};
    const bio =
      profile.instructor_bio ||
      "Dasturlash bo'yicha o'qituvchi. Python, JavaScript, C++ va boshqa tillarni video darslar orqali o'rgataman.";
    const avatar = profile.instructor_avatar;
    const avatarHtml = avatar
      ? `<img class="instructor-avatar" src="${esc(avatar)}" alt="">`
      : `<div class="instructor-avatar instructor-avatar--placeholder" aria-hidden="true">AJ</div>`;
    const name = profile.instructor_name || instructorName;

    root.innerHTML = `
      <div class="instructor-profile">
        ${avatarHtml}
        <div>
          <h1>${esc(name)}</h1>
          <p class="instructor-role">Dasturlash o'qituvchisi</p>
          <p class="instructor-bio">${esc(bio)}</p>
        </div>
      </div>
      <h2>Kurslar</h2>
      <div class="home-courses-row">${list.length ? list.map(courseCard).join('') : '<p class="courses-empty">Kurslar topilmadi. <a href="index.html">Katalog</a></p>'}</div>`;
  } catch (e) {
    root.innerHTML = '<p class="courses-empty">' + esc(e.message) + '</p>';
  }
});

function courseCard(c) {
  return `
    <a href="course.html?slug=${c.slug}" class="courses-card">
      <img class="${courseImgClass(c)}" src="${esc(courseImage(c))}" alt="">
      <div class="courses-body">
        <span class="course-badge">${esc(c.programming_language)}</span>
        <div class="courses-body-title">${esc(c.title)}</div>
        <div class="courses-body-number">${c.lesson_count} dars</div>
        <span class="courses-body-link">Kursga o'tish</span>
      </div>
    </a>`;
}

function courseImage(c) {
  return window.AVID_MEDIA?.courseImage(c) || './img/lessons.png';
}

function courseImgClass(c) {
  return window.AVID_MEDIA?.courseImageClass(c) || 'courses-img';
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}
