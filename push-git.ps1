# push-git.ps1 —— 把当前文件夹一键推送到 Git 仓库（GitHub / Gitee 通用）
#
# 用法（在本文件夹里打开 PowerShell）：
#   1) 第一次，指定仓库地址：
#        .\push-git.ps1 -Repo https://gitee.com/你的用户名/botc.git
#   2) 以后直接：
#        .\push-git.ps1
#
# 如果提示「禁止运行脚本」，改用：
#        powershell -ExecutionPolicy Bypass -File .\push-git.ps1 -Repo 你的仓库地址

param(
  [string]$Repo = '',
  [string]$Branch = 'main',
  [string]$Message = ''
)

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

function Say($text, $color = 'White') { Write-Host $text -ForegroundColor $color }

# ---------- 1. 检查 git ----------
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
  Say '没有检测到 Git。' 'Red'
  Say '方式一：安装 Git（管理员 PowerShell 里跑一次）' 'Yellow'
  Say '    winget install --id Git.Git -e'
  Say '方式二：不用 Installed Git，直接用网页上传（见 README-deploy-gitee.md）' 'Yellow'
  exit 1
}
Say ("Git: " + (& git --version)) 'Green'

# ---------- 2. 初始化仓库 ----------
if (-not (Test-Path '.git')) {
  & git init -b $Branch 2>$null
  if ($LASTEXITCODE -ne 0) { & git init | Out-Null; & git checkout -b $Branch 2>$null | Out-Null }
  Say '已初始化本地仓库' 'Green'
}

# 确保有用户信息（没配过会提交失败）
$hasName = (& git config user.name) 2>$null
if (-not $hasName) { & git config user.name "botc-deploy" }
$hasMail = (& git config user.email) 2>$null
if (-not $hasMail) { & git config user.email "botc@local" }

# ---------- 3. 提交 ----------
& git add -A
& git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Say '没有新的改动，跳过提交' 'DarkGray'
} else {
  if (-not $Message) { $Message = "update " + (Get-Date -Format 'yyyy-MM-dd HH:mm') }
  & git commit -m $Message | Out-Null
  Say ("已提交：" + $Message) 'Green'
}

# ---------- 4. 关联远程仓库 ----------
$remote = (& git remote get-url origin) 2>$null
if ($Repo) {
  if ($remote) {
    & git remote set-url origin $Repo
    Say ("已更新远程地址：" + $Repo) 'Green'
  } else {
    & git remote add origin $Repo
    Say ("已添加远程：" + $Repo) 'Green'
  }
} elseif (-not $remote) {
  Say '还没有远程仓库地址。请加参数重新运行，例如：' 'Yellow'
  Say '    .\push-git.ps1 -Repo https://gitee.com/你的用户名/botc.git'
  exit 1
}

# ---------- 5. 推送 ----------
Say '正在推送（首次会要求输入用户名/密码或授权码）...' 'Cyan'
& git push -u origin $Branch
if ($LASTEXITCODE -eq 0) {
  Say '推送完成 ✅ 现在去帽子云新建静态网站，选这个仓库即可' 'Green'
} else {
  Say '推送失败。常见原因：' 'Red'
  Say '  · 仓库还没在网页上创建（先去 Gitee/GitHub 建一个空仓库）'
  Say '  · 账号密码错误（Gitee 建议用「私人令牌」当密码）'
  Say '  · 网络问题（Gitee 国内比 GitHub 稳）' 'Yellow'
  exit 1
}
