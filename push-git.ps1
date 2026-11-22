# push-git.ps1 —— 把当前文件夹一键推送到 Git 仓库
#
# 最简单的用法：直接双击同目录的 push-git.cmd（会自动绕过执行策略限制）
#
# 手动运行：
#   powershell -ExecutionPolicy Bypass -File .\push-git.ps1
#   powershell -ExecutionPolicy Bypass -File .\push-git.ps1 -Repo https://github.com/用户名/仓库.git
#
# 只预览、不推送：
#   powershell -ExecutionPolicy Bypass -File .\push-git.ps1 -DryRun

param(
  [string]$Repo = '',
  [string]$Branch = 'main',
  [string]$Message = '',
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

function Say($text, $color = 'White') { Write-Host $text -ForegroundColor $color }

# ---------- 1. 找 git（兼容 PATH 里没有的情况） ----------
$gitExe = $null
$cmd = Get-Command git -ErrorAction SilentlyContinue
if ($cmd) {
  $gitExe = $cmd.Source
} else {
  foreach ($p in @(
    'C:\Program Files\Git\cmd\git.exe',
    'C:\Program Files (x86)\Git\cmd\git.exe',
    "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe"
  )) {
    if (Test-Path $p) { $gitExe = $p; break }
  }
}

if (-not $gitExe) {
  Say '没有找到 Git。' 'Red'
  Say '安装命令（管理员 PowerShell 跑一次，然后重开窗口）：' 'Yellow'
  Say '    winget install --id Git.Git -e'
  Say '或者直接用网页上传：见 README-deploy.md' 'Yellow'
  exit 1
}
Say ("Git: " + (& $gitExe --version)) 'Green'

function Git { param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArgs) & $gitExe @GitArgs }

# ---------- 2. 初始化仓库 ----------
if (-not (Test-Path '.git')) {
  & $gitExe init -b $Branch | Out-Null
  if ($LASTEXITCODE -ne 0) { Git init | Out-Null; Git checkout -b $Branch 2>$null | Out-Null }
  Say '已初始化本地仓库' 'Green'
}

$hasName = (& $gitExe config user.name) 2>$null
if (-not $hasName) { Git config user.name 'botc-deploy' }
$hasMail = (& $gitExe config user.email) 2>$null
if (-not $hasMail) { Git config user.email 'botc@local' }

# ---------- 3. 关联远程 ----------
$remote = (& $gitExe remote get-url origin) 2>$null
if ($Repo) {
  if ($remote) { Git remote set-url origin $Repo; Say ("已更新远程：" + $Repo) 'Green' }
  else { Git remote add origin $Repo; Say ("已添加远程：" + $Repo) 'Green' }
} elseif (-not $remote) {
  Say '还没有远程仓库地址。请加参数，例如：' 'Yellow'
  Say '    .\push-git.ps1 -Repo https://github.com/daimao228/xrzl.git'
  exit 1
} else {
  Say ("远程：" + $remote) 'DarkGray'
}

# ---------- 4. 暂存 ----------
& $gitExe add -A
& $gitExe diff --cached --quiet
$nothingToCommit = ($LASTEXITCODE -eq 0)

# ---------- 5. 预览模式 ----------
if ($DryRun) {
  Say '--- 预览（-DryRun，不会提交也不会推送）---' 'Cyan'
  & $gitExe status --short
  if ($nothingToCommit) { Say '没有需要提交的改动' 'DarkGray' }
  Say ("分支: " + $Branch) 'DarkGray'
  exit 0
}

# ---------- 6. 提交 ----------
if ($nothingToCommit) {
  Say '没有新的改动，跳过提交' 'DarkGray'
} else {
  if (-not $Message) { $Message = 'update ' + (Get-Date -Format 'yyyy-MM-dd HH:mm') }
  & $gitExe commit -m $Message | Out-Null
  Say ("已提交：" + $Message) 'Green'
}

# ---------- 7. 推送 ----------
Say '正在推送（首次会要求输入用户名 / 令牌）...' 'Cyan'
& $gitExe push -u origin $Branch
if ($LASTEXITCODE -eq 0) {
  Say '推送完成 ✅ 现在去帽子云「部署记录 → 重新部署」' 'Green'
} else {
  Say '推送失败。常见原因：' 'Red'
  Say '  · 仓库还不存在（先去 GitHub 建一个空仓库）'
  Say '  · 密码用错：GitHub 的「密码」必须填 Personal Access Token'
  Say '  · 网络连不上 github.com（开 VPN，并给 git 配代理）' 'Yellow'
  exit 1
}


