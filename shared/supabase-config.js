/* ============================================================
   supabase-config.js —— 只改这三行就够
   ============================================================
   url : 项目地址。Dashboard → Project Settings → API（或 Connect 弹窗）
         形如 https://abcdefghijklmn.supabase.co
   key : 公开密钥。新项目用 publishable key（sb_publishable_xxx）；
         老项目用 anon public key（eyJhbGciOi...）。
         ⚠️ 千万别填 service_role / secret key
   不填的话会自动退回「本机模式」：同一台电脑的多个标签页能玩，
   手机和其他电脑连不上。
   ============================================================ */

window.SUPABASE_CONFIG = {
  url: 'https://tlkziokoovtdioptbitu.supabase.co',
  key: 'sb_publishable_YT7PcRQ3UzVFYGx14vHeIw_E6iaN0rY',
  defaultRoom: 'lobby',  // 不带 ?room=xxx 时使用的房间号
  transport: 'poll',     // auto = 先试 WebSocket，连不上自动切 HTTPS 轮询
                         // 'poll'   = 直接用轮询（全员一致，手机不装 VPN 也能连）
                         // 'realtime' = 只用 WebSocket（只在全员网络都能连 supabase 时用）

  /* 代理设置（手机连不上 supabase 时靠它转发）：
     '/'     帽子云等「路径原样转发」的网关（规则匹配 /rest/v1）
     '/sb'   Netlify（配合仓库里的 _redirects）
     ''      直连 Supabase，不走代理
     也可以填绝对地址，如 'https://xxx.netlify.app/sb' */
  proxy: '/'
};
