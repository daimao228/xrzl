# 德国蟑螂联机重写说明（交接文档）

> 给新会话的 AI：请先通读本文件，再动代码。目标是把 `dgzl-online.html` 的联机同步层**按已验证的模式重写**，不要沿用当前的「房主选举」实现。

---

## 1. 项目背景

一套自制的「血染钟楼」助手 + 「德国蟑螂」桌游页面，纯静态 HTML/CSS/JS，无构建工具、无框架、无 CDN（国内网络限制）。

- **运行环境**：部署在「帽子云」（国内静态托管）+ Supabase（仅作消息中转，HTTP 轮询）。
- **访问域名**：`https://xrzl-10d3t3ul.maozi.io/`
- **Git 仓库**：`https://github.com/daimao228/xrzl.git`（分支 `main`）
- **本地目录**：当前工作目录即项目根目录。

## 2. 帽子云平台的硬性限制（务必遵守）

| 现象 | 原因 | 应对 |
|---|---|---|
| 带 `.html` 的地址返回 308 | 平台把 `/dm.html` 跳到 `/dm` | 线上链接用**无扩展名**路径 |
| 带 `?查询参数` 的地址返回 404 | 平台把 `/dm?x=1` 307 跳到 `/dm/?x=1` 再 404 | **房间号用 `#room=xxx` 传递** |
| 部署后看到旧页面 | HTML 有 `Cache-Control: max-age=1200` | 强刷 / 无痕 |
| 卡面图片 | 原素材 46MB 未入库 | 已压缩为 `dgzl-cards/*.webp`（0.52MB） |

链接一律长这样：

```
https://xrzl-10d3t3ul.maozi.io/dgzl-online#room=123
https://xrzl-10d3t3ul.maozi.io/lobby#room=123
```

## 3. 文件清单

| 文件 | 说明 | 能否修改 |
|---|---|---|
| `room.html` | **房间层验证页，已跑通**。只有在线状态 + 座位认领 | 参考实现，不要改 |
| `dgzl.html` | 德国蟑螂**稳定单机版**（当前对外主链接） | **禁止修改** |
| `dgzl-local.html` | 稳定版备份 | 不改 |
| `dgzl-online.html` | 联机实验版，**本次重写目标** | 可随意重写 |
| `lobby.html` | 游戏大厅（名字 + 房间号，三个入口） | 不改 |
| `shared.js` | 公共库：Supabase 连接、房间号、角色表 | 如需扩展接口可改，注意别破坏 BOTC |
| `supabase-config.js` | Supabase 地址 / 密钥 / 传输模式 | 不改 |
| `dm.html` / `player.html` / `spectator.html` | 血染钟楼三端 | 不改 |
| `dgzl-cards/` | 压缩后的卡面（8 物种 × 8 张，webp 320×460） | 不改 |

## 4. 已验证可用的同步模式（room.html）——照这个抄

`room.html` 在真机上验证过「座位同步」正常。核心思想：**没有权威节点，每个客户端定时广播自己的状态，对端按规则合并**。

```js
/* 每 3~4 秒重复广播，丢包/后加入都能自愈 */
function beacon() {
  ch.send('rt_here', { id: meId, name: meName, seat: mySeat, ts: Date.now() });
}
setInterval(beacon, 4000);

/* 座位归属由所有端各自计算，规则一致 → 结果一致 */
const owner = new Array(SEAT_COUNT).fill(null);
peers.forEach(([id, p]) => {
  if (!owner[p.seat] || id < owner[p.seat].id) owner[p.seat] = { id, name: p.name };
});
```

要点：

1. **周期性重播**，而不是"有变化才发"（这是旧实现失败的根因）
2. **无中心**，冲突用确定性规则（id 字典序）收敛
3. 收到消息后立刻重绘
4. 心跳超过 15 秒视为离线

## 5. 旧实现为什么失败（不要重蹈覆辙）

`dgzl-online.html` 现在用的是「房主选举 + 只在变化时广播」：

- 后加入的客户端错过房主那次广播 → 永远拿不到状态
- 两台设备可能同时自认为房主 → 每 2 秒互相覆盖牌局 → **看起来像"自动清空"**
- 座位分配逻辑依赖房主内存里的 `netId`，状态序列化时丢字段 → 认领无效

