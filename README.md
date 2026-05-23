# BWH Admin

搬瓦工 (BandwagonHost) VPS 自建管理面板，基于 KiwiVM API 构建。

## 技术栈

- **前端**: Next.js 15 (App Router) + Ant Design 5
- **数据库**: TiDB Cloud (通过 Drizzle ORM)
- **语言**: TypeScript

## 功能

| 页面 | 功能 |
|------|------|
| 仪表盘 | 服务信息、带宽使用量、服务器实时状态 |
| VPS 控制 | 启动 / 停止 / 重启 / 强制停止 |
| 快照管理 | 创建 / 恢复 / 删除 / 锁定 / 导入 / 导出 |
| 备份管理 | 查看备份 / 复制为快照 |
| 系统安装 | 选择系统 / 重装系统 |
| 网络管理 | IPv6 / 私有 IP / PTR 记录 / SSH 密钥 |
| 设置 | 主机名 / 通知偏好 / 数据中心迁移 / 审计日志 |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local` 并填入你的信息：

```bash
# TiDB Cloud
TIDB_HOST=gateway01.us-east-1.prod.aws.tidbcloud.com
TIDB_PORT=4000
TIDB_USER=your_username
TIDB_PASSWORD=your_password
TIDB_DATABASE=bwh_admin

# BandwagonHost API
BWH_VEID=885619
BWH_API_KEY=your_api_key
```

- **TIDB_\***: 在 [TiDB Cloud](https://tidbcloud.com/) 控制台获取连接信息
- **BWH_VEID / BWH_API_KEY**: 在 KiwiVM 面板的 [API](https://kiwivm.64clouds.com/885619/api.php) 页面获取

### 3. 创建数据库表

```bash
npm run db:push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 常用命令

```bash
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run start        # 启动生产服务
npm run lint         # ESLint 检查
npm run db:push      # 推送 Schema 到数据库
npm run db:generate  # 生成迁移 SQL
npm run db:migrate   # 执行迁移
npm run db:studio    # 打开 Drizzle Studio
```

## 项目结构

```
src/
├── app/                    # 页面路由
│   ├── api/bwh/route.ts   # KiwiVM API 代理
│   ├── control/           # VPS 控制
│   ├── snapshots/         # 快照管理
│   ├── backups/           # 备份管理
│   ├── os/                # 系统安装
│   ├── network/           # 网络管理
│   └── settings/          # 设置
├── components/             # UI 组件
├── lib/
│   ├── kiwivm.ts          # KiwiVM API 封装
│   ├── api.ts             # 前端请求封装
│   └── db.ts              # 数据库连接
└── db/
    └── schema.ts          # 数据库 Schema
```

## API 代理架构

```
浏览器 → POST /api/bwh → kiwivm.ts → api.64clouds.com/v1
```

所有 KiwiVM API 调用通过服务端代理转发，API Key 不暴露给浏览器。

## License

Private
