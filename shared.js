/* shared.js —— DM 端与玩家端共用 */

const ROLES = {
  washerwoman:   { name:'洗衣妇',     team:'townsfolk', night:'first', ability:'首夜：得知两名玩家中有一人是某个特定镇民。', action:'info', interaction:'passive' },
  librarian:     { name:'图书管理员', team:'townsfolk', night:'first', ability:'首夜：得知两名玩家中有一人是某个特定外来者，或得知没有外来者。', action:'info', interaction:'passive' },
  investigator:  { name:'调查员',     team:'townsfolk', night:'first', ability:'首夜：得知两名玩家中有一人是某个特定爪牙。', action:'info', interaction:'passive' },
  chef:          { name:'厨师',       team:'townsfolk', night:'first', ability:'首夜：得知有多少对邪恶玩家相邻。', action:'info', interaction:'passive' },
  empath:        { name:'共情者',     team:'townsfolk', night:'both',  ability:'每夜：得知有多少邪恶玩家与你相邻。', action:'info', interaction:'passive' },
  fortune_teller:{ name:'占卜师',     team:'townsfolk', night:'both',  ability:'每夜：选择两名玩家，得知其中是否有恶魔。', action:'divine', interaction:'target', targetCount:2 },
  undertaker:    { name:'送葬者',     team:'townsfolk', night:'other', ability:'每夜：得知今天被处决的玩家的角色。', action:'info', interaction:'passive' },
  monk:          { name:'僧侣',       team:'townsfolk', night:'other', ability:'每夜（除首夜）：保护一名玩家免受恶魔伤害。', action:'protect', interaction:'target', targetCount:1 },
  ravenkeeper:   { name:'守鸦人',     team:'townsfolk', night:'trigger', ability:'你死亡时：选择一名玩家，得知其角色。', action:'info', interaction:'none' },
  virgin:        { name:'贞洁者',     team:'townsfolk', night:'day',   ability:'首次被提名时，若提名者是镇民，该镇民立即被处决。', action:'none', interaction:'none' },
  slayer:        { name:'杀手',       team:'townsfolk', night:'day',   ability:'白天（一次）：公开选择一名玩家，若其为恶魔，其死亡。', action:'none', interaction:'none' },
  soldier:       { name:'士兵',       team:'townsfolk', night:'passive', ability:'你不会被恶魔杀死。', action:'none', interaction:'none' },
  mayor:         { name:'镇长',       team:'townsfolk', night:'passive', ability:'若场上只有 3 名玩家存活、且当天无人被处决，你的阵营获胜。你夜间死亡时，可能由另一名玩家代替你死亡。', action:'none', interaction:'none' },

  butler:        { name:'管家',       team:'outsider',  night:'both',  ability:'每夜：选择一名玩家，明天只有他投票时你才能投票。', action:'butler', interaction:'target', targetCount:1 },
  drunk:         { name:'酒鬼',       team:'outsider',  night:'passive', ability:'你不知道自己是酒鬼，你获得一个镇民角色但技能无效。', action:'none', interaction:'none' },
  recluse:       { name:'隐士',       team:'outsider',  night:'passive', ability:'你可能被登记为邪恶或爪牙/恶魔。', action:'none', interaction:'none' },
  saint:         { name:'圣徒',       team:'outsider',  night:'passive', ability:'若你被处决，邪恶阵营胜利。', action:'none', interaction:'none' },

  poisoner:      { name:'投毒者',     team:'minion',    night:'other', ability:'每夜：选择一名玩家，其本夜与明天白天中毒。', action:'poison', interaction:'target', targetCount:1 },
  spy:           { name:'间谍',       team:'minion',    night:'both',  ability:'每夜：可查看魔典。你可能被登记为镇民或外来者。', action:'spy', interaction:'passive' },
  baron:         { name:'男爵',       team:'minion',    night:'passive', ability:'游戏开始时：额外两名外来者加入游戏。', action:'none', interaction:'none' },
  scarlet_woman: { name:'红唇女',     team:'minion',    night:'passive', ability:'若恶魔死亡时你存活且存活玩家≥5，你变成恶魔。', action:'none', interaction:'none' },

  imp:           { name:'小恶魔',     team:'demon',     night:'other', ability:'每夜：选择一名玩家杀死。若你自杀，一名爪牙变成小恶魔。', action:'kill', interaction:'target', targetCount:1 }
};

