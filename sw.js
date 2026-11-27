/* 手機推播通知的背景程式：收到通知時，向 Apps Script 讀取最新內容再顯示 */
self.addEventListener("install", function(){ self.skipWaiting(); });
self.addEventListener("activate", function(e){ e.waitUntil(self.clients.claim()); });

self.addEventListener("push", function(e){
  e.waitUntil((async function(){
    var p = new URL(self.location.href).searchParams;
    var title = "連續假日出勤回報", body = "有單位送出新回報，點開查看";
    try {
      var g = p.get("g"), t = p.get("t");
      if (g && t){
        var ctl = new AbortController(), timer = setTimeout(function(){ ctl.abort(); }, 5000);
        var r = await fetch(g + "?pushmsg=" + encodeURIComponent(t) + "&_=" + Date.now(), { cache: "no-store", signal: ctl.signal });
        clearTimeout(timer);
        var j = await r.json();
        if (j && j.body){ body = j.body; if (j.title) title = j.title; }
      }
    } catch (err) {}
    await self.registration.showNotification(title, { body: body, icon: "icon-192.png", badge: "icon-192.png", tag: "att-new", renotify: true });
  })());
});

self.addEventListener("notificationclick", function(e){
  e.notification.close();
  var u = new URL(self.location.href).searchParams.get("u") || "./";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(list){
    for (var i = 0; i < list.length; i++){ if ("focus" in list[i]) return list[i].focus(); }
    return self.clients.openWindow(u);
  }));
});
