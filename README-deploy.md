# 部署到帽子云（MaoziYun）

> 帽子云的静态站只能从 **Git 仓库** 拉代码，不能拖文件夹。所以有两种上传方式：**网页拖拽（不用装任何东西）** 或 **Git 推送**。

---

## 方式一：网页拖拽（推荐先试，零安装）

### 1. 建一个空仓库

**Gitee**（国内快）：<https://gitee.com/projects/new> → 仓库名 `botc` → **不要**勾选「使用 Readme 初始化」→ 创建
**GitHub**：<https://github.com/new> → 同样建空仓库

### 2. 上传文件

进入刚建好的空仓库 → 点 **上传文件 / Upload files** → 把 `新建文件夹 (3)` 里的这些东西整份拖进去（保持文件夹结构）：

```
index.html               站点首页（两个游戏的入口）
shared/                  公共模块：shared.js、supabase-config.js
botc/                    血染钟楼：dm / player / spectator / lobby … + assets、icons
dgzl/                    德国蟑螂：online（联机）、cards（卡面）
_redirects               可选，帽子云用不到
```

> 网页上传支持整个文件夹拖拽；文件超过 100 个时分两批传。
> `dgzl/原素材/` 是 46MB 的原始卡面，已在 `.gitignore` 里，**不要上传**。

提交后仓库结构应该是这样（首页在根目录，两个游戏各一个文件夹）：

```
仓库根/
├── index.html            ← 站点首页
├── shared/
│   ├── shared.js         ← 通信 / 角色表（两端共用）
│   └── supabase-config.js
├── botc/                 ← 血染钟楼
│   ├── index.html        ← 房间入口（DM / 玩家 / 旁观 / 大厅）
│   ├── dm.html  player.html  spectator.html  lobby.html  diagnose.html
│   ├── assets/
│   └── icons/
└── dgzl/                 ← 德国蟑螂
    ├── online.html       ← 联机版（唯一入口）
    └── cards/            ← 卡面 webp，共 0.5MB
```

### 3. 帽子云建站

1. 注册 <https://dash.maoziyun.com/register>
2. 右上角 **新建 → 静态网站**
3. 应用名称：`botc`（小写字母数字，4~20 位）
4. 部署来源：**Gitee** 或 **GitHub** → 首次点「授权访问」
5. 选择仓库和分支（`main` 或 `master`）
6. **构建命令**：留空
7. **输出目录**：留空（或填 `/`）
8. 点部署 → 拿到 `https://botc.maozi.io` 这类域名

### 4. 加反向代理（必须，否则手机连不上 Supabase）

应用详情 → **规则 → 自定义规则 → 反向代理规则 → 添加**

| 字段 | 值 |
|---|---|
| 规则名称 | `Supabase API` |
| 匹配规则 | 自定义筛选 → **请求路径 开头是** `/rest/v1` |
| 协议 | **HTTPS** |
| Host 透传 | **使用 Upstream 节点 Host** |
| 节点 Host | `tlkziokoovtdioptbitu.supabase.co` |
| Port | `443` |
| Weight | `100` |

保存，立即生效（不用重新部署）。

### 5. 改配置

`supabase-config.js` 里：

```js
proxy: '/',            // 帽子云：同域走 /rest/v1
transport: 'poll',
```

> 如果以后切回 Netlify，把 `proxy` 改回 `'/sb'`。

### 6. 验证

手机打开 `https://botc.maozi.io/`：

- 首页出现「游戏大厅 / 血染钟楼 · 说书人端」两个入口 → 静态托管正常
- 进「游戏大厅」→ 能选 ID 登录 → 三个游戏方块 → 点方块弹房间号 → `/botc/…`、`/dgzl/…` 子目录路径也正常
- 点页面左下角状态标签 → 显示「已连接 · 轮询模式」→ 代理正常
- 显示 `failed to fetch` → 反向代理规则没生效，回去检查「请求路径 开头是 /rest/v1」和 Host 透传

---

## 方式二：Git 推送（以后频繁改版更方便）

### 1. 装 Git

管理员 PowerShell：

```powershell
winget install --id Git.Git -e
```

装完**重开**一个 PowerShell 窗口（让 PATH 生效）。

### 2. 一键推送

在 `新建文件夹 (3)` 里右键 → **在终端中打开**，第一次：

```powershell
.\push-git.ps1 -Repo https://gitee.com/你的用户名/botc.git
```

以后改完直接：

```powershell
.\push-git.ps1
```

脚本会自动：初始化仓库 → 提交改动 → 关联远程 → 推送。

### 3. 关于密码

- **Gitee**：到「设置 → 私人令牌」生成一个令牌，推送时**密码填令牌**（不是登录密码）
- **GitHub**：2021 年后已不支持密码推送，必须用 [Personal Access Token](https://github.com/settings/tokens)（勾 `repo` 权限）当密码

### 4. 帽子云那边

仓库有新提交后，进入应用 → **部署记录** → **重新部署**（或在部署来源里开启自动部署）。

---

## 常见问题

| 现象 | 原因 |
|---|---|
| 页面 404 | 输出目录填错了；应该留空或 `/`，且 `index.html` 在仓库根目录 |
| `failed to fetch` | 反向代理规则没生效，或 Host 透传选错 |
| 图标不显示 | `botc/icons/` 文件夹没上传成功 |
| 样式错乱 | `botc/assets/` 没上传，或被多套了一层文件夹 |
| 推送时 403 | 密码用了登录密码，应改用令牌 |