const TEAM_LABEL = { townsfolk:'镇民', outsider:'外来者', minion:'爪牙', demon:'恶魔' };
const TEAM_ORDER = ['townsfolk','outsider','minion','demon'];

/* ============================================================
   原创角色图标（手绘 SVG 线稿，24×24，跟随 currentColor）
   注意：官方角色美术是 Pandemonium Institute 的版权素材，
   这里用自己画的线条图标，可离线、可缩放、可换色。
   ============================================================ */
const ROLE_ICONS = {
  washerwoman:    '<path d="M3 13h18l-2 6H5z"/><circle cx="8" cy="9" r="1.9"/><circle cx="13.5" cy="7" r="2.4"/><circle cx="18.5" cy="10" r="1.5"/>',
  librarian:      '<path d="M5 4h8a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M16 8h3v12h-3"/><path d="M8 8h4"/>',
  investigator:   '<circle cx="10.5" cy="10" r="5.2"/><path d="M14.4 13.9L20 19.5"/><path d="M8.4 10h4.2"/>',
  chef:           '<path d="M6.2 11.2a3.1 3.1 0 1 1 1.3-5.9A3.3 3.3 0 0 1 12 3.6a3.3 3.3 0 0 1 4.5 1.7 3.1 3.1 0 1 1 1.3 5.9"/><path d="M6.2 11.2V20h11.6v-8.8"/>',
  empath:         '<path d="M12 20.5S4.5 15.8 4.5 10.8A4.2 4.2 0 0 1 12 8.2a4.2 4.2 0 0 1 7.5 2.6c0 5-7.5 9.7-7.5 9.7z"/>',
  fortune_teller: '<circle cx="12" cy="10" r="6"/><path d="M6.5 20.5h11"/><path d="M9.5 8.5c.8-1 2-1.4 3-1"/>',
  undertaker:     '<path d="M9.4 3h5.2l2.1 6.2L15.2 21H8.8L7.3 9.2z"/>',
  monk:           '<circle cx="12" cy="12" r="5.6"/><circle cx="12" cy="4.2" r="1.4"/><circle cx="18.6" cy="8.2" r="1.4"/><circle cx="18.6" cy="15.8" r="1.4"/><circle cx="12" cy="19.8" r="1.4"/><circle cx="5.4" cy="15.8" r="1.4"/><circle cx="5.4" cy="8.2" r="1.4"/>',
  ravenkeeper:    '<path d="M3.6 17.5c4.2 0 6.2-3 6.2-6.2l2.6-3.4 2.2 3.4h4.8l-3.1 3.4c0 4.2-4 6.2-8.4 6.2z"/><circle cx="15.8" cy="8.6" r=".55"/>',
  virgin:         '<path d="M12 21V9.5"/><path d="M12 9.5c0-3.2 2.1-5.4 4.4-5.4 0 3.2-2.1 5.4-4.4 5.4z"/><path d="M12 9.5c0-3.2-2.1-5.4-4.4-5.4 0 3.2 2.1 5.4 4.4 5.4z"/>',
  slayer:         '<path d="M17.4 3.2L20.8 6.6 11.4 16l-4 1.4 1.4-4z"/><path d="M4.2 19.8l3.4-3.4"/>',
  soldier:        '<path d="M12 3l8 3v6.2c0 5-4 8.2-8 9.2-4-1-8-4.2-8-9.2V6z"/><path d="M12 8.4v6.2"/>',
  mayor:          '<circle cx="12" cy="9" r="4.2"/><path d="M9.2 12.8L7 21l5-3 5 3-2.2-8.2"/>',
  butler:         '<path d="M3.2 15.5h17.6"/><path d="M6 15.5a6 6 0 0 1 12 0"/><circle cx="12" cy="6.2" r="1.7"/>',
  drunk:          '<path d="M7.6 3h8.8l-1 6.2a3.4 3.4 0 0 1-6.8 0z"/><path d="M12 12.8V20"/><path d="M8 21h8"/>',
  recluse:        '<path d="M12 3.2c4.2 4 6.2 8 6.2 12.2H5.8C5.8 11.2 7.8 7.2 12 3.2z"/><path d="M9.4 15.4c1.4-2.2 4.8-2.2 6.2 0"/>',
  saint:          '<circle cx="12" cy="12.6" r="4.6"/><ellipse cx="12" cy="5.4" rx="4.6" ry="1.5"/><path d="M7.4 21.2c1.8-2.6 7.4-2.6 9.2 0"/>',
  poisoner:       '<path d="M10 2.8h4v4.1l3 7.9a4.1 4.1 0 0 1-3.9 5.6h-2.2a4.1 4.1 0 0 1-3.9-5.6l3-7.9z"/><path d="M7.9 15.4h8.2"/>',
  spy:            '<path d="M2.4 12S6.4 5.8 12 5.8 21.6 12 21.6 12 17.6 18.2 12 18.2 2.4 12 2.4 12z"/><circle cx="12" cy="12" r="2.8"/>',
  baron:          '<path d="M6.6 10.2L7.6 4.4h8.8l1 5.8"/><path d="M4 10.2h16"/><path d="M6.4 13v7.6h11.2V13"/>',
  scarlet_woman:  '<path d="M3 12.2c4.2-4.2 8-5.2 9-3.1 1-2.1 4.8-1.1 9 3.1-4.2 4.2-8 6.2-9 4.1-1 2.1-4.8.1-9-4.1z"/>',
  imp:            '<path d="M6.2 6.4c-1-2-.4-3.6 1.2-4"/><path d="M17.8 6.4c1-2 .4-3.6-1.2-4"/><circle cx="12" cy="13.2" r="5.4"/><path d="M9.9 12v.1M14.1 12v.1"/><path d="M10 16c1.2 1 2.8 1 4 0"/>',
  _default:       '<circle cx="12" cy="12" r="7.6"/><path d="M12 8v.1M12 11v5"/>'
};

