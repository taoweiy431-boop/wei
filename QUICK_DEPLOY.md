# 🚀 快速部署指南

## 📋 部署前准备

✅ **项目状态检查**
- [x] 项目已构建成功 (`npm run build`)
- [x] TypeScript 无错误
- [x] Supabase 配置完成
- [x] 部署配置文件已生成

## 🎯 推荐部署方式

### 方式 1: 使用自动部署脚本 (推荐)

```powershell
# 在项目目录中运行
.\deploy.ps1

# 或指定平台
.\deploy.ps1 vercel
.\deploy.ps1 netlify
.\deploy.ps1 github
```

### 方式 2: 手动部署命令

#### Vercel 部署
```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel --prod
```

#### Netlify 部署
```bash
# 1. 安装 Netlify CLI
npm install -g netlify-cli

# 2. 登录
netlify login

# 3. 部署
netlify deploy --prod --dir=dist
```

#### 拖拽部署 (最简单)
1. 访问 https://app.netlify.com/drop
2. 将 `dist` 文件夹拖拽到页面
3. 在设置中配置环境变量

## 🔑 环境变量配置

在部署平台中设置：
```
VITE_SUPABASE_URL=你的_supabase_项目_url
VITE_SUPABASE_ANON_KEY=你的_supabase_anon_key
```

## ✅ 部署验证

部署完成后测试：
- [ ] 网站可访问
- [ ] 登录功能正常
- [ ] 路由跳转正常
- [ ] 数据库连接正常

## 🆘 遇到问题？

1. **404 错误**: vercel.json 已配置 SPA 路由
2. **白屏**: 检查环境变量和浏览器控制台
3. **登录失败**: 在 Supabase 中添加部署域名

---

**💡 提示**: 首次部署推荐使用拖拽方式，简单快捷！