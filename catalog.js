(() => {
  'use strict';

  const groups = [
    ['primary-chinese', '小学语文'], ['primary-history', '小学历史启蒙'],
    ['grade7', '七年级语文'], ['grade8', '八年级语文'], ['grade9', '九年级语文'],
    ['junior-history', '初中历史']
  ];
  window.classroomSeries = ['ti-xi-lin-bi', 'yi-zhang-liu-yan-tiao', 'yu-guo-xiao-yuan',
    'g8-sanxia', 'yong-xue', 'shangyang-fangsheng'];
  const status = document.getElementById('catalog-status');
  const message = document.getElementById('catalog-message');
  const retry = document.getElementById('catalog-retry');

  function pairs(items) {
    return Array.isArray(items) && items.every(item => item &&
      typeof item.label === 'string' && typeof item.text === 'string');
  }
  function isCourse(course) {
    return course && typeof course.id === 'string' && course.id.trim() &&
      ['语文', '历史'].includes(course.subject) && Number.isInteger(course.grade) && course.grade >= 1 && course.grade <= 9 &&
      ['title', 'term', 'summary', 'warmup'].every(key => typeof course[key] === 'string') &&
      (course.unit == null || typeof course.unit === 'string') &&
      pairs(course.focus) && (course.sessions == null || pairs(course.sessions)) &&
      course.activity && typeof course.activity.prompt === 'string' && pairs(course.activity.choices) &&
      Array.isArray(course.quiz) && course.quiz.every(item => item && typeof item.question === 'string' &&
        Array.isArray(item.options) && item.options.every(text => typeof text === 'string') &&
        Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.options.length &&
        typeof item.explanation === 'string');
  }

  if (location.protocol === 'file:') {
    // Browsers restrict JSON requests on file://. Link to the same lesson, without an obsolete local copy.
    const published = new URL('https://fengxy0725.github.io/jinan-classroom/');
    if (location.pathname.endsWith('/lesson.html')) {
      published.pathname += 'lesson.html';
      const id = new URLSearchParams(location.search).get('id');
      if (id) published.searchParams.set('id', id);
    }
    published.hash = location.hash;
    const link = document.createElement('a');
    link.href = published.href;
    link.textContent = '打开公开课堂';
    message.textContent = '双击 HTML 文件无法读取课程。请打开公开课堂；在电脑上预览，请按项目说明启动本地 HTTP 服务。';
    status.append(' ', link);
    window.classroomCatalogReady = Promise.resolve(null);
    return;
  }

  window.classroomCatalogReady = new Promise(resolve => {
    let busy = false;
    async function load() {
      if (busy) return;
      busy = true;
      retry.hidden = true;
      retry.disabled = true;
      message.textContent = '正在读取课程书架……';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      let failedGroup = '';
      try {
        const batches = await Promise.all(groups.map(async ([name, label]) => {
          try {
            const response = await fetch('./courses/' + name + '.json', {
              mode: 'same-origin', credentials: 'omit', redirect: 'error', cache: 'no-cache',
              referrerPolicy: 'no-referrer', signal: controller.signal
            });
            if (!response.ok) throw new Error();
            const rows = await response.json();
            if (!Array.isArray(rows) || !rows.every(isCourse)) throw new Error();
            return rows;
          } catch (error) {
            if (!controller.signal.aborted && !failedGroup) failedGroup = label;
            throw error;
          }
        }));
        const lessons = batches.flat();
        if (new Set(lessons.map(course => course.id)).size !== lessons.length) throw new Error();
        status.hidden = true;
        retry.removeEventListener('click', load);
        resolve(lessons);
      } catch {
        controller.abort();
        message.textContent = (failedGroup ? '暂时无法读取“' + failedGroup + '”的课程。' : '暂时无法读取完整的课程书架。') + '请检查网络后重试；如果老师刚刚提交了修改，请稍后再试。';
        retry.hidden = false;
        retry.disabled = false;
      } finally {
        clearTimeout(timeout);
        busy = false;
      }
    }
    retry.addEventListener('click', load);
    load();
  });

  // Revalidate after Back/Forward, so withdrawn lessons do not reappear from an old page snapshot.
  window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
})();