/* 想用官方美术：把图片放进 icons/ 目录，命名成 <角色id>.png，
   再把下面这行的 '' 改成 'icons/' 即可。
   留空 = 只用内置的手绘线稿图标（不会产生任何网络请求）。 */
const ROLE_ICON_DIR = 'icons/';   // 例：'icons/'
const ROLE_ICON_EXT = 'png'; // 图片扩展名：png / webp / jpg

function roleIcon(roleId, extraClass, inlineStyle) {
  const p = ROLE_ICONS[roleId] || ROLE_ICONS._default;
  const cls = 'role-ic' + (extraClass ? ' ' + extraClass : '');
  const st = inlineStyle ? ' style="' + inlineStyle + '"' : '';
  const svg = '<svg class="role-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + p + '</svg>';
  if (!ROLE_ICON_DIR) return '<span class="' + cls + '"' + st + '>' + svg + '</span>';
  const src = ROLE_ICON_DIR + roleId + '.' + ROLE_ICON_EXT;
  return '<span class="' + cls + '"' + st + '>' + svg +
    '<img class="role-img" src="' + src + '" alt="" decoding="async" ' +
    'onload="this.parentNode.classList.add(\'has-img\')" ' +
    'onerror="this.remove()">' +
    '</span>';
}

const MARKS = ['中毒','醉酒','保护','疯狂'];
const MARK_ICON = { '中毒':'💧', '醉酒':'🍺', '保护':'🛡', '疯狂':'🌀' };
const AUTO_EXPIRE = new Set(['中毒','醉酒','保护']);

