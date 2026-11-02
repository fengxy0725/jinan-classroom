(async () => {
  'use strict';
  // Record page opens on the published classroom only. In-class answers and
  // drafts stay on the lesson page; transitions within the shelf are not visits.
  if (location.origin !== 'https://fengxy0725.github.io' || !location.pathname.startsWith('/jinan-classroom/')) return;
  await window.classroomCatalogReady;
  const isLesson = location.pathname.endsWith('/lesson.html');
  const lessonId = new URLSearchParams(location.search).get('id');
  const lesson = isLesson && window.lessons.find(course => course.id === lessonId);
  if (isLesson && !lesson) return;
  const body = new URLSearchParams({page: lesson ? lesson.id : 'home', title: lesson ? lesson.title : '公开课首页'});
  fetch('https://jinan-classroom-studio.fengxy732.chatgpt.site/api/visit', {
    method: 'POST', body, credentials: 'omit', keepalive: true, referrerPolicy: 'no-referrer'
  }).catch(() => {}); // Offline reading and blocked analytics must never interrupt a lesson.
})();
