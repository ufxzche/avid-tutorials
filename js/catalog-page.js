document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('courses-grid');
  const search = document.getElementById('course-search');
  const lang = document.getElementById('filter-lang');
  const level = document.getElementById('filter-level');
  const sort = document.getElementById('filter-sort');

  if (!grid || !window.AVID) return;

  try {
    const { categories } = await AVID.getCategories();
    if (lang && categories) {
      categories.forEach((c) => {
        const o = document.createElement('option');
        o.value = c.slug;
        o.textContent = c.name;
        lang.appendChild(o);
      });
    }
  } catch {
    /* ignore */
  }

  async function load() {
    grid.innerHTML = '<p class="courses-loading">Yuklanmoqda...</p>';
    try {
      const params = {
        q: search?.value?.trim() || '',
        lang: lang?.value || '',
        level: level?.value || '',
        sort: sort?.value || 'popular',
      };
      const { courses } = await AVID.getCatalog(params);
      if (!courses.length) {
        grid.innerHTML = '<p class="courses-empty">Kurs topilmadi</p>';
        return;
      }
      grid.innerHTML = courses
        .map(
          (c) => `
        <a href="course.html?slug=${c.slug}" class="courses-card">
          <img class="${courseImgClass(c)}" src="${esc(courseImage(c))}" alt="">
          <div class="courses-body">
            <span class="course-badge">${esc(c.programming_language)}</span>
            <span class="course-badge">${levelLabel(c.level)}</span>
            <div class="courses-body-title">${esc(c.title)}</div>
            <div class="courses-body-number">${c.lesson_count} dars · ${esc(c.instructor_name)}</div>
            <span class="courses-body-link">Kursni ochish</span>
          </div>
        </a>`
        )
        .join('');
    } catch {
      grid.innerHTML =
        '<p class="courses-empty">Kurslar yuklanmadi. Server ishlayotganini tekshiring.</p>';
    }
  }

  let t;
  [search, lang, level, sort].forEach((el) => {
    el?.addEventListener(el === search ? 'input' : 'change', () => {
      clearTimeout(t);
      t = setTimeout(load, search === el ? 300 : 0);
    });
  });
  load();

  try {
    const stats = await AVID.getStats();
    document.querySelectorAll('[data-stat]').forEach((el) => {
      const k = el.dataset.stat;
      if (stats[k] != null) el.textContent = stats[k];
    });
  } catch {
    /* static fallback */
  }
});

function levelLabel(level) {
  const map = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: "Ilg'or" };
  return map[level] || level;
}

function courseImage(c) {
  return window.AVID_MEDIA?.courseImage(c) || './img/lessons.png';
}

function courseImgClass(c) {
  return window.AVID_MEDIA?.courseImageClass(c) || 'courses-img';
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}
