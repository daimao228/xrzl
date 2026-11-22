# 在 Supabase 上跑「血染钟楼」DM/玩家端

## 这次改了什么

| 文件 | 说明 |
|---|---|
| `shared/supabase-config.js` | **新增**。填项目 URL + 公开 key，就这三行 |
| `shared/shared.js` | 通信层从 `BroadcastChannel` 换成 **Supabase Realtime**（自带 WebSocket 客户端，不加载任何 CDN，国内网络也不怕）。没填配置时自动回退本机模式 |
| `botc/index.html` | **新增**。房间入口页：随机房间号 + 一键生成 DM / 玩家链接 |
| `botc/dm.html` | 加配置脚本；玩家重连后自动补发状态；收到 `request_state` 自动应答 |
| `botc/player.html` | 加配置脚本；DM 没在线时自动重试登录（最多 6 次）；重连后自动重新登录 |

房间号通过 URL 传：`?room=abcd`。**DM 和玩家必须是同一个房间号**才能互相看见；不同房间的人互不干扰。左下角小标签会显示连接状态。

---

## 1. 填配置（1 分钟）

Supabase Dashboard → 你的项目 → **Connect**（或 Settings → API Keys），复制：

- **Project URL** → `https://xxxx.supabase.co`
- **publishable key**（`sb_publishable_...`）；老项目也可以用 `anon public`

填进 `shared/supabase-config.js`：

```js
window.SUPABASE_CONFIG = {
  url: 'https://xxxx.supabase.co',
  key: 'sb_publishable_...',
  defaultRoom: 'lobby'
};
```

⚠️ 别填 `service_role` / `sb_secret_...`，那个会泄漏全部数据。

## 2. 数据库：WebSocket 能用就不用建，被挡了就建一张表

页面有两种通道，`transport: 'auto'` 会自己选：

1. **WebSocket（Realtime）**——延迟最低，不需要建表、不需要 SQL。
2. **HTTPS 轮询**——WebSocket 被网络/代理挡住（Console 报 `关闭码 1006`）时自动切换，延迟约 1～2 秒。

如果要用轮询，在 Dashboard → **SQL Editor** 里跑一次下面这段：

```sql
create table if not exists public.bg_messages (
  id bigserial primary key,
  room text not null,
  event text not null,
  payload jsonb,
  sender text,
  created_at timestamptz not null default now()
);

create index if not exists bg_messages_room_id_idx on public.bg_messages (room, id);

alter table public.bg_messages enable row level security;

drop policy if exists bg_read  on public.bg_messages;
drop policy if exists bg_write on public.bg_messages;
drop policy if exists bg_clean on public.bg_messages;

create policy bg_read  on public.bg_messages for select to anon using (true);
create policy bg_write on public.bg_messages for insert to anon with check (true);
create policy bg_clean on public.bg_messages for delete to anon using (true);

grant select, insert, delete on public.bg_messages to anon, authenticated;
grant usage, select on sequence public.bg_messages_id_seq to anon, authenticated;
```

客户会自动删掉 30 分钟前的旧消息，表不会变大。

⚠️ 两种通道都是「拿到链接就能收发」，所以别把真实密码当密码用——这个项目本来就是朋友局，密码只是占座凭证。

### 手机连不上 supabase？（不装 VPN 的解法）

有些手机网络（尤其运营商流量）会把 `*.supabase.co` 整个域名挡住，报 `failed to fetch`。
解法是让 **Netlify 同域代理**转发，玩家只访问 netlify.app：

1. 项目根目录有 `_redirects` 文件，内容是：
   ```
   /sb/*  https://<你的项目ref>.supabase.co/:splat  200
   ```
2. `supabase-config.js` 里设置：
   ```js
   transport: 'poll',   // 必须全员一致
   proxy: '/sb'
   ```
3. 部署时 **`_redirects` 必须一起上传到站点根目录**（拖文件夹时会自动带上）

⚠️ 注意：**WebSocket 和轮询是两条互不相通的通道**（WS 走 Realtime 广播，轮询走数据库表）。
所以一旦配了代理，代码会强制全员走轮询——不会出现「电脑走 WS、手机走轮询导致互相收不到」的情况。

## 3. 页面放哪

**Storage 的公网 URL 不能直接当静态站用**：它会把 `.html` 以 `text/plain` 返回，浏览器只显示源码
（见 [supabase/supabase#39094](https://github.com/supabase/supabase/issues/39094)）。
所以页面一律放外面的静态托管，Supabase 只负责联机（`botc/`、`dgzl/` 整个文件夹一起上传，相对路径都写好了）：

- 帽子云：见 [README-deploy.md](README-deploy.md)
- Netlify Drop：<https://app.netlify.com/drop> 直接把仓库根目录拖进去
- Cloudflare Pages / GitHub Pages / Vercel 同理

> 以前那个「用 Edge Function 托管整站」的草稿（`supabase/functions/site/index.ts`）已经删了，不用再折腾那条路。

---

## 4. 开一局

1. 打开站点首页 `index.html`，进「血染钟楼」= `botc/index.html`，看房间号（或点「随机」）
2. 上排点「进入主持人端」——**只有你自己打开**
3. 下排「复制链接」发群里，玩家各自打开、填座位号 + 用户名 + 密码登录（首次即注册）
4. 两边左下角都变成「已连接」→ DM 端加座位、分角色，玩家端会自动收到

## 5. 常见问题

| 现象 | 原因 |
|---|---|
| 左下角一直「连接中…」 | key 填错，或项目暂停了（免费项目闲置会休眠，去 Dashboard 唤醒） |
| Console 报 `关闭码 1006` | WebSocket 被你这条网络挡住了。跑第 2 节的 SQL，页面会在 7 秒后自动切到 HTTPS 轮询 |
| 显示「本机模式」 | `shared/supabase-config.js` 没被加载/没填值，只有同一浏览器能看到彼此 |
| 玩家端一直「等不到 DM 端回应」 | DM 页面没开，或房间号不一样 |
| 页面显示的是源码 | 你直接从 Storage 公网 URL 打开了 `.html`，换成第 3 节 A 或 B |
| 改了文件后没生效 | 重新上传覆盖，并在网址后加 `?v=2` 绕过缓存 |

---

## 附：美术素材怎么放

```
botc/icons/    22 个角色图标（官方 PNG，已压到 160×160，共 437KB）
botc/assets/   素材库里的 SVG 装饰（共 19KB，矢量，可任意缩放）
```

- 角色图标由 `shared/shared.js` 顶部的 `ROLE_ICON_DIR = 'icons/'` 控制（相对页面）；留空 `''` 就退回内置手绘线稿
- 换图标：把同名 `<角色id>.png` 覆盖进 `botc/icons/` 即可，不用改代码
- 换装饰：把同名文件覆盖进 `botc/assets/`（`corner.svg` 角花、`divider.svg` 分隔线、`seal.svg` 火漆印、
  `runes.svg` 法阵、`bloodmoon.svg` 血月、`vignette.svg` 暗角、`tower.svg` 钟楼、`birds.svg` 飞鸟、`chapter.svg` 章节花饰）
- **部署时整个文件夹一起拖**，这两个目录会自动带上
