# 三角洲俱乐部 - 部署指南

本文档详细说明了如何将三角洲俱乐部项目部署到不同的平台。

## 📋 部署前准备

### 1. 环境变量配置

确保您有以下环境变量：

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 构建测试

在部署前，请先在本地测试构建：

```bash
npm install
npm run build
npm run preview
```

## 🚀 Vercel 部署

### 方法一：通过 Vercel CLI

1. 安装 Vercel CLI：
```bash
npm i -g vercel
```

2. 登录并部署：
```bash
vercel login
vercel --prod
```

### 方法二：通过 GitHub 集成

1. 将代码推送到 GitHub 仓库
2. 在 [Vercel Dashboard](https://vercel.com/dashboard) 中导入项目
3. 配置环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. 部署将自动开始

### 方法三：使用 GitHub Actions

项目已配置 GitHub Actions 自动部署。需要在 GitHub 仓库设置中添加以下 Secrets：

- `VERCEL_TOKEN`: Vercel 访问令牌
- `ORG_ID`: Vercel 组织 ID
- `PROJECT_ID`: Vercel 项目 ID
- `VITE_SUPABASE_URL`: Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase 匿名密钥

## 🌐 Netlify 部署

### 方法一：通过 Netlify CLI

1. 安装 Netlify CLI：
```bash
npm install -g netlify-cli
```

2. 登录并部署：
```bash
netlify login
netlify init
netlify deploy --prod
```

### 方法二：通过 Git 集成

1. 将代码推送到 GitHub/GitLab/Bitbucket
2. 在 [Netlify Dashboard](https://app.netlify.com/) 中连接仓库
3. 配置构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
4. 添加环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 方法三：拖拽部署

1. 运行 `npm run build`
2. 将 `dist` 文件夹拖拽到 [Netlify Deploy](https://app.netlify.com/drop)

## 🐳 Docker 部署

创建 Dockerfile：

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

创建 nginx.conf：

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

构建和运行：

```bash
docker build -t delta-club .
docker run -p 80:80 delta-club
```

## ☁️ 其他云平台

### AWS S3 + CloudFront

1. 构建项目：`npm run build`
2. 将 `dist` 文件夹上传到 S3 存储桶
3. 配置 S3 静态网站托管
4. 设置 CloudFront 分发，配置错误页面重定向到 `index.html`

### Firebase Hosting

1. 安装 Firebase CLI：`npm install -g firebase-tools`
2. 初始化：`firebase init hosting`
3. 配置 `firebase.json`：
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```
4. 部署：`firebase deploy`

## 🔧 故障排除

### 常见问题

1. **路由问题**：确保服务器配置了 SPA 重写规则
2. **环境变量**：检查所有必需的环境变量是否正确设置
3. **构建失败**：运行 `npm run build` 检查本地构建是否成功
4. **Supabase 连接**：验证 Supabase URL 和密钥是否正确

### 调试步骤

1. 检查浏览器控制台错误
2. 验证网络请求是否成功
3. 确认环境变量在生产环境中正确设置
4. 检查服务器日志（如果适用）

## 📊 性能优化

项目已配置以下优化：

- **代码分割**：自动分割 vendor、router、supabase 和 UI 库
- **资源压缩**：使用 Terser 压缩 JavaScript
- **缓存策略**：静态资源设置长期缓存
- **安全头**：配置安全相关的 HTTP 头

## 🔄 持续部署

推荐使用 GitHub Actions 进行持续部署：

1. 每次推送到 `main` 分支自动部署到生产环境
2. Pull Request 自动创建预览部署
3. TypeScript 检查和构建验证
4. 自动化测试（可扩展）

---

如有问题，请查看各平台的官方文档或联系开发团队。