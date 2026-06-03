document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('admin-dashboard');
  if (!root) return;

  try {
    const [d, usersRes, coursesRes, commentsRes, contactRes, blogRes] = await Promise.all([
      AVID.adminDashboard(),
      AVID.adminUsers(),
      AVID.adminCourses(),
      AVID.adminComments(),
      AVID.adminContactMessages(),
      AVID.adminBlogPosts(),
    ]);

    const instructors = usersRes.users.filter((u) => u.role === 'instructor').length;
    const students = usersRes.users.filter((u) => u.role === 'student').length;

    root.innerHTML = `
      <h1>Admin panel</h1>
      <p class="dashboard-lead">Platforma boshqaruvi — foydalanuvchilar, kurslar, blog, izohlar</p>
      <div class="stat-cards stat-cards--compact">
        <div class="stat-card"><strong>${d.users}</strong> Foydalanuvchilar</div>
        <div class="stat-card"><strong>${d.courses}</strong> Kurslar</div>
        <div class="stat-card"><strong>${d.lessons ?? '—'}</strong> Darslar</div>
        <div class="stat-card"><strong>${d.comments ?? 0}</strong> Izohlar</div>
        <div class="stat-card"><strong>${d.enrollments}</strong> Yozilishlar</div>
        <div class="stat-card"><strong>${d.blog_posts ?? 0}</strong> Blog maqolalari</div>
      </div>
      <p class="admin-meta">${instructors} o'qituvchi · ${students} talaba (ko'rsatilgan ro'yxatda)</p>

      <nav class="admin-tabs" aria-label="Bo'limlar">
        <button type="button" class="admin-tab active" data-panel="users">Foydalanuvchilar</button>
        <button type="button" class="admin-tab" data-panel="courses">Kurslar</button>
        <button type="button" class="admin-tab" data-panel="blog">Blog</button>
        <button type="button" class="admin-tab" data-panel="comments">Izohlar</button>
        <button type="button" class="admin-tab" data-panel="contact">Aloqa</button>
      </nav>

      <section class="admin-panel active" id="panel-users">
        <h2>Foydalanuvchilar</h2>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>ID</th><th>Ism</th><th>Email</th><th>Rol</th><th>Holat</th><th></th></tr></thead>
            <tbody id="admin-users-body"></tbody>
          </table>
        </div>
      </section>

      <section class="admin-panel" id="panel-courses" hidden>
        <h2>Barcha kurslar</h2>
        <p class="admin-hint">Nashr qilish, yashirish (arxiv) yoki butunlay o'chirish.</p>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Kurs</th><th>O'qituvchi</th><th>Holat</th><th>Talaba</th><th></th>
              </tr>
            </thead>
            <tbody id="admin-courses-body"></tbody>
          </table>
        </div>
      </section>

      <section class="admin-panel" id="panel-blog" hidden>
        <div id="blog-list-view">
          <div class="admin-panel-head">
            <h2>Blog</h2>
            <button type="button" class="btn-primary" id="blog-btn-create">+ Yangi maqola</button>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table admin-table--blog">
              <thead>
                <tr><th>Maqola</th><th>Sana</th><th>Amallar</th></tr>
              </thead>
              <tbody id="admin-blog-body"></tbody>
            </table>
          </div>
        </div>
        <div id="blog-editor-view" class="admin-blog-editor" hidden>
          <button type="button" class="admin-back-link" id="blog-btn-back">← Maqolalar ro'yxati</button>
          <form id="admin-blog-form" class="admin-blog-form">
            <h3 id="admin-blog-form-title">Yangi maqola</h3>
            <input type="hidden" id="blog-edit-id" value="">
            <div class="admin-form-row">
              <div class="admin-form-field admin-form-field--grow">
                <label for="blog-title">Sarlavha</label>
                <input type="text" id="blog-title" required minlength="3" maxlength="200">
              </div>
              <div class="admin-form-field">
                <label for="blog-published">Sana</label>
                <input type="date" id="blog-published">
              </div>
            </div>
            <div class="admin-form-field">
              <label for="blog-excerpt">Qisqa tavsif (katalog va bosh sahifada)</label>
              <textarea id="blog-excerpt" required minlength="10" maxlength="500" rows="2"></textarea>
            </div>
            <div class="admin-form-field">
              <label for="blog-content">Maqola matni</label>
              <textarea id="blog-content" required minlength="20" rows="12" class="admin-blog-content-input"></textarea>
            </div>
            <details class="admin-blog-more">
              <summary>Qo'shimcha sozlamalar</summary>
              <div class="admin-form-field">
                <label for="blog-image">Muqova rasmi</label>
                <select id="blog-image">
                  <option value="./img/20945802.jpg">20945802.jpg</option>
                  <option value="./img/bg.jpg">bg.jpg</option>
                  <option value="./img/lessons.png">lessons.png</option>
                  <option value="./img/logo.png">logo.png</option>
                </select>
              </div>
              <div class="admin-form-field">
                <label for="blog-slug">Havola (slug)</label>
                <input type="text" id="blog-slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="Bo'sh qoldirilsa — sarlavhadan yaratiladi">
              </div>
            </details>
            <div class="admin-blog-form-actions">
              <button type="submit" class="btn-primary">Saqlash</button>
              <button type="button" class="btn-secondary" id="blog-btn-cancel">Bekor qilish</button>
            </div>
            <p class="form-feedback" id="blog-form-feedback"></p>
          </form>
        </div>
      </section>

      <section class="admin-panel" id="panel-comments" hidden>
        <h2>Izohlar (darslar ostida)</h2>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr><th>Foydalanuvchi</th><th>Kurs / dars</th><th>Matn</th><th></th></tr>
            </thead>
            <tbody id="admin-comments-body"></tbody>
          </table>
        </div>
      </section>

      <section class="admin-panel" id="panel-contact" hidden>
        <h2>Aloqa xabarlari</h2>
        <ul id="admin-contact-list" class="admin-contact-list"></ul>
      </section>`;

    bindTabs(root);

    const tbody = document.getElementById('admin-users-body');
    usersRes.users.forEach((u) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${esc(u.name)}</td>
        <td>${esc(u.email)}</td>
        <td><span class="course-badge">${esc(u.role)}</span></td>
        <td>${u.is_blocked ? 'Bloklangan' : 'Faol'}</td>
        <td class="admin-actions">
          <button type="button" class="btn-secondary admin-block-btn" data-id="${u.id}" data-blocked="${u.is_blocked ? '0' : '1'}">${u.is_blocked ? 'Blokdan chiqarish' : 'Bloklash'}</button>
        </td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.admin-block-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const blocked = btn.dataset.blocked === '1';
        if (!confirm(blocked ? 'Foydalanuvchini bloklash?' : 'Blokdan chiqarish?')) return;
        try {
          await AVID.adminBlockUser(id, blocked);
          location.reload();
        } catch (e) {
          alert(e.message);
        }
      });
    });

    const coursesBody = document.getElementById('admin-courses-body');
    const courses = coursesRes.courses || [];
    if (!courses.length) {
      coursesBody.innerHTML = '<tr><td colspan="5" class="courses-empty">Kurs yo\'q</td></tr>';
    } else {
      courses.forEach((c) => {
        const tr = document.createElement('tr');
        const statusLabel = statusUz(c.status);
        tr.innerHTML = `
          <td>
            <strong>${esc(c.title)}</strong>
            ${c.status === 'published' ? `<br><a href="course.html?slug=${esc(c.slug)}" target="_blank" rel="noopener">Sahifani ko'rish</a>` : ''}
          </td>
          <td>${esc(c.instructor_name)}</td>
          <td><span class="admin-status admin-status--${esc(c.status)}">${esc(statusLabel)}</span></td>
          <td>${c.enrollment_count ?? 0}</td>
          <td class="admin-actions admin-actions--stack">
            ${c.status !== 'published' ? `<button type="button" class="btn-secondary admin-course-status" data-id="${c.id}" data-status="published">Nashr</button>` : ''}
            ${c.status === 'published' ? `<button type="button" class="btn-secondary admin-course-status" data-id="${c.id}" data-status="archived">Yashirish</button>` : ''}
            ${c.status === 'archived' ? `<button type="button" class="btn-secondary admin-course-status" data-id="${c.id}" data-status="published">Qayta nashr</button>` : ''}
            <button type="button" class="btn-secondary admin-course-delete" data-id="${c.id}">O'chirish</button>
          </td>`;
        coursesBody.appendChild(tr);
      });
    }

    coursesBody.querySelectorAll('.admin-course-status').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const status = btn.dataset.status;
        try {
          await AVID.adminUpdateCourseStatus(Number(btn.dataset.id), status);
          location.reload();
        } catch (e) {
          alert(e.message);
        }
      });
    });

    coursesBody.querySelectorAll('.admin-course-delete').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Kurs butunlay o\'chirilsinmi? Bu qaytarib bo\'lmaydi.')) return;
        try {
          await AVID.adminDeleteCourse(Number(btn.dataset.id));
          location.reload();
        } catch (e) {
          alert(e.message);
        }
      });
    });

    const commentsBody = document.getElementById('admin-comments-body');
    const comments = commentsRes.comments || [];
    if (!comments.length) {
      commentsBody.innerHTML = '<tr><td colspan="4" class="courses-empty">Izoh yo\'q</td></tr>';
    } else {
      comments.forEach((cm) => {
        const tr = document.createElement('tr');
        const preview = cm.body.length > 120 ? cm.body.slice(0, 120) + '…' : cm.body;
        tr.innerHTML = `
          <td>${esc(cm.user_name)}<br><small>${esc(cm.user_email)}</small></td>
          <td>${esc(cm.course_title)}<br><a href="lesson.html?id=${cm.lesson_id}">${esc(cm.lesson_title)}</a></td>
          <td>${esc(preview)}</td>
          <td class="admin-actions">
            <button type="button" class="btn-secondary admin-comment-delete" data-id="${cm.id}">O'chirish</button>
          </td>`;
        commentsBody.appendChild(tr);
      });
    }

    commentsBody.querySelectorAll('.admin-comment-delete').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Izohni o\'chirish?')) return;
        try {
          await AVID.adminDeleteComment(Number(btn.dataset.id));
          location.reload();
        } catch (e) {
          alert(e.message);
        }
      });
    });

    setupBlogPanel(blogRes.posts || []);

    const contactList = document.getElementById('admin-contact-list');
    if (!contactRes.messages.length) {
      contactList.innerHTML = '<li class="courses-empty">Xabar yo\'q</li>';
    } else {
      contactList.innerHTML = contactRes.messages
        .map(
          (m) =>
            `<li><strong>${esc(m.name)}</strong> &lt;${esc(m.email)}&gt;<br>${esc(m.message)}<br><small>${esc(m.created_at)}</small></li>`
        )
        .join('');
    }
  } catch (e) {
    const msg =
      e.status === 401
        ? 'Kirish kerak.'
        : e.status === 403
          ? 'Faqat admin uchun.'
          : e.message;
    root.innerHTML =
      '<p class="courses-empty">' + esc(msg) + ' <a href="login.html">Kirish</a></p>';
  }
});

function setupBlogPanel(posts) {
  const listView = document.getElementById('blog-list-view');
  const editorView = document.getElementById('blog-editor-view');
  const tbody = document.getElementById('admin-blog-body');
  const form = document.getElementById('admin-blog-form');
  if (!listView || !editorView || !tbody || !form) return;

  const BLOG_IMAGE_OPTIONS = [
    ['./img/20945802.jpg', '20945802.jpg'],
    ['./img/bg.jpg', 'bg.jpg'],
    ['./img/lessons.png', 'lessons.png'],
    ['./img/logo.png', 'logo.png'],
  ];

  function resetImageSelect() {
    const sel = document.getElementById('blog-image');
    sel.innerHTML = BLOG_IMAGE_OPTIONS.map(
      ([val, label]) => `<option value="${val}">${label}</option>`
    ).join('');
  }

  function showList() {
    listView.hidden = false;
    editorView.hidden = true;
  }

  function showEditor() {
    listView.hidden = true;
    editorView.hidden = false;
    document.querySelector('.admin-blog-more')?.removeAttribute('open');
  }

  function excerptPreview(text) {
    const t = String(text || '').trim();
    if (t.length <= 72) return t;
    return t.slice(0, 72) + '…';
  }

  function renderList() {
    if (!posts.length) {
      tbody.innerHTML =
        '<tr><td colspan="3" class="courses-empty">Hali maqola yo\'q. «+ Yangi maqola» tugmasini bosing.</td></tr>';
      return;
    }
    tbody.innerHTML = posts
      .map(
        (p) => `
      <tr>
        <td class="admin-blog-title-cell">
          <strong>${esc(p.title)}</strong>
          <span class="admin-blog-excerpt">${esc(excerptPreview(p.excerpt))}</span>
        </td>
        <td class="admin-blog-date-cell">${esc(formatBlogDate(p.published_at))}</td>
        <td>
          <div class="admin-action-row">
            <a href="blog-post.html?slug=${esc(p.slug)}" class="admin-link-btn" target="_blank" rel="noopener">Sayt</a>
            <button type="button" class="admin-link-btn admin-blog-edit" data-id="${p.id}">Tahrir</button>
            <button type="button" class="admin-link-btn admin-link-btn--danger admin-blog-delete" data-id="${p.id}">O'chirish</button>
          </div>
        </td>
      </tr>`
      )
      .join('');

    tbody.querySelectorAll('.admin-blog-edit').forEach((btn) => {
      btn.addEventListener('click', () => loadBlogForEdit(Number(btn.dataset.id)));
    });
    tbody.querySelectorAll('.admin-blog-delete').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Maqolani o\'chirish?')) return;
        try {
          await AVID.adminDeleteBlogPost(Number(btn.dataset.id));
          location.reload();
        } catch (e) {
          alert(e.message);
        }
      });
    });
  }

  function setBlogImage(url) {
    const sel = document.getElementById('blog-image');
    const val = url || './img/20945802.jpg';
    resetImageSelect();
    if (!BLOG_IMAGE_OPTIONS.some(([v]) => v === val)) {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val.replace(/^\.\/img\//, '') || val;
      sel.appendChild(opt);
    }
    sel.value = val;
  }

  function clearBlogForm() {
    document.getElementById('blog-edit-id').value = '';
    document.getElementById('admin-blog-form-title').textContent = 'Yangi maqola';
    form.reset();
    resetImageSelect();
    document.getElementById('blog-image').value = './img/20945802.jpg';
    document.getElementById('blog-slug').value = '';
    document.getElementById('blog-published').value = toDateInput(new Date());
    const fb = document.getElementById('blog-form-feedback');
    if (fb) {
      fb.textContent = '';
      fb.className = 'form-feedback';
    }
  }

  async function loadBlogForEdit(id) {
    try {
      const { post } = await AVID.adminBlogPost(id);
      showEditor();
      document.getElementById('blog-edit-id').value = post.id;
      document.getElementById('admin-blog-form-title').textContent = 'Maqolani tahrirlash';
      document.getElementById('blog-title').value = post.title;
      document.getElementById('blog-slug').value = post.slug;
      document.getElementById('blog-excerpt').value = post.excerpt;
      document.getElementById('blog-content').value = post.content;
      setBlogImage(post.image_url);
      document.getElementById('blog-published').value = toDateInput(post.published_at);
    } catch (e) {
      alert(e.message);
    }
  }

  document.getElementById('blog-btn-create')?.addEventListener('click', () => {
    clearBlogForm();
    showEditor();
  });
  document.getElementById('blog-btn-back')?.addEventListener('click', showList);
  document.getElementById('blog-btn-cancel')?.addEventListener('click', showList);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fb = document.getElementById('blog-form-feedback');
    const editId = document.getElementById('blog-edit-id').value;
    const body = {
      title: document.getElementById('blog-title').value.trim(),
      excerpt: document.getElementById('blog-excerpt').value.trim(),
      content: document.getElementById('blog-content').value.trim(),
      image_url: document.getElementById('blog-image').value,
    };
    const slug = document.getElementById('blog-slug').value.trim();
    if (slug) body.slug = slug;
    const pub = document.getElementById('blog-published').value;
    if (pub) body.published_at = new Date(pub + 'T12:00:00').toISOString();

    try {
      if (editId) {
        await AVID.adminUpdateBlogPost(Number(editId), body);
      } else {
        await AVID.adminCreateBlogPost(body);
      }
      location.reload();
    } catch (err) {
      if (fb) {
        fb.textContent = err.message;
        fb.className = 'form-feedback error';
      }
    }
  });

  showList();
  renderList();
}

function formatBlogDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('uz-UZ');
  } catch {
    return String(iso);
  }
}

function toDateInput(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function bindTabs(root) {
  root.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      root.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
      root.querySelectorAll('.admin-panel').forEach((p) => {
        p.hidden = true;
        p.classList.remove('active');
      });
      tab.classList.add('active');
      const panel = document.getElementById('panel-' + tab.dataset.panel);
      if (panel) {
        panel.hidden = false;
        panel.classList.add('active');
      }
    });
  });
}

function statusUz(status) {
  return { draft: 'Qoralama', published: 'Nashrda', archived: 'Yashirin' }[status] || status;
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}
