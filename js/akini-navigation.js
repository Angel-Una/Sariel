

  function _akiniCleanPopups(){
    try {
      var cmo = document.getElementById("chatMenuOverlay");
      if (cmo) { cmo.style.display = "none"; cmo.classList.remove("show"); if(cmo.style.pointerEvents) cmo.style.pointerEvents = "none"; }
      var addOverlays = document.querySelectorAll(".chat-list-add-menu-overlay");
      addOverlays.forEach(function(el){ el.classList.remove("show"); el.remove(); });
      var pm = document.getElementById("plusMenu");
      if (pm) { pm.style.display = "none"; pm.classList.remove("show"); }
      var ep = document.getElementById("emojiPanel");
      if (ep) { ep.style.display = "none"; ep.classList.remove("show"); }
    } catch(e){}
  }

/* 全站图层清单：导航/返回共用同一份 */
var AKINI_APP_PAGES = ["app-chat","app-chat-list","app-friends","app-mail","app-music","app-call","app-add-contact","app-contact-detail","app-shop","app-novel","app-novel-reader","app-companion"];
var AKINI_AREAS = ["settingsArea","akiniProbArea","beautifyArea","icityArea","storageArea","wordbankOverlay","wbExclOverlay","surveyListModal","surveyCreateModal","surveyDetailModal","surveyCreatedListModal","akini-ta-phone-container","watchArea"];
var AKINI_OVERLAYS = ["musicMenuOverlay","musicContactPicker","musicPlaylistOverlay","musicPlaylistSelect","musicOptionPicker"];
var AKINI_HOME_BARS = ["homeScreens","bottomBar"];

function akiniHideLayers(opts){
  opts = opts || {};
  AKINI_OVERLAYS.forEach(function(id){ var el=document.getElementById(id); if(el){ el.style.display="none"; el.classList.remove("show"); } });
  AKINI_APP_PAGES.forEach(function(id){ var el=document.getElementById(id); if(el){ el.style.display="none"; el.classList.remove("show"); } });
  AKINI_AREAS.forEach(function(id){ var el=document.getElementById(id); if(el){ el.style.display="none"; el.classList.remove("show"); } });
  if(opts.hideHome){
    AKINI_HOME_BARS.forEach(function(id){ var el=document.getElementById(id); if(el) el.style.display="none"; });
  }
}

window.akiniGoBack = function(target){
  _akiniCleanPopups();
  if (target === "home") {
    try { localStorage.removeItem("akini_active_chat_id"); } catch(e){}
    akiniHideLayers({});
    if(window.__akiniBackStack) window.__akiniBackStack.length = 0;
    try { var _cw=document.querySelector(".content-wrapper"); if(_cw){ _cw.style.display="flex"; _cw.classList.remove("akini-content-hidden"); } } catch(e){}
    try { if(window.__akiniShowContent) window.__akiniShowContent(); } catch(e){}
    /* 回到首页统一复位滚动位置，杜绝首页停留在上次的偏移 */
    try { if(window.__akiniResetHomeScroll) window.__akiniResetHomeScroll(); } catch(e){}
    return false;
  }
  if (target !== "home" && window.__navBack && !window.__navBack._akini) {
    try { if (window.__navBack()) return false; } catch(e){}
  }
  /* 离开聊天页时清除当前激活会话，避免返回列表仍被判定为“在聊天”而不弹通知 */
  if (target !== "chat" && target !== "chat-list") {
    try { localStorage.removeItem("akini_active_chat_id"); } catch(e){}
  }
  /* 记录当前是否在添加联系人/创建群聊页面，用于返回 chat-list 时切到通讯录 tab */
  var sourcePage = null;
  for (var k=0;k<AKINI_APP_PAGES.length;k++){ var src=document.getElementById(AKINI_APP_PAGES[k]); if(src && src.style.display!=="none" && src.classList.contains("show")){ sourcePage = AKINI_APP_PAGES[k].replace("app-",""); break; } }
  akiniHideLayers({ hideHome: true });
  if(window.__akiniBackStack) window.__akiniBackStack.length = 0;
  if (target) {
    if (window.showPage) { try { window.showPage(target); } catch(e){} }
    var el = document.getElementById("app-" + target);
    if (el) { el.style.display="flex"; el.classList.add("show"); el.style.zIndex="500"; }
    if (target === "chat-list" && window.switchChatTab) {
      try { window.switchChatTab(sourcePage === "contact-detail" || sourcePage === "add-contact" ? "contacts" : "wechat"); } catch(e){}
    }
  }
  return false;
};
// 打开字卡库：先立即显示浮层，再延迟渲染字卡列表，避免进入卡顿
window.__openWordBank = function(){
  try {
    if(window.showArea) {
      window.showArea("wordbankOverlay");
    } else {
      var overlay = document.getElementById("wordbankOverlay");
      if(overlay) overlay.style.display = "block";
    }
  } catch(e) {
    var overlay2 = document.getElementById("wordbankOverlay");
    if(overlay2) overlay2.style.display = "block";
  }
  try {
    if(window.renderWordbank) requestAnimationFrame(function(){ try { window.renderWordbank(); } catch(e){} });
  } catch(e) {}
};

