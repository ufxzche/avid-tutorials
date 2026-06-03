(function () {
  const BASE = '/api';

  async function request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }
    const res = await fetch(BASE + path, {
      method: options.method || 'GET',
      credentials: 'include',
      headers,
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const firstField =
        data.errors && typeof data.errors === 'object'
          ? Object.values(data.errors).flat()[0]
          : null;
      const err = new Error(data.error || firstField || data.message || 'Xato');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  window.AVID = {
    request,
    getMe: async () => {
      try {
        return await request('/auth/me');
      } catch (e) {
        if (e.status === 401) return null;
        throw e;
      }
    },
    register: (body) => request('/auth/register', { method: 'POST', body }),
    login: (body) => request('/auth/login', { method: 'POST', body }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    updateProfile: (body) => request('/auth/profile', { method: 'PUT', body }),
    updatePassword: (body) => request('/auth/password', { method: 'PUT', body }),
    uploadAvatar: (file) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return request('/auth/avatar', { method: 'POST', body: fd });
    },
    forgotPassword: (body) => request('/auth/forgot-password', { method: 'POST', body }),
    resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body }),

    getStats: () => request('/catalog/stats'),
    getCategories: () => request('/catalog/categories'),
    getCatalog: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request('/catalog' + (q ? '?' + q : ''));
    },
    getCourse: (slug) => request('/catalog/' + slug),
    enroll: (courseId) => request('/student/enroll/' + courseId, { method: 'POST' }),
    toggleFavorite: (courseId, add) =>
      request('/student/favorites/' + courseId, { method: add ? 'POST' : 'DELETE' }),
    postReview: (courseId, body) =>
      request('/student/reviews/' + courseId, { method: 'POST', body }),
    getLesson: (id) => request('/student/lesson/' + id),
    saveProgress: (lessonId, body) =>
      request('/student/lesson/' + lessonId + '/progress', { method: 'POST', body }),
    postComment: (lessonId, body) =>
      request('/student/lesson/' + lessonId + '/comments', { method: 'POST', body }),
    studentDashboard: () => request('/student/dashboard'),
    getEnrollments: () => request('/student/enrollments'),
    getNotifications: () => request('/student/notifications'),
    markNotificationRead: (id) =>
      request('/student/notifications/' + id + '/read', { method: 'POST' }),
    getCertificates: () => request('/student/certificates'),
    sendContact: (body) => request('/contact', { method: 'POST', body }),

    instructorDashboard: () => request('/instructor/dashboard'),
    instructorCourses: () => request('/instructor/courses'),
    getInstructorCourse: (id) => request('/instructor/courses/' + id),
    getInstructorCourseStats: (id) => request('/instructor/courses/' + id + '/stats'),
    createCourse: (body) => request('/instructor/courses', { method: 'POST', body }),
    updateCourse: (id, body) => request('/instructor/courses/' + id, { method: 'PUT', body }),
    deleteCourse: (id) => request('/instructor/courses/' + id, { method: 'DELETE' }),
    addModule: (courseId, title) =>
      request('/instructor/courses/' + courseId + '/modules', { method: 'POST', body: { title } }),
    updateModule: (id, body) => request('/instructor/modules/' + id, { method: 'PUT', body }),
    deleteModule: (id) => request('/instructor/modules/' + id, { method: 'DELETE' }),
    addLesson: (courseId, body) =>
      request('/instructor/courses/' + courseId + '/lessons', { method: 'POST', body }),
    updateLesson: (id, body) => request('/instructor/lessons/' + id, { method: 'PUT', body }),
    deleteLesson: (id) => request('/instructor/lessons/' + id, { method: 'DELETE' }),
    uploadLessonVideo: (lessonId, file, duration_seconds) => {
      const fd = new FormData();
      fd.append('video', file);
      if (duration_seconds != null) fd.append('duration_seconds', String(duration_seconds));
      return request('/instructor/lessons/' + lessonId + '/video', { method: 'POST', body: fd });
    },
    uploadLessonMaterial: (lessonId, file, title) => {
      const fd = new FormData();
      fd.append('file', file);
      if (title) fd.append('title', title);
      return request('/instructor/lessons/' + lessonId + '/materials', { method: 'POST', body: fd });
    },
    deleteLessonMaterial: (id) => request('/instructor/materials/' + id, { method: 'DELETE' }),
    getInstructorLessonQuiz: (lessonId) => request('/instructor/lessons/' + lessonId + '/quiz'),
    saveLessonQuiz: (lessonId, body) =>
      request('/instructor/lessons/' + lessonId + '/quiz', { method: 'POST', body }),

    adminDashboard: () => request('/admin/dashboard'),
    adminUsers: () => request('/admin/users'),
    adminBlockUser: (id, blocked) =>
      request('/admin/users/' + id + '/block', { method: 'PATCH', body: { blocked } }),
    adminCourses: () => request('/admin/courses'),
    adminUpdateCourseStatus: (id, status) =>
      request('/admin/courses/' + id + '/status', { method: 'PATCH', body: { status } }),
    adminDeleteCourse: (id) => request('/admin/courses/' + id, { method: 'DELETE' }),
    adminComments: () => request('/admin/comments'),
    adminDeleteComment: (id) => request('/admin/comments/' + id, { method: 'DELETE' }),
    adminContactMessages: () => request('/admin/contact-messages'),
    adminBlogPosts: () => request('/admin/blog'),
    adminBlogPost: (id) => request('/admin/blog/' + id),
    adminCreateBlogPost: (body) => request('/admin/blog', { method: 'POST', body }),
    adminUpdateBlogPost: (id, body) => request('/admin/blog/' + id, { method: 'PUT', body }),
    adminDeleteBlogPost: (id) => request('/admin/blog/' + id, { method: 'DELETE' }),
    getBlogPosts: () => request('/blog'),
    getBlogPost: (slug) => request('/blog/' + slug),

    getLessonQuiz: (lessonId) => request('/student/quiz/lesson/' + lessonId),
    submitQuiz: (quizId, body) =>
      request('/student/quiz/' + quizId + '/submit', { method: 'POST', body }),
  };
})();
