# 三角洲俱乐部 - 自动部署脚本
# 使用方法: .\deploy.ps1 [platform]
# 支持平台: vercel, netlify, github

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("vercel", "netlify", "github", "")]
    [string]$Platform = ""
)

Write-Host "🚀 三角洲俱乐部 - 自动部署脚本" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# 检查是否在正确的目录
if (!(Test-Path "package.json")) {
    Write-Host "❌ 错误: 请在项目根目录 (delta-club-supabase) 中运行此脚本" -ForegroundColor Red
    exit 1
}

# 检查环境变量
Write-Host "🔍 检查环境变量..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Write-Host "⚠️  警告: 未找到 .env 文件，请确保在部署平台配置环境变量" -ForegroundColor Yellow
    Write-Host "   需要配置: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY" -ForegroundColor Yellow
}

# 构建项目
Write-Host "🔨 构建项目..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 构建失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 构建成功" -ForegroundColor Green

# 如果没有指定平台，显示选项
if ($Platform -eq "") {
    Write-Host ""
    Write-Host "请选择部署平台:" -ForegroundColor Cyan
    Write-Host "1. Vercel (推荐)" -ForegroundColor White
    Write-Host "2. Netlify" -ForegroundColor White
    Write-Host "3. GitHub Pages" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "请输入选择 (1-3)"
    
    switch ($choice) {
        "1" { $Platform = "vercel" }
        "2" { $Platform = "netlify" }
        "3" { $Platform = "github" }
        default { 
            Write-Host "❌ 无效选择" -ForegroundColor Red
            exit 1
        }
    }
}

# 执行部署
switch ($Platform) {
    "vercel" {
        Write-Host "🚀 部署到 Vercel..." -ForegroundColor Yellow
        
        # 检查 Vercel CLI
        $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
        if (!$vercelInstalled) {
            Write-Host "📦 安装 Vercel CLI..." -ForegroundColor Yellow
            npm install -g vercel
        }
        
        Write-Host "🔐 请登录 Vercel (如果还未登录)..." -ForegroundColor Yellow
        vercel login
        
        Write-Host "🚀 开始部署..." -ForegroundColor Yellow
        vercel --prod
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Vercel 部署成功!" -ForegroundColor Green
        } else {
            Write-Host "❌ Vercel 部署失败" -ForegroundColor Red
        }
    }
    
    "netlify" {
        Write-Host "🚀 部署到 Netlify..." -ForegroundColor Yellow
        
        # 检查 Netlify CLI
        $netlifyInstalled = Get-Command netlify -ErrorAction SilentlyContinue
        if (!$netlifyInstalled) {
            Write-Host "📦 安装 Netlify CLI..." -ForegroundColor Yellow
            npm install -g netlify-cli
        }
        
        Write-Host "🔐 请登录 Netlify (如果还未登录)..." -ForegroundColor Yellow
        netlify login
        
        Write-Host "🚀 开始部署..." -ForegroundColor Yellow
        netlify deploy --prod --dir=dist
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Netlify 部署成功!" -ForegroundColor Green
        } else {
            Write-Host "❌ Netlify 部署失败" -ForegroundColor Red
        }
    }
    
    "github" {
        Write-Host "🚀 部署到 GitHub Pages..." -ForegroundColor Yellow
        
        # 检查是否安装了 gh-pages
        $ghPagesInstalled = npm list gh-pages --depth=0 2>$null
        if (!$ghPagesInstalled) {
            Write-Host "📦 安装 gh-pages..." -ForegroundColor Yellow
            npm install --save-dev gh-pages
        }
        
        # 检查 package.json 中是否有 deploy 脚本
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if (!$packageJson.scripts.deploy) {
            Write-Host "📝 添加部署脚本到 package.json..." -ForegroundColor Yellow
            $packageJson.scripts | Add-Member -Name "deploy" -Value "npm run build && gh-pages -d dist" -MemberType NoteProperty
            $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
        }
        
        Write-Host "🚀 开始部署..." -ForegroundColor Yellow
        npm run deploy
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ GitHub Pages 部署成功!" -ForegroundColor Green
            Write-Host "📝 请确保在 GitHub 仓库设置中启用 GitHub Pages" -ForegroundColor Yellow
        } else {
            Write-Host "❌ GitHub Pages 部署失败" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "🎉 部署完成!" -ForegroundColor Green
Write-Host "📋 部署后检查清单:" -ForegroundColor Cyan
Write-Host "   ✓ 网站可正常访问" -ForegroundColor White
Write-Host "   ✓ 用户登录功能正常" -ForegroundColor White
Write-Host "   ✓ 页面路由工作正常" -ForegroundColor White
Write-Host "   ✓ Supabase 数据库连接正常" -ForegroundColor White
Write-Host ""
Write-Host "💡 提示: 记得在 Supabase 项目设置中添加部署域名!" -ForegroundColor Yellow