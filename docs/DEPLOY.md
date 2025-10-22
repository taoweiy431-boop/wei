# 部署与配置指南

本项目使用 Supabase 作为后端（Auth/DB/存储）并通过 EdgeOne Pages 发布，支持全球加速与WAF/DDoS防护。

## 1. 初始化 Supabase 项目

1. 在 Supabase 控制台创建新项目，记录 `Project URL` 与 `Anon Key`。
2. 打开 SQL Editor，执行 `supabase/schema.sql` 中的全部脚本：
   - 创建 `profiles / tasks / claims / transactions / audit_logs`
   - 启用 RLS 与策略
   - 创建 RPC：`claim_task` 与 `complete_task`
   - 创建触发器与信誉计算函数
3. （可选）在 `Storage` 中创建 `proofs` bucket，如需私有访问保持非公开。

## 2. 配置前端环境变量

复制 `.env.example` 为 `.env` 并填入：

```
VITE_SUPABASE_URL=你的SupabaseURL
VITE_SUPABASE_ANON_KEY=你的AnonKey
```

## 3. 本地运行与构建

```
# 在项目根目录
cd delta-club-supabase
npm i
npm run dev
npm run build
```

构建产物位于 `delta-club-supabase/dist/`。

## 4. EdgeOne 发布与安全

- 通过 EdgeOne Pages 创建站点并指向 `dist/` 构建目录。
- 参考 `edgeone.config.json` 开启：
  - DDoS 防护与速率限制
  - WAF 常见规则（SQLi/XSS/后台路径挑战）
  - TLS1.2+ 与 HSTS

## 5. 监控与备份

- 使用 Supabase Project Settings 中的日志与审计 (Audit Logs)
- 定期开启数据库自动备份与漏洞扫描（可集成 GitHub Actions 定期运行安全扫描）

## 6. 权限与RLS确认清单

- 未登录用户：不可访问任何数据
- 登录用户（worker）：
  - 可查看 `open` 任务与自身相关任务
  - 可通过 RPC 抢单与结算任务
- 登录用户（csr/admin）：
  - 可创建任务与查看全部任务

## 7. 抢单公平性说明

- 抢单通过 `UPDATE ... WHERE status='open'` 的原子操作实现，事务内只允许首个成功更新者获胜；
- RPC 中加入每秒最多 3 次的限速；
- 所有动作写入 `audit_logs`，可用于风控与反作弊分析。