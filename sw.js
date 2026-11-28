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
        // 很多支手機同時收到通知：每支隨機等 0～2.5 秒再讀，避免同時擠進 Apps Script（同時最多處理約 30 個）
        await new Promise(function(ok){ setTimeout(ok, Math.random() * 2500); });
        var ctl = new AbortController(), timer = setTimeout(function(){ ctl.abort(); }, 5000);
        // 帶上這支手機的推播位址，讀取「發給這支手機」的內容（每位主管勾選的提醒單位不同）
        var ep = "";
        try { var sub = await self.registration.pushManager.getSubscription(); ep = sub ? sub.endpoint : ""; } catch (e2) {}
        var url = g + "?pushmsg=" + encodeURIComponent(t) + (ep ? "&ep=" + encodeURIComponent(ep) : "") + "&_=" + Date.now();
        var r = await fetch(url, { cache: "no-store", signal: ctl.signal });
        if (!r.ok){   // 忙線時再試一次
          await new Promise(function(ok){ setTimeout(ok, 1000 + Math.random() * 2000); });
          r = await fetch(url, { cache: "no-store" });
        }
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
