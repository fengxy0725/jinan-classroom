(() => {
  'use strict';

  const api = 'https://jinan-classroom-studio.fengxy732.chatgpt.site';
  const builtIn = window.lessons;
  const status = document.getElementById('catalog-status');
  const message = document.getElementById('catalog-message');
  const retry = document.getElementById('catalog-retry');
  window.classroomStudioOrigin = api;
  window.classroomSeries = ['ti-xi-lin-bi', 'yi-zhang-liu-yan-tiao', 'yu-guo-xiao-yuan',
    'g8-sanxia', 'yong-xue', 'shangyang-fangsheng'];

  function isPairList(items) {
    return Array.isArray(items) && items.every(item =>
      item && typeof item.label === 'string' && typeof item.text === 'string');
  }

  function isCourse(course) {
    return course && typeof course.id === 'string' && course.id.length > 0 &&
      ['语文', '历史'].includes(course.subject) && Number.isInteger(course.grade) && course.grade >= 1 && course.grade <= 9 &&
      ['title', 'term', 'summary', 'warmup'].every(key => typeof course[key] === 'string') &&
      (course.unit == null || typeof course.unit === 'string') &&
      isPairList(course.focus) && (course.sessions == null || isPairList(course.sessions)) &&
      course.activity && typeof course.activity.prompt === 'string' && isPairList(course.activity.choices) &&
      Array.isArray(course.quiz) && course.quiz.every(item => item && typeof item.question === 'string' &&
        Array.isArray(item.options) && item.options.every(text => typeof text === 'string') &&
        Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.options.length &&
        typeof item.explanation === 'string');
  }

  function mergePublished(update) {
    if (!update || !Array.isArray(update.courses) || !update.courses.every(isCourse) ||
        !Array.isArray(update.removed) || !update.removed.every(id => typeof id === 'string')) {
      throw new Error('Invalid course catalog');
    }
    const merged = new Map(builtIn.map(course => [course.id, course]));
    for (const course of update.courses) merged.set(course.id, course);
    // An explicit removal takes precedence even if the response repeats an ID.
    for (const id of update.removed) merged.delete(id);
    return [...merged.values()];
  }

  if (location.protocol === 'file:') {
    status.hidden = true;
    window.classroomCatalogReady = Promise.resolve(builtIn);
    return;
  }

  window.lessons = [];
  window.classroomCatalogReady = new Promise(resolve => {
    async function load() {
      retry.disabled = true;
      retry.hidden = true;
      message.textContent = '正在读取已发布课程……';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(api + '/api/public/courses', {
          cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: controller.signal
        });
        if (!response.ok) throw new Error('Course catalog unavailable');
        const catalog = mergePublished(await response.json());
        window.lessons = catalog;
        status.hidden = true;
        resolve(catalog);
      } catch {
        message.textContent = '暂时无法连接课程书架。请检查网络后重试。';
        retry.disabled = false;
        retry.hidden = false;
      } finally {
        clearTimeout(timeout);
      }
    }
    retry.addEventListener('click', load);
    load();
  });

  // Recheck publication status when Back restores a page from the browser's memory.
  window.addEventListener('pageshow', event => {
    if (event.persisted) location.reload();
  });
})();