**结论：删除整套 `netRole / hostTimer / dg_hello / dg_state` 实现，重新设计。**

## 6. 重写要求（功能清单）

### 6.1 房间与身份

- 从 URL `#room=xxx` 取房间号（参考 `shared.js` 的 `getRoomCode()`）
- 名字优先取 `localStorage['botc_lobby'].name`，允许本页改名（存 `sessionStorage`）
- 每个标签页有独立 id（`sessionStorage`），刷新视为新设备

### 6.2 座位

- 人数 **4～8 可调**（房主/座位 1 的人改）
- 圆桌自动排座：`角度 = -90° + i * 360°/n`，用 `left/top` 百分比定位
- **空位可点，认领后名字同步给所有端**
- 座位冲突：座位号小者、id 小者优先（确定性规则）

### 6.3 牌局

- 规则沿用 `dgzl.html`（**皇家版**：皇冠牌触发惩罚堆抽牌，抽到皇冠继续抽）
- **每人只能看到自己的手牌**，别人只显示张数
- 拖拽操作保留：拖自己的手牌到某个座位 → 弹「这是哪种虫 / 这是皇冠」→ 结算
- 回合限制：只有当前玩家能拖牌；被传牌的人才能「相信 / 质疑 / 传给别人」

### 6.4 拍桌（已有，保留）

- 底部有常驻的 **「👋 测试拍桌」** 按钮（不依赖牌局状态，随时可测）
- 点击后：手掌下落动画 + 桌面震动 + 全房间同步（`dg_slam` 消息）

## 7. 建议的消息协议

所有消息走 `shared.js` 的 `openChannel(room, handler)`：

| 消息 | 方向 | 载荷 | 用途 |
|---|---|---|---|
| `dg_presence` | 人人广播，每 3s | `{id, name, seat, ts}` | 在线 + 座位认领 |
| `dg_game` | 座位 1 广播，每 2s | `{ts, players:[{seat,name,count,faceUp}], turn, cardInPlay, penaltyCount, over, log, hostSeat}` | 公共牌局 |
| `dg_hand` | 座位 1 发给本人 | `{toId, seat, hand}` | 私有手牌（收件人校验 `toId`） |
| `dg_act` | 客户端 → 座位 1 | `{id, seat, kind:'play'|'pass'|'accept', cardIndex, targetSeat, claim, believe}` | 操作请求 |
| `dg_slam` | 人人可发 | `{by, ts}` | 拍桌动画 |

约定：

- **座位 1 是唯一结算者**；他每 2 秒重播 `dg_game`，客户端只认最新 `ts`
- 座位 1 离开（15 秒无心跳）→ 由座位 2 接替（依次顺延）
- 每个客户端都保存"最后一次收到的牌局"，重连后靠重播自动追平

## 8. 验收清单

- [ ] A 开房间 → 成为座位 1，发牌，其余座位显示「空位 · 点击入座」
- [ ] B 进入 → 看到同样的牌桌，点空位即可入座，双方 3 秒内一致
- [ ] B 的手牌区只显示自己的牌，A 那边只看到 B 的张数
- [ ] 不是自己回合时，拖牌无效；被传牌时只有该玩家看到「相信 / 质疑 / 传给别人」
- [ ] 任意设备点「测试拍桌」→ 所有设备同时震动 + 日志显示「XX 拍了桌子」
- [ ] 断网 10 秒再恢复 → 牌局自动追平，不需要刷新
- [ ] 座位 1 关闭页面 → 20 秒内其余玩家接管，牌局继续

## 9. 部署与测试

```powershell
.\push-git.cmd            # 提交并推送
```

然后帽子云 → 部署记录 → 重新部署 → 页面 **Ctrl+F5** 强刷。

本地可先用两个标签页打开 `room.html#room=123` 验证连接是否正常，再测 `dgzl-online.html`。

## 10. 禁忌

1. **不要修改 `dgzl.html`**（对外稳定版），重写在 `dgzl-online.html` 上做
2. **不要用 `?room=` 传参**，帽子云会 404
3. **不要"只在变化时广播"**，必须周期性重播
4. 不要引入任何 CDN / 构建工具 / 框架，保持纯静态
5. 大改后跑一次语法校验（项目里有 `_chk/validate.py`，用随附 Python 执行）
