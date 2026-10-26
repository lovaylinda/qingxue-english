/* 空转 Service Worker：站点注册了 ./sw.js 但文件缺失会导致 404 报错。
   本文件只做安装/激活，不缓存任何内容、不拦截任何请求（个人学习自用，本地静态站）。 */
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
