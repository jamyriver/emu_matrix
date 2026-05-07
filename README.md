<div align="center">

# EMU_Matrix

**云复古游戏平台 — 在浏览器中畅玩经典游戏**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.3-green.svg)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)](https://nodejs.org/)

[English](README_EN.md) | 中文

</div>

---

## 项目概述

EMU_Matrix 是一个基于微服务架构的云复古游戏平台，支持在浏览器中直接运行 FC/NES、Sega Genesis/MD、Super Nintendo/SFC、Game Boy/GBC 以及 Game Boy Advance 等经典游戏平台的 ROM 游戏。项目采用 TypeScript 全栈开发，集成了 EmulatorJS 模拟器核心，提供云端存档、截图、录屏、多人联机等功能，让经典游戏触手可及。

## 核心功能

### 🎮 多平台游戏支持

| 平台 | 模拟器核心 | ROM 格式 | 原生分辨率 |
|------|-----------|----------|-----------|
| FC / NES | fceumm | .nes | 256×240 |
| Sega Genesis / MD | genesis_plus_gx | .md, .gen, .smd, .bin | 320×224 |
| Super Nintendo / SFC | snes9x | .sfc, .smc | 256×224 |
| Game Boy / GBC | gambatte | .gb, .gbc | 160×144 |
| Game Boy Advance | mgba | .gba | 240×160 |

### 💾 云存档系统
- 最多 5 个手动存档位 + 1 个自动存档位
- 自动存档间隔 60 秒，防止进度丢失
- 跨设备同步，随时随地继续游戏

### 📸 截图与录屏
- 一键截图并上传至云端存储
- 游戏录屏功能（最长 30 分钟）
- 支持公开/私密分享设置

### 🌐 多人联机
- 基于 WebSocket 的实时信令服务
- WebRTC 点对点连接，低延迟游戏体验
- 房间码邀请机制，快速加入对战

### 📱 移动端适配
- 自动检测触屏设备并显示虚拟按键
- 各平台独立按键映射（D-Pad、A/B、L/R、Start/Select）
- 响应式布局，适配不同屏幕尺寸

### 🔐 用户系统
- JWT 双令牌认证（Access Token + Refresh Token）
- 密码 bcrypt 加密存储
- 登录速率限制，防止暴力破解

## 系统架构

```
┌─────────────┐     ┌──────────────┐
│   Frontend  │────▶│ API Gateway  │ :3000
│  (Vue 3)    │     │  (Express)   │
│  :80        │     └──────┬───────┘
└──────┬──────┘            │
       │                   ├──────────────┬──────────────┬──────────────┐
       │                   ▼              ▼              ▼              ▼
       │            ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
       │            │  Auth    │   │  Game    │   │  Save    │   │  Media   │
       │            │ Service  │   │ Service  │   │ Service  │   │ Service  │
       │            │  :3001   │   │  :3002   │   │  :3003   │   │  :3004   │
       │            └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
       │                 │              │              │              │
       │                 ▼              ▼              ▼              ▼
       │            ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
       │            │PostgreSQL│   │  Redis   │   │  MinIO   │   │  Redis   │
       │            │   :5432  │   │  :6379   │   │  :9000   │   │  :6379   │
       │            └──────────┘   └──────────┘   └──────────┘   └──────────┘
       │
       ├─────────────┐
       │  WebSocket  │
       │  Service    │ :3005
       │ (Socket.IO) │
       └─────────────┘
```

### 微服务组件

| 服务 | 端口 | 职责 |
|------|------|------|
| **Frontend** | 80 | Vue 3 SPA，Nginx 托管 |
| **API Gateway** | 3000 | 统一入口，路由转发，速率限制 |
| **Auth Service** | 3001 | 用户注册/登录，JWT 令牌管理 |
| **Game Service** | 3002 | 游戏列表，ROM 管理，平台验证 |
| **Save Service** | 3003 | 云存档 CRUD，存档位管理 |
| **Media Service** | 3004 | 截图/录屏上传，MinIO 对象存储 |
| **WS Service** | 3005 | WebSocket 信令，房间管理，WebRTC 中继 |

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 + TypeScript + Vite |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| UI 样式 | Tailwind CSS |
| HTTP 客户端 | Axios |
| 实时通信 | Socket.IO Client |
| 后端框架 | Express + TypeScript |
| 数据库 | PostgreSQL 15 |
| 缓存 | Redis 7 |
| 对象存储 | MinIO |
| 模拟器 | EmulatorJS |
| 认证 | JWT (jsonwebtoken) + bcryptjs |
| 容器化 | Docker + Docker Compose |
| 包管理 | npm workspaces |

## 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** >= 20.10（部署模式）
- **Docker Compose** >= 2.0（部署模式）
- **PostgreSQL** >= 15（本地开发）
- **Redis** >= 7（本地开发）

## 安装与运行

### 方式一：Docker Compose 一键部署（推荐）

1. **克隆项目**

```bash
git clone https://github.com/jamyriver/emu_matrix.git
cd emu_matrix
```

2. **配置环境变量**

```bash
cp .env.example .env
```

编辑 `.env` 文件，修改以下关键配置：

```env
JWT_ACCESS_SECRET=your-secure-access-secret
JWT_REFRESH_SECRET=your-secure-refresh-secret
```

3. **启动所有服务**

```bash
docker-compose up -d
```

4. **访问应用**

- 前端界面：http://localhost
- API 网关：http://localhost:3000/health
- MinIO 控制台：http://localhost:9001

### 方式二：本地开发

1. **克隆项目并安装依赖**

```bash
git clone https://github.com/jamyriver/emu_matrix.git
cd emu_matrix
npm install
```

2. **启动基础设施**

确保 PostgreSQL 和 Redis 已运行，然后创建数据库：

```bash
createdb -U postgres retro_cloudgame
psql -U postgres -d retro_cloudgame -f database/migrations/001_init.sql
psql -U postgres -d retro_cloudgame -f database/migrations/002_seed_games.sql
psql -U postgres -d retro_cloudgame -f database/migrations/003_add_gb_gba_games.sql
```

3. **配置环境变量**

```bash
cp .env.example .env
# 编辑 .env 文件，填入本地数据库和 Redis 连接信息
```

4. **构建共享包**

```bash
npm run build:shared
```

5. **启动各服务（在不同终端中）**

```bash
# 终端 1 - 认证服务
npm run dev:auth

# 终端 2 - 游戏服务
npm run dev:game

# 终端 3 - 存档服务
npm run dev:save

# 终端 4 - 媒体服务
npm run dev:media

# 终端 5 - API 网关
npm run dev:gateway

# 终端 6 - WebSocket 服务
npm run dev:ws

# 终端 7 - 前端
npm run dev:frontend
```

6. **访问前端开发服务器**

- 前端：http://localhost:5173
- API 网关：http://localhost:3000

## 项目结构

```
EMU_Matrix/
├── database/
│   └── migrations/           # 数据库迁移脚本
│       ├── 001_init.sql      # 基础表结构
│       ├── 002_seed_games.sql # NES/MD/SNES 种子游戏
│       └── 003_add_gb_gba_games.sql # GB/GBA 种子游戏
├── packages/
│   ├── shared/               # 共享类型、常量、工具函数
│   │   └── src/
│   │       ├── types.ts      # TypeScript 类型定义
│   │       ├── constants.ts  # 平台配置、核心映射
│   │       └── utils.ts      # ROM 验证、格式检测
│   ├── frontend/             # Vue 3 前端应用
│   │   └── src/
│   │       ├── api/          # API 请求封装
│   │       ├── views/        # 页面组件
│   │       │   ├── auth/     # 登录/注册
│   │       │   ├── game/     # 游戏大厅/游戏房间
│   │       │   └── user/     # 个人中心/存档/截图/录屏
│   │       ├── stores/       # Pinia 状态管理
│   │       └── router/       # 路由配置
│   ├── auth-service/         # 认证微服务
│   ├── game-service/         # 游戏微服务
│   ├── save-service/         # 存档微服务
│   ├── media-service/        # 媒体微服务
│   ├── gateway/              # API 网关
│   └── ws-service/           # WebSocket 信令服务
├── docker-compose.yml        # Docker 编排配置
├── .env.example              # 环境变量模板
└── package.json              # 工作区根配置
```

## API 概览

### 认证相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/refresh` | 刷新令牌 |
| POST | `/api/auth/logout` | 退出登录 |

### 游戏相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/games` | 游戏列表（支持分页、平台筛选、搜索） |
| GET | `/api/games/:id` | 游戏详情 |
| GET | `/api/games/:id/rom` | 获取 ROM 下载地址 |
| POST | `/api/games/:id/favorite` | 收藏/取消收藏 |

### 存档相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/saves` | 用户存档列表 |
| GET | `/api/saves/:id` | 存档详情 |
| POST | `/api/saves` | 创建存档 |
| DELETE | `/api/saves/:id` | 删除存档 |

### 媒体相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/screenshots` | 上传截图 |
| GET | `/api/screenshots` | 截图列表 |
| POST | `/api/recordings` | 上传录屏 |
| GET | `/api/recordings` | 录屏列表 |

## 常用命令

```bash
# 构建所有包
npm run build

# 构建指定包
npm run build:shared
npm run build:frontend
npm run build:auth

# 运行测试
npm run test

# 类型检查
npm run typecheck

# 代码检查
npm run lint
```

## 常见问题 (FAQ)

### Q: 启动 Docker 时数据库连接失败？

确保 PostgreSQL 容器已完全启动。`docker-compose.yml` 中已配置 `healthcheck`，服务会在数据库就绪后启动。如果仍有问题，可手动检查：

```bash
docker-compose logs postgres
docker-compose logs auth-service
```

### Q: 前端无法连接后端 API？

检查 API Gateway 是否正常运行（访问 http://localhost:3000/health）。如果使用本地开发模式，确保所有后端服务均已启动，且 `.env` 中的端口配置与实际一致。

### Q: ROM 文件如何上传？

ROM 文件需放置在 MinIO 对象存储的 `emu-matrix` 存储桶中。可通过 MinIO 控制台（http://localhost:9001，默认账号 `minioadmin` / `minioadmin`）上传，然后在数据库 `games` 表中配置对应的 `rom_url`。

### Q: 支持哪些游戏手柄？

EMU_Matrix 支持标准 HTML5 Gamepad API 兼容的手柄。在浏览器中连接手柄后，EmulatorJS 会自动识别。推荐使用 Xbox 或 PlayStation 兼容手柄。

### Q: 多人联机如何工作？

1. 一名玩家创建房间，获得 6 位房间码
2. 另一名玩家输入房间码加入
3. 系统通过 WebSocket 信令建立 WebRTC 点对点连接
4. 游戏输入通过 WebRTC 实时同步

### Q: 如何添加新平台支持？

1. 在 `packages/shared/src/types.ts` 中扩展 `Platform` 类型
2. 在 `packages/shared/src/constants.ts` 中添加平台配置（核心映射、ROM 扩展名、魔数签名等）
3. 在 `packages/shared/src/utils.ts` 中更新 ROM 验证逻辑
4. 添加对应的数据库迁移脚本
5. 在前端 `GameRoomView.vue` 中添加平台徽章样式

## 贡献指南

欢迎对 EMU_Matrix 项目做出贡献！请遵循以下流程：

1. **Fork** 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature-name`
3. 提交更改：`git commit -m 'Add some feature'`
4. 推送分支：`git push origin feature/your-feature-name`
5. 提交 **Pull Request**

### 开发规范

- 统一使用 TypeScript，确保类型安全
- 遵循现有代码风格和命名约定
- 新功能需编写对应的单元测试
- 提交前运行 `npm run typecheck` 和 `npm run lint` 确保代码质量
- Commit 信息使用清晰简洁的英文描述

### Bug 报告

如发现 Bug，请通过 [GitHub Issues](https://github.com/jamyriver/emu_matrix/issues) 提交，并包含以下信息：

- 问题描述与复现步骤
- 期望行为与实际行为
- 运行环境（操作系统、浏览器、Node.js 版本）
- 相关日志或截图

## 许可证

本项目基于 [MIT License](LICENSE) 开源。

Copyright (c) 2026 jamyriver
