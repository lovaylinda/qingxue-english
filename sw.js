/* 轻学英语 Service Worker
   策略：
   - HTML：network-first（先拿新版，断网才用缓存）→ 不会出现"改了没生效"
   - 静态资源（js/png/webmanifest）：stale-while-revalidate → 秒开 + 后台更新
   - 跨域（Cloudflare Worker 对话/语音）：不拦截，直接放行
   升级方式：改 CACHE 版本号即可清掉旧缓存。
   注意：words.json 走的是 stale-while-revalidate，改了词库文件必须同时把 CACHE 版本号 +1，
        否则用户第一次打开拿到的还是旧词库（要第二次打开才更新）。 */
var CACHE = 'qingxue-v16';
var PRECACHE = ['./', './index.html', './words.json', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './englishpod_clean.js'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(PRECACHE.map(function(u){
        return c.add(new Request(u, {cache:'reload'})).catch(function(){});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k !== CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url;
  try{ url = new URL(req.url); }catch(err){ return; }
  if(url.origin !== location.origin) return;   // 跨域（Worker / 外链）一律不拦截

  var isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') >= 0;

  if(isHTML){
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
        return res;
      }).catch(function(){
        return caches.match(req).then(function(hit){ return hit || caches.match('./index.html'); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function(hit){
      var net = fetch(req).then(function(res){
        if(res && res.status === 200){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
        }
        return res;
      }).catch(function(){ return hit; });
      return hit || net;
    })
  );
});