const ORDER_FIRST = ['poisoner','spy','washerwoman','librarian','investigator',
                     'chef','empath','fortune_teller','butler'];
const ORDER_OTHER = ['poisoner','monk','spy','imp','undertaker','empath',
                     'fortune_teller','butler'];

const TABLE = {
  5:{townsfolk:3,outsider:0,minion:1,demon:1},
  6:{townsfolk:3,outsider:1,minion:1,demon:1},
  7:{townsfolk:5,outsider:0,minion:1,demon:1},
  8:{townsfolk:5,outsider:1,minion:1,demon:1},
  9:{townsfolk:5,outsider:2,minion:1,demon:1},
  10:{townsfolk:7,outsider:0,minion:2,demon:1},
  11:{townsfolk:7,outsider:1,minion:2,demon:1},
  12:{townsfolk:7,outsider:2,minion:2,demon:1},
  13:{townsfolk:9,outsider:0,minion:3,demon:1},
  14:{townsfolk:9,outsider:1,minion:3,demon:1},
  15:{townsfolk:9,outsider:2,minion:3,demon:1}
};

const CHANNEL_NAME = 'botc_room_v3';

/* 有 Supabase 配置就走 Realtime（跨设备），否则退回本机 BroadcastChannel */
function openChannel(handler) {
  const room = getRoomCode();
  if (!isSupabaseReady()) {
    console.warn('[bg] 未配置 Supabase，使用本机 BroadcastChannel（只有同一浏览器能收到）');
    setConnStatus('本机模式 · ' + room, 'rgba(150,110,40,.92)');
    return openBroadcastChannel(room, handler);
  }

  const mode = String(RT_CFG.transport || 'auto').toLowerCase();

  /* 配了同域代理 → 强制全员走轮询。
     原因：WebSocket 走 Realtime 广播、轮询走数据库表，是两条**互不相通**的通道，
     一部分人 WS、一部分人轮询会导致互相收不到消息。 */
  const proxyActive = restBase() !== String(RT_CFG.url || '').replace(/\/+$/, '');
  if (mode === 'poll' || (proxyActive && mode !== 'realtime')) {
    return openPollChannel(room, handler);
  }

  /* auto：先试 WebSocket，4.5 秒内没连上就切到 HTTPS 轮询 */
  const rt = openRealtimeChannel(room, handler);
  let poll = null;
  const t0 = Date.now();
  const timer = setInterval(() => {
    if (rt.joined) { clearInterval(timer); return; }
    if (Date.now() - t0 > 4500) {
      clearInterval(timer);
      try { rt.close(); } catch (e) {}
      poll = openPollChannel(room, handler);
    }
  }, 500);

  return {
    send(type, payload) { (poll || rt).send(type, payload); },
    close() { clearInterval(timer); try { (poll || rt).close(); } catch (e) {} },
    get joined() { return (poll || rt).joined; }
  };
}

function openBroadcastChannel(room, handler) {
  let ch = null;
  try { ch = new BroadcastChannel(CHANNEL_NAME + ':' + room); }
  catch (e) { console.warn('BroadcastChannel 不可用', e); return { send(){}, close(){} }; }
  ch.onmessage = (e) => { if (e && e.data) handler(e.data); };
  return {
    send(type, payload) { try { ch.postMessage({ type, payload, ts: Date.now() }); } catch (e) {} },
    close() { try { ch.close(); } catch (e) {} }
  };
}

function getNightAction(roleId, currentNight) {
  const r = ROLES[roleId];
  if (!r) return null;
  let active = false;
  if (r.night === 'both') active = true;
  else if (r.night === 'first' && currentNight === 1) active = true;
  else if (r.night === 'other' && currentNight !== 1) active = true;
  if (!active) return null;
  return {
    type: r.action,
    roleName: r.name,
    ability: r.ability,
    interaction: r.interaction,
    targetCount: r.targetCount || 1
  };
}