// 健壮的底部三按钮展示逻辑，兼顾所有机型与浏览器，即使 showArea 未挂载也能通过 DOM 唤起
window.__safeShowArea = function(areaId){
  try {
    if(typeof window.__navShowArea === 'function') {
      window.__navShowArea(areaId);
      return;
    }
  } catch(e) {}
  try {
    if(typeof window.showArea === 'function') {
      window.showArea(areaId);
      return;
    }
  } catch(e) {}
  try {
    var el = document.getElementById(areaId);
    if(el) {
      el.style.display = 'block';
      el.classList.add('show');
    }
  } catch(e) {}
};
// __navBack 由 akini-core.js 定义
if (window.__navBack) { window.__navBack._akini = true; }
(function(){
  window.hideAll = function hideAll(){
    _akiniCleanPopups();
    akiniHideLayers({});
    var menu = document.getElementById("chatMenuOverlay");
    if(menu){ menu.style.display = "none"; menu.classList.remove("show"); }
    var addMenu = document.querySelector(".chat-list-add-menu-overlay");
    if(addMenu){ addMenu.classList.remove("show"); setTimeout(function(){ addMenu.remove(); }, 200); }
  };

  window.showEl = function showEl(id, z){
    var el = document.getElementById(id);
    if(!el) return el;
    el.style.zIndex = z || "4000";
    el.style.display = "flex";
    el.classList.add("show");
    return el;
  };

  window.showArea = function showArea(id){
    var el = document.getElementById(id);
    if(!el) return;
    el.style.zIndex = "4000";
    el.style.display = "flex";
    el.classList.add("show");
  };

  function navTo(app){
    try{
      window.hideAll();

      if(app === "chat-list"){
        var dc = window.__akiniDefaultContact && window.__akiniDefaultContact();
        if(dc && window.openChat){
          window.akiniContacts && window.akiniContacts.setActiveChatId && window.akiniContacts.setActiveChatId(dc.id);
          window.openChat(dc.id);
          return;
        }
        __akiniShowAppContainer("chat-list");
        return;
      }

      if(app === "music" || app === "music-together"){
        var mdc = window.__akiniDefaultContact && window.__akiniDefaultContact();
        if(mdc){
          try{
            localStorage.setItem("akini_music_selected_contacts", JSON.stringify([mdc.id]));
            localStorage.removeItem("akini_music_exited");
          }catch(e){}
        }
        // 如果有进行中的一起听会话，直接进播放器；否则先显示音乐首页
        var _active = false;
        try{ _active = "1" === localStorage.getItem("akini_music_listening_active"); }catch(e){}
        if(_active){
          __akiniShowAppContainer("music");
        } else if(typeof window.__akiniShowMusicHome === "function"){
          window.__akiniShowMusicHome();
        } else {
          __akiniShowAppContainer("music");
        }
        return;
      }

      if(app === "survey"){
        if(window._openSurveyList){ window._openSurveyList(); return; }
        var sm = document.getElementById("surveyListModal");
        if(sm){ sm.style.display = "flex"; sm.style.zIndex = "9100"; }
        return;
      }

      if(app === "friends"){
        try{ window.__akiniClearFeatureUnread && window.__akiniClearFeatureUnread("friends"); }catch(e){}
        __akiniShowAppContainer(app);
        return;
      }
      if(app === "call" || app === "add-contact" || app === "contact-detail"){
        __akiniShowAppContainer(app);
        return;
      }

      if(app === "icity"){
        try{ window.__akiniClearFeatureUnread && window.__akiniClearFeatureUnread("icity"); }catch(e){}
        showArea("icityArea");
        return;
      }
      if(app === "settings"){ showArea("settingsArea"); return; }
      if(app === "storage"){ window.__openStorageMgr && window.__openStorageMgr(); return; }
      if(app === "beautify"){ showArea("beautifyArea"); return; }
      if(app === "wordbank"){
        showArea("wordbankOverlay");
        if(typeof window.renderWordbank === "function") window.renderWordbank();
        else if(typeof populateWordbankGroups === "function") populateWordbankGroups();
        return;
      }
      if(app === "shop"){
        showEl("app-shop");
        window.__renderShop && window.__renderShop();
        return;
      }
      if(app === "novel"){
        showEl("app-novel");
        window.__renderNovelShelf && window.__renderNovelShelf();
        return;
      }
      if(app === "companion"){
        showEl("app-companion");
        try{ window.__akiniClearFeatureUnread && window.__akiniClearFeatureUnread("companion"); }catch(e){}
        // 如果有进行中的陪伴会话，直接进主界面；否则先显示陪伴首页
        var _cactive = false;
        try{
          if(typeof window.companionState === "function"){
            var _st = window.companionState();
            _cactive = !!( _st && _st.cid );
          }
        }catch(e){}
        if(_cactive){
          window.__openCompanion && window.__openCompanion();
        } else if(typeof window.__akiniShowCompanionHome === "function"){
          window.__akiniShowCompanionHome();
        } else {
          window.__openCompanion && window.__openCompanion();
        }
        return;
      }
      if(app === "mail"){
        if(typeof window.showPage === "function") window.showPage("mail");
        else showEl("app-mail");
        window.__renderMail && window.__renderMail();
        return;
      }
      if(app === "home"){
        window.hideAll && window.hideAll();
        try{
          var cw = document.querySelector(".content-wrapper");
          if(cw){ cw.style.display = "flex"; cw.classList.remove("akini-content-hidden"); }
        }catch(e){}
        try{ window.__akiniShowContent && window.__akiniShowContent(); }catch(e){}
        try{ window.__akiniResetHomeScroll && window.__akiniResetHomeScroll(); }catch(e){}
        return;
      }
      if(app === "chat-detail" && window._akiniLastChatId){ window.openChat(window._akiniLastChatId, true); return; }
      if(app === "ta-phone"){ window.AkiniTaPhone && window.AkiniTaPhone.showTaPhone(); return; }
      if(app === "watch"){ window.__akiniOpenWatch && window.__akiniOpenWatch(); return; }

      if(typeof window.showPage === "function") window.showPage(app);
      else console.warn("navTo unknown app:", app);
    }catch(err){ console.error("navTo error", err); }
  }
  window.navTo = navTo;

  /* 打开应用容器：统一固定定位，避免被首页的父级裁剪 */
  function __akiniShowAppContainer(app){
    var target = document.getElementById("app-" + app);
    if(!target) return;
    target.classList.add("show");
    target.style.display = "flex";
    target.style.position = "fixed";
    target.style.top = "0";
    target.style.left = "0";
    target.style.width = "100%";
    target.style.height = "100%";
    target.style.zIndex = "4000";
    target.style.visibility = "visible";
    target.style.opacity = "1";
    target.style.pointerEvents = "auto";
    if(app === "chat-list" || app === "friends") target.style.background = "#f2f2f2";
    document.body.appendChild(target);
  }

  /* 信箱打开函数：供按钮直接调用 */
  function openMail(){
    var el = document.getElementById("app-mail");
    if(!el) return;
    AKINI_APP_PAGES.forEach(function(id){
      if(id === "app-mail") return;
      var n = document.getElementById(id);
      if(n){ n.style.display = "none"; n.classList.remove("show"); }
    });
    AKINI_AREAS.forEach(function(id){
      var n = document.getElementById(id);
      if(n){ n.style.display = "none"; n.classList.remove("show"); }
    });
    el.style.zIndex = "9000";
    el.style.display = "flex";
    el.classList.add("show");
    if(window.__renderMail) window.__renderMail();
  }
  window.__openMail = openMail;

  /* 导航映射 */
  var map = {
    appBtnChat: "chat-list", appBtnFriends: "friends", appBtnMusic: "music",
    appBtnIcity: "icity", appBtnShop: "shop", appBtnMail: "mail",
    appBtnTaPhone: "ta-phone", appBtnNovel: "novel", appBtnCompanion: "companion",
    appBtnWatch: "watch",
    settingsBtn: "settings", beautifyBtn: "beautify", wordBtn: "wordbank"
  };
  function bindAppButtons(){
    Object.keys(map).forEach(function(id){
      var el = document.getElementById(id);
      if(!el || el.__akiniAppBound) return;
      el.__akiniAppBound = true;
      el.setAttribute("data-bound", "1");
      el.style.touchAction = "manipulation";
      var app = map[id];
      el.addEventListener("click", function(){
        if(app === "mail"){
          if(window.navTo) navTo("mail");
          else if(typeof window.showPage === "function") window.showPage("mail");
          else openMail();
          return;
        }
        if(window.navTo) navTo(app);
      });
    });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bindAppButtons);
  } else {
    bindAppButtons();
  }
})();