function buildPublicState(state) {
  return {
    currentNight: state.currentNight,
    phase: state.phase,
    players: state.players.map(p => ({
      id: p.id, name: p.name, alive: p.alive, hasRole: !!p.role, marks: [...p.marks]
    })),
    taken: (state.accounts || []).map(a => a.seatId),
    night: state.night
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ==================================================================
   Supabase Realtime 传输层
   纯 WebSocket + Phoenix 协议（vsn=1.0.0），不依赖任何 CDN
   对外接口和原来的 openChannel 完全一致：{ send(type, payload), close() }
   ================================================================== */

const RT_CFG = (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG)
  ? SUPABASE_CONFIG
  : { url: '', key: '', defaultRoom: 'lobby' };

function isSupabaseReady() {
  const u = String(RT_CFG.url || ''), k = String(RT_CFG.key || '');
  if (!u || !k) return false;
  if (!/^https?:\/\/[^/\s]+/.test(u)) return false;
  if (/YOUR|your-|xxxx|xxx\.|在这里|请填写/.test(u + k)) return false;
  return true;
}

function getRoomCode() {
  let r = '';
  try { r = new URLSearchParams(location.search).get('room') || ''; } catch (e) {}
  if (!r) { try { r = localStorage.getItem('botc_last_room') || ''; } catch (e) {} }
  r = String(r || RT_CFG.defaultRoom || 'lobby')
    .toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
  if (!r) r = 'lobby';
  try { localStorage.setItem('botc_last_room', r); } catch (e) {}
  return r;
}

/* 换房间：带 ?room= 重新加载页面（存档都在浏览器里，不会丢） */
function switchRoom(newRoom) {
  const r = String(newRoom || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
  if (!r) return false;
  try { localStorage.setItem('botc_last_room', r); } catch (e) {}
  try {
    const u = new URL(location.href);
    u.searchParams.set('room', r);
    location.href = u.href;
    return true;
  } catch (e) {
    return false;
  }
}

/* 连接状态（左下角小标签，点一下看详情） */
const RT_STATE = { mode: '未连接', joined: false, err: '', room: '' };

/* REST 基地址：配了 proxy 且页面是 http(s) 时走同域代理，绕开被屏蔽的 supabase 域名 */
function restBase() {
  const raw = String(RT_CFG.proxy || '');
  // '/' 或 'origin' = 直接把 /rest/v1/... 当成同域路径（帽子云这类按路径原样转发的网关）
  if (raw === '/' || raw.toLowerCase() === 'origin') return '';
  const p = raw.replace(/\/+$/, '');
  const pageIsHttp = /^https?:/i.test(String(location.href));
  if (p && /^https?:\/\//i.test(p)) return p;        // 绝对地址的代理
  if (p && pageIsHttp) return p;                     // 同域相对代理，如 /sb
  return String(RT_CFG.url || '').replace(/\/+$/, '');
}

let _statusEl = null;
function setConnStatus(text, bg) {
  try {
    if (!_statusEl) {
      if (!document.body) { document.addEventListener('DOMContentLoaded', () => setConnStatus(text, bg)); return; }
      _statusEl = document.createElement('div');
      _statusEl.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:99999;pointer-events:auto;cursor:pointer;' +
        'font:11px/1.5 -apple-system,"Microsoft YaHei",sans-serif;padding:4px 10px;border-radius:20px;' +
        'color:#fff;opacity:.92;box-shadow:0 2px 8px rgba(0,0,0,.18);max-width:70vw;' +
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      _statusEl.title = '点一下看连接详情';
      _statusEl.addEventListener('click', showConnDetail);
      document.body.appendChild(_statusEl);
    }
    _statusEl.textContent = text;
    _statusEl.style.background = bg || 'rgba(20,20,28,.78)';
  } catch (e) {}
}

/* 点左下角标签：显示状态并现场测一次服务器连通性 */
async function showConnDetail() {
  const host = String(RT_CFG.url || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '') || '未配置';
  const viaProxy = restBase() !== String(RT_CFG.url || '').replace(/\/+$/, '');
  let reach = '测试中…';
  if (RT_CFG.url) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(restBase() + '/rest/v1/', {
        signal: ctrl.signal, headers: { apikey: String(RT_CFG.key || '') }
      });
      clearTimeout(to);
      reach = 'HTTP ' + r.status + '（可达 ✓）';
    } catch (e) {
      reach = '不可达 ✗（' + (e && e.name === 'AbortError' ? '8 秒超时' : (e && e.message) || e) + '）';
    }
  }
  const lines = [
    '房间：' + (RT_STATE.room || getRoomCode()),
    '通道：' + RT_STATE.mode,
    '状态：' + (RT_STATE.joined ? '已连接' : '未连接'),
    '服务器：' + host,
    '走代理：' + (viaProxy ? '是（' + restBase() + '）' : '否（直连）'),
    '服务器连通性：' + reach,
    '最近错误：' + (RT_STATE.err || '无')
  ];
  if (confirm(lines.join('\n') + '\n\n要重新连接吗？（页面会刷新）')) {
    location.reload();
  }
}

function openRealtimeChannel(room, handler) {
  const http = String(RT_CFG.url).replace(/\/+$/, '');
  const wsBase = http.replace(/^http/, 'ws');
  const topic = 'realtime:bg:' + room;
  const joinPayload = {
    config: {
      broadcast: { ack: false, self: false },
      presence: { enabled: false },
      private: false
    }
  };

  let ws = null;
  let joined = false;
  let closed = false;
  let anyJoined = false;
  let lastErr = '';
  let lastMsgAt = Date.now();
  let refSeq = 0;
  let joinRef = null;
  let queue = [];
  let retry = 0;
  let reconnectTimer = null;
  let hbTimer = null;

  const nextRef = () => String(++refSeq);
  const frame = (event, payload) => {
    const f = { topic, event, payload, ref: nextRef() };
    if (joinRef) f.join_ref = joinRef;
    return f;
  };
  function rawSend(obj) {
    try {
      if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
    } catch (e) {}
  }

  function onJoined() {
    joined = true;
    anyJoined = true;
    retry = 0;
    lastMsgAt = Date.now();
    RT_STATE.mode = 'WebSocket'; RT_STATE.joined = true; RT_STATE.err = ''; RT_STATE.room = room;
    setConnStatus('已连接 · ' + room, 'rgba(39,140,80,.92)');
    const pending = queue; queue = [];
    pending.forEach(([t, p]) => rawSend(frame('broadcast', { type: 'broadcast', event: t, payload: p })));
    try { handler({ type: '__connected__', payload: { room } }); } catch (e) { console.error(e); }
  }

  function startHeartbeat() {
    clearInterval(hbTimer);
    hbTimer = setInterval(() => {
      /* 手机切后台再回来时，连接可能已经死了但没触发 onclose —— 用心跳超时兜底 */
      if (joined && Date.now() - lastMsgAt > 75000) {
        lastErr = '心跳超时（可能进入了后台）';
        scheduleReconnect();
        return;
      }
      rawSend({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: nextRef() });
    }, 25000);
  }

  function scheduleReconnect() {
    joined = false;
    RT_STATE.joined = false;
    RT_STATE.err = lastErr || RT_STATE.err;
    if (closed) return;
    clearInterval(hbTimer);
    /* 先摘掉交给回调，避免 close() 又触发一次重连 */
    if (ws) { try { ws.onclose = null; ws.onerror = null; ws.close(); } catch (e) {} ws = null; }
    if (reconnectTimer) return;
    retry += 1;
    const delay = Math.min(1000 * Math.pow(1.7, retry), 15000);
    setConnStatus('重连中(' + retry + ') ' + (lastErr ? '· ' + lastErr : ''), 'rgba(160,60,60,.92)');
    reconnectTimer = setTimeout(() => { reconnectTimer = null; connect(); }, delay);
  }

  function connect() {
    if (closed) return;
    RT_STATE.mode = 'WebSocket';
    setConnStatus('连接中…', 'rgba(90,90,110,.85)');
    /* 先把旧连接关掉，避免旧的 onclose 触发重复重连 */
    if (ws) { try { ws.onclose = null; ws.onerror = null; ws.close(); } catch (e) {} ws = null; }
    joinRef = null;
    try {
      ws = new WebSocket(wsBase + '/realtime/v1/websocket?apikey=' + encodeURIComponent(RT_CFG.key) + '&vsn=1.0.0');
    } catch (e) {
      lastErr = 'WebSocket 创建失败: ' + (e && e.message);
      console.error('[rt]', lastErr);
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      joinRef = nextRef();
      rawSend({ topic, event: 'phx_join', payload: joinPayload, ref: joinRef, join_ref: joinRef });
      startHeartbeat();
    };

    ws.onmessage = (ev) => {
      lastMsgAt = Date.now();
      let m;
      try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (!m || !m.event) return;

      if (m.event === 'phx_reply') {
        if (joinRef && m.ref === joinRef) {
          const st = m.payload && m.payload.status;
          if (st === 'ok') onJoined();
          else {
            const why = (m.payload && (m.payload.reason || m.payload.message)) || JSON.stringify(m.payload);
            lastErr = '加入房间被拒: ' + why;
            console.error('[rt] join 失败', m.payload);
            setConnStatus('加入被拒 · ' + why, 'rgba(160,60,60,.92)');
            scheduleReconnect();
          }
        }
        return;
      }

      if (m.event === 'broadcast') {
        const p = m.payload || {};
        if (p.type !== 'broadcast') return;           // 忽略 presence_state 等
        if (typeof p.event !== 'string') return;
        try { handler({ type: p.event, payload: p.payload }); } catch (e) { console.error(e); }
        return;
      }

      if (m.event === 'phx_error' || m.event === 'phx_close') scheduleReconnect();
    };

    ws.onerror = () => { lastErr = '网络错误（可能被防火墙/代理拦了）'; };
    ws.onclose = (ev) => {
      if (closed) return;
      lastErr = '关闭码 ' + ((ev && ev.code) || '?') + ((ev && ev.reason) ? ' ' + ev.reason : '');
      console.warn('[rt] 连接关闭', ev && ev.code, ev && ev.reason);
      scheduleReconnect();
    };
  }

  /* 手机切后台/锁屏再回来时立刻重连 */
  document.addEventListener('visibilitychange', () => {
    if (closed) return;
    if (document.visibilityState === 'visible' && !joined) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
      retry = 0;
      console.log('[rt] 回到前台，立即重连');
      connect();
    }
  });

  connect();

  return {
    send(type, payload) {
      if (!joined) {
        if (queue.length < 60) queue.push([type, payload]);
        return;
      }
      rawSend(frame('broadcast', { type: 'broadcast', event: type, payload: payload }));
    },
    close() {
      closed = true;
      clearInterval(hbTimer);
      clearTimeout(reconnectTimer);
      try { if (ws) ws.close(); } catch (e) {}
    },
    get joined() { return joined; }
  };
}

/* 页面里任何未捕获的脚本错误都打到 console，方便排查 */
try {
  window.addEventListener('error', (e) => {
    console.error('[page-error]', e.message, (e.filename || '') + ':' + (e.lineno || ''));
  });
} catch (e) {}

/* ==================================================================
   HTTPS 轮询通道
   WebSocket 被网络挡住时的备选：用普通的 REST 请求收发消息
   需要先在 Supabase 里建好 bg_messages 表（见 README-supabase.md）
   ================================================================== */
function openPollChannel(room, handler) {
  const base = restBase() + '/rest/v1/bg_messages';
  const key = String(RT_CFG.key);
  const headers = { 'apikey': key, 'Authorization': 'Bearer ' + key, 'content-type': 'application/json' };
  const clientId = 'c_' + Math.random().toString(36).slice(2, 10);

  let lastId = 0;
  let joined = false;
  let closed = false;
  let timer = null;
  let queue = [];
  let inited = false;

  function post(type, payload) {
    return fetch(base, {
      method: 'POST',
      headers: Object.assign({}, headers, { Prefer: 'return=minimal' }),
      body: JSON.stringify([{ room: room, event: type, payload: payload, sender: clientId }])
    }).catch((e) => console.warn('[poll] 发送失败', e));
  }

  async function init() {
    if (closed) return;
    const modeLabel = 'HTTPS 轮询' + (restBase() !== String(RT_CFG.url).replace(/\/+$/, '') ? '（同域代理）' : '');
    RT_STATE.mode = modeLabel;
    try {
      const r = await fetch(base + '?select=id&order=id.desc&limit=1', { headers: headers });
      if (!r.ok) throw new Error('HTTP ' + r.status + (r.status === 404 ? '（表还没建？）' : ''));
      const rows = await r.json();
      if (closed) return;
      lastId = rows.length ? Number(rows[0].id) : 0;
      joined = true;
      inited = true;
      RT_STATE.mode = modeLabel; RT_STATE.joined = true; RT_STATE.err = ''; RT_STATE.room = room;
      setConnStatus('已连接 · 轮询模式 · ' + room, 'rgba(39,140,80,.92)');
      const q = queue; queue = [];
      q.forEach(([t, p]) => { post(t, p); });
      try { handler({ type: '__connected__', payload: { room: room } }); } catch (e) { console.error(e); }
      loop();
      /* 顺手清理半小时前的旧消息，保持表很小 */
      setInterval(() => {
        if (closed) return;
        const cut = encodeURIComponent(new Date(Date.now() - 30 * 60 * 1000).toISOString());
        fetch(base + '?created_at=lt.' + cut, { method: 'DELETE', headers: headers }).catch(() => {});
      }, 10 * 60 * 1000);
    } catch (e) {
      RT_STATE.joined = false;
      RT_STATE.err = e.message;
      setConnStatus('轮询启动失败: ' + e.message, 'rgba(160,60,60,.92)');
      console.error('[poll] init 失败', e);
      if (!closed) setTimeout(init, 3000);
    }
  }

  async function loop() {
    if (closed) return;
    try {
      const url = base + '?select=id,event,payload,sender&room=eq.' + encodeURIComponent(room) +
        '&id=gt.' + lastId + '&order=id.asc&limit=200';
      const r = await fetch(url, { headers: headers });
      if (r.ok) {
        const rows = await r.json();
        for (const row of rows) {
          lastId = Math.max(lastId, Number(row.id));
          if (row.sender === clientId) continue;
          try { handler({ type: row.event, payload: row.payload }); } catch (e) { console.error(e); }
        }
      }
    } catch (e) { /* 网络抖动，下一轮再试 */ }
    if (!closed) timer = setTimeout(loop, 1200);
  }

  /* 手机回到前台时立刻补拉一次，不用等定时器 */
  document.addEventListener('visibilitychange', () => {
    if (closed || !inited) return;
    if (document.visibilityState === 'visible') {
      clearTimeout(timer);
      loop();
    }
  });

  init();

  return {
    send(type, payload) {
      if (!inited) { if (queue.length < 60) queue.push([type, payload]); return; }
      post(type, payload);
    },
    close() { closed = true; clearTimeout(timer); },
    get joined() { return joined; }
  };
}