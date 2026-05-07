EMU_Matrix云平台——完整开发方案

一、项目概述

1.1 项目目标

构建一个基于Web的多平台复古游戏云平台，支持FC（NES）、Sega Genesis/Mega Drive（MD）、Super Nintendo（SNES/SFC） 三大经典主机平台。用户无需下载安装任何软件，通过浏览器即点即玩。平台支持用户注册登录、云加载、云存档（跨设备同步）、云截图、云录像、游戏大厅等核心功能，达到上线运营标准。

1.2 目标受众

· 怀旧游戏爱好者，希望在手机/PC上便捷体验经典游戏
· 跨设备玩家，需要在多个设备间同步游戏进度
· 普通用户，享受即点即玩无需下载的便利

1.3 非功能性目标

· 客户端支持PC、手机、平板等主流设备，响应式适配
· 各平台游戏帧率稳定（FC 60FPS / MD 60FPS / SFC 60FPS）
· 支持多用户同时在线
· 符合现代Web安全标准（HTTPS、JWT鉴权、CORS配置）

二、系统整体架构

2.1 整体架构图（文字描述）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              客户端（浏览器）                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ 登录页/注册页 │ │ 游戏大厅页   │ │ 游戏房间页   │ │  个人中心/存档管理页  │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘   │
│                              │                                              │
│                    Vue3/React + TypeScript + TailwindCSS                    │
│                              │                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        核心库集成                                      │   │
│  │  EmulatorJS multi‑core  │  PeerJS (WebRTC联机)  │  NippleJS (触摸摇杆)  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS / WebSocket / WebRTC
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           负载均衡器（Nginx / Caddy）                         │
└─────────────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────────┐
│  前端静态服务     │  │  应用API服务     │  │          WebSocket服务           │
│  (CDN / Nginx)  │  │  (Node.js/Express)│  │    (信令控制/房间管理/联机)       │
└─────────────────┘  └─────────────────┘  └─────────────────────────────────┘
          │                    │                    │
          │                    ▼                    │
          │          ┌─────────────────┐           │
          │          │   STUN/TURN      │           │
          │          │  (Coturn)       │           │
          │          └─────────────────┘           │
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              数据存储层                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   PostgreSQL    │  │      Redis      │  │   对象存储 S3   │             │
│  │  (用户/存档/     │  │   (会话/缓存/    │  │  (ROM/截图/      │             │
│  │   游戏元数据)    │  │    游戏状态)     │  │   录像/封面)     │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          ROM存储与分发                                │   │
│  │  对象存储（MinIO/OSS）+ CDN加速                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

2.2 技术栈总览

层级 技术选型 说明
前端框架 Vue 3 + TypeScript 响应式、类型安全
样式 TailwindCSS 快速UI开发
状态管理 Pinia Vue状态管理
模拟器核心 EmulatorJS（multi-core） 支持FC/MD/SFC多平台
触摸摇杆 NippleJS 手机端虚拟手柄
联机方案 PeerJS (WebRTC) P2P联机通信
后端框架 Node.js + Express API服务
实时通信 Socket.io WebSocket信令
STUN/TURN Coturn NAT穿透
数据库 PostgreSQL 15+ 主数据库
缓存/会话 Redis 7+ 会话存储、游戏状态缓存
对象存储 MinIO / 阿里云OSS ROM、截图、录像存储
异步任务 BullMQ + Redis 录像转码队列
容器编排 Docker + Docker Compose 开发/生产部署

三、功能模块详细设计

3.1 用户注册登录模块

3.1.1 功能点

· 用户注册（用户名、邮箱、密码）
· 用户登录（用户名/邮箱 + 密码）
· JWT双Token（Access + Refresh）机制
· 密码加密存储（bcrypt）
· 会话管理（多设备登录管理）

3.1.2 数据表设计

```sql
-- 用户表
CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username          VARCHAR(50) UNIQUE NOT NULL,
    email             VARCHAR(100) UNIQUE NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    avatar_url        TEXT,
    status            VARCHAR(20) DEFAULT 'active',
    last_login_at     TIMESTAMP,
    last_login_ip     INET,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 会话表（用于管理多设备登录）
CREATE TABLE user_sessions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    access_token      VARCHAR(500) NOT NULL,
    refresh_token     VARCHAR(500) NOT NULL,
    user_agent        TEXT,
    ip_address        INET,
    expires_at        TIMESTAMP NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

3.1.3 API端点设计

方法 路径 功能 请求体示例
POST /api/auth/register 用户注册 {"username":"player1","email":"user@example.com","password":"******"}
POST /api/auth/login 用户登录 {"username":"player1","password":"******"}
POST /api/auth/logout 用户登出 需Authorization头
POST /api/auth/refresh 刷新Token {"refreshToken":"..."}
GET /api/auth/me 获取当前用户信息 需Authorization头

3.1.4 Token流程

```
登录成功 → 生成AccessToken(有效期7天) + RefreshToken(30天)
→ 存储Session到数据库 → 返回双Token给客户端
→ 客户端存储到localStorage/内存
→ 每个API请求携带 Authorization: Bearer <access_token>
→ AccessToken过期时用RefreshToken换取新Token
→ RefreshToken过期时要求重新登录
```

3.2 游戏大厅（含云游戏加载）

3.2.1 功能点

· 游戏列表展示（封面、名称、分类、标签、平台标识）
· 按平台筛选：FC / MD / SFC
· 游戏中英文搜索
· 分类筛选（动作类、射击类、角色扮演类、体育类、策略类等）
· 最近玩过记录
· 收藏游戏功能
· 点选即玩（无需等待下载）
· 游戏加载时显示进度提示

3.2.2 游戏数据表设计

```sql
-- 游戏列表表
CREATE TABLE games (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(100) NOT NULL,
    name_en           VARCHAR(100),
    platform          VARCHAR(20) NOT NULL,  -- 'nes', 'md', 'snes'
    cover_url         TEXT,
    rom_url           TEXT NOT NULL,
    rom_size          BIGINT,
    rom_md5           VARCHAR(32),
    emulator_core     VARCHAR(50),            -- EmulatorJS核心：'fceumm'(NES), 'genesis_plus_gx'(MD), 'snes9x'(SNES)
    category          VARCHAR(50),
    tags              TEXT[],
    description       TEXT,
    release_year      INTEGER,
    publisher         VARCHAR(100),
    play_count        INTEGER DEFAULT 0,
    favorite_count    INTEGER DEFAULT 0,
    status            VARCHAR(20) DEFAULT 'active',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以加速按平台筛选
CREATE INDEX idx_games_platform ON games(platform);
CREATE INDEX idx_games_play_count ON games(play_count DESC);

-- 用户收藏表
CREATE TABLE user_favorites (
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id           UUID REFERENCES games(id) ON DELETE CASCADE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, game_id)
);

-- 最近玩过表
CREATE TABLE user_recent_games (
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id           UUID REFERENCES games(id) ON DELETE CASCADE,
    platform          VARCHAR(20) NOT NULL,
    last_played_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, game_id)
);
```

3.2.3 游戏加载流程

```
用户点击游戏
    ↓
前端检查游戏ROM是否已在浏览器缓存（IndexedDB）
    ↓ 否
根据platform参数从CDN/对象存储获取ROM文件（流式加载）
    ← 同时显示加载进度条
    ↓
ROM数据加载到内存 → 根据platform初始化对应的EmulatorJS核心
    ├── platform='nes'  → core: 'fceumm'
    ├── platform='md'   → core: 'genesis_plus_gx'
    └── platform='snes' → core: 'snes9x'
    ↓
模拟器启动，开始渲染画面并播放音频
    ↓
检测是否有该游戏+该平台的云端存档 → 如有则提示是否加载
```

3.2.4 API端点设计

方法 路径 功能
GET /api/games 获取游戏列表（支持分页、platform筛选、搜索）
GET /api/games/:id 获取游戏详情
GET /api/games/:id/rom 获取ROM文件流
GET /api/games/platforms 获取支持的平台列表
GET /api/games/recent 获取最近玩过的游戏（需鉴权）
GET /api/games/favorites 获取收藏游戏列表（需鉴权）
POST /api/games/:id/favorite 收藏游戏（需鉴权）
DELETE /api/games/:id/favorite 取消收藏（需鉴权）

3.3 核心模拟器集成（EmulatorJS multi-core）

3.3.1 模拟器选型

选用EmulatorJS，原因如下：

维度 EmulatorJS 其他方案
多平台支持 ✅ 原生支持 NES / SNES / Genesis / GBA / PS1 等 -
核心技术 WebAssembly 纯JS或WASM
官方存档API ✅ 内置 saveState / loadState 需要自行实现
社区活跃度 高，持续更新 部分项目已停更
触摸/Gamepad ✅ 原生支持 需额外适配

EmulatorJS支持的游戏系统包括：任天堂 NES、SNES、N64、Game Boy、GBA、DS，世嘉 Master System、Genesis/Mega Drive、Game Gear，以及 Atari 系列等。

3.3.2 模拟器集成代码

```typescript
// emulator.service.ts
// 平台与EmulatorJS核心映射
const PLATFORM_CORE_MAP = {
  'nes': 'fceumm',      // FC/NES 核心
  'md': 'genesis_plus_gx',  // Sega Genesis/MD 核心
  'snes': 'snes9x'      // SFC/SNES 核心
} as const;

export type Platform = keyof typeof PLATFORM_CORE_MAP;

export class EmulatorService {
  private emulator: any;
  private currentPlatform: Platform | null = null;
  private canvasElement: HTMLCanvasElement;
  private isRunning: boolean = false;
  private autoSaveInterval: number | null = null;

  async init(containerId: string, romData: Uint8Array, platform: Platform) {
    const EJS = await loadEmulatorJS();
    const core = PLATFORM_CORE_MAP[platform];
    
    this.currentPlatform = platform;
    this.emulator = new EJS({
      id: containerId,
      system: platform === 'nes' ? 'nes' : (platform === 'md' ? 'sega/genesis' : 'snes'),
      gameUrl: URL.createObjectURL(new Blob([romData])),
      core: core,
      background: '#000000',
      onLoad: () => this.onEmulatorLoaded(),
      onSaveState: (state) => this.autoCloudSave(state),
      onFrame: (frame) => this.captureFrameForScreenshot(frame)
    });
    
    this.emulator.start();
    this.startAutoSaveTimer();
  }

  // 获取当前平台
  getPlatform(): Platform | null {
    return this.currentPlatform;
  }

  // 获取当前画面用于截图
  captureFrame(): string {
    const canvas = this.emulator.getCanvas();
    return canvas.toDataURL('image/png');
  }

  // 获取模拟器状态用于云存档（所有平台通用）
  saveState(): string {
    return this.emulator.saveState();
  }

  // 加载存档状态
  loadState(stateData: string): void {
    this.emulator.loadState(stateData);
  }

  // 启动自动存档定时器
  private startAutoSaveTimer(): void {
    this.autoSaveInterval = window.setInterval(() => {
      if (this.isRunning) {
        const state = this.saveState();
        this.emitAutoSave(state);
      }
    }, 60000); // 每60秒
  }

  destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.emulator?.stop();
    this.emulator = null;
    this.currentPlatform = null;
  }
}
```

3.3.3 移动端适配

· 使用 NippleJS 实现虚拟摇杆和按键，支持自定义布局
· 平台特定手柄映射：
  · FC：方向键 + A/B + Start/Select
  · MD：方向键 + A/B/C + Start + 可选X/Y/Z（6键扩展）
  · SFC：方向键 + A/B/X/Y/L/R + Start/Select

```typescript
// 移动端摇杆集成（扩展了对MD/SFC的支持）
import nipple from 'nipplejs';

const joystick = nipple.create({
  zone: document.getElementById('joystick-zone'),
  mode: 'static',
  lockY: true,
  lockX: false,
  restOpacity: 0.5,
  size: 120
});

joystick.on('move', (evt, nipple) => {
  const angle = nipple.angle;
  const force = nipple.force;
  // 映射为方向键指令
  const keys = {
    up: angle > 225 && angle < 315,
    down: angle > 45 && angle < 135,
    left: angle > 135 && angle < 225,
    right: angle > 315 || angle < 45
  };
  emulator.setButtonState(keys);
});
```

3.4 云存档功能

3.4.1 功能点

· 手动保存/加载存档（每个游戏+平台最多5个手动存档位）
· 自动云存档（每60秒自动保存）
· 游戏退出时自动存档
· 跨设备加载存档
· 存档缩略图预览
· 存档时间戳和游戏进度描述

3.4.2 存档数据结构

FC、MD、SFC模拟器的存档本质上是状态快照（State Snapshot），EmulatorJS的saveState()方法会将当前CPU状态、内存、PPU/GPU状态等完整序列化为Base64字符串。这一机制对三大平台通用，即通过EmulatorJS生成的存档格式在所有支持平台上均采用相同的API接口，不会因平台不同而产生兼容性问题。

3.4.3 数据表设计

```sql
-- 云存档表（扩展支持platform字段）
CREATE TABLE cloud_saves (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id           UUID REFERENCES games(id) ON DELETE CASCADE,
    platform          VARCHAR(20) NOT NULL,  -- 'nes', 'md', 'snes'
    slot_id           INTEGER NOT NULL,       -- 存档槽位 1-5，0表示自动存档
    save_name         VARCHAR(100),           -- 用户自定义存档名
    save_data         TEXT NOT NULL,          -- Base64编码的状态快照
    screenshot_url    TEXT,                   -- 缩略图URL
    play_time         INTEGER DEFAULT 0,      -- 游戏时长(秒)
    is_auto_save      BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id, platform, slot_id)
);

-- 索引优化
CREATE INDEX idx_cloud_saves_user_game_platform ON cloud_saves(user_id, game_id, platform);
```

3.4.4 API端点设计

方法 路径 功能
GET /api/saves 获取用户所有存档
GET /api/saves/:gameId?platform=:platform 获取指定游戏+平台的存档
POST /api/saves 创建/更新存档（需携带platform参数）
GET /api/saves/:gameId/:platform/:slotId 获取指定存档数据
DELETE /api/saves/:saveId 删除存档

3.5 云截图功能

3.5.1 功能点

· 游戏过程中手动截图保存
· 一键下载截图到本地
· 截图画廊：用户可查看历史截图（按平台筛选）
· 截图分享链接（可选公开）
· 截图自动添加游戏水印和平台标识

3.5.2 数据表设计

```sql
-- 云截图表（扩展支持platform字段）
CREATE TABLE cloud_screenshots (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id           UUID REFERENCES games(id),
    platform          VARCHAR(20) NOT NULL,  -- 'nes', 'md', 'snes'
    screenshot_url    TEXT NOT NULL,
    thumbnail_url     TEXT,
    width             INTEGER,
    height            INTEGER,
    file_size         INTEGER,
    is_public         BOOLEAN DEFAULT FALSE,
    description       TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_screenshots_user_platform ON cloud_screenshots(user_id, platform);
```

3.5.3 截图存储方案

· 截图存储在对象存储（MinIO/OSS）中
· 自动生成缩略图
· 图片格式：PNG（无损）或WebP（压缩）
· 存储路径：/{platform}/screenshots/{userId}/{screenshotId}.png

3.5.4 API端点设计

方法 路径 功能
POST /api/screenshots 上传截图（含platform参数）
GET /api/screenshots?platform=:platform 按平台获取用户截图列表
GET /api/screenshots/:id 获取截图详情
DELETE /api/screenshots/:id 删除截图

3.6 云录像功能

3.6.1 功能点

· 录制游戏过程（最长支持30分钟）
· 录像保存到云端，支持视频回放
· 录像列表管理（按平台筛选）
· 录像长度、文件大小统计
· 后台异步转码（使用BullMQ + FFmpeg）

3.6.2 数据表设计

```sql
-- 云录像表（扩展支持platform字段）
CREATE TABLE cloud_recordings (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id           UUID REFERENCES games(id),
    platform          VARCHAR(20) NOT NULL,  -- 'nes', 'md', 'snes'
    title             VARCHAR(200),
    video_url         TEXT NOT NULL,
    thumbnail_url     TEXT,
    duration          INTEGER,                -- 时长(秒)
    file_size         BIGINT,
    status            VARCHAR(20) DEFAULT 'processing', -- 'processing','ready','failed'
    is_public         BOOLEAN DEFAULT FALSE,
    play_count        INTEGER DEFAULT 0,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recordings_user_platform ON cloud_recordings(user_id, platform);
```

3.6.3 录像处理流程（异步任务队列）

```
用户结束录制 → 前端生成WebM文件 → 分块上传到MinIO → API记录录像（status=processing）
                                     ↓
                              BullMQ队列添加转码任务
                                     ↓
                               Worker进程消费任务
                                     ↓
                         ┌───────────┴───────────┐
                         ↓                       ↓
                  FFmpeg转码H.264 MP4    生成视频缩略图
                         ↓                       ↓
                    更新video_url            更新thumbnail_url
                         ↓
                    状态改为ready
```

3.6.4 API端点设计

方法 路径 功能
POST /api/recordings 上传录像（含platform参数）
GET /api/recordings?platform=:platform 按平台获取用户录像列表
GET /api/recordings/:id 获取录像详情
DELETE /api/recordings/:id 删除录像

四、云联机扩展功能

4.1 技术方案

EmulatorJS本身内置了联机对战功能，支持P2P联机通信。平台据此设计完整的联机方案：

· 通信协议：WebRTC DataChannel（P2P直连）
· 信令服务器：Socket.io WebSocket服务器
· NAT穿透：Coturn STUN/TURN服务器

P2P直连的延迟通常在20-100毫秒之间。

4.2 联机游戏入口

游戏详情页中，对于支持双打的游戏（如《魂斗罗》《双截龙》《怒之铁拳》等），显示 “联机对战”按钮：

· 玩家 A 点击“创建房间”→ 生成房间码
· 玩家 B 点击“加入房间”→ 输入房间码
· 双方建立连接后，同时加载ROM并开始游戏
· 双方按键通过DataChannel同步，实现合作通关

4.3 与存档、录像功能的集成

集成点 说明
联机+存档 联机游戏结束后，可选择保存当时的游戏状态供日后复盘或挑战
联机+录像 联机对局自动录像保存，可作为精彩集锦分享

五、数据库设计汇总

5.1 表结构清单

表名 用途
users 用户账户信息
user_sessions 用户会话/JWT令牌管理
games 游戏元数据（含platform字段）
user_favorites 用户收藏游戏
user_recent_games 最近玩过记录
cloud_saves 云存档（含platform）
cloud_screenshots 云截图（含platform）
cloud_recordings 云录像（含platform）

5.2 完整DDL脚本

```sql
-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username          VARCHAR(50) UNIQUE NOT NULL,
    email             VARCHAR(100) UNIQUE NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    avatar_url        TEXT,
    status            VARCHAR(20) DEFAULT 'active',
    last_login_at     TIMESTAMP,
    last_login_ip     INET,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 会话表
CREATE TABLE user_sessions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    access_token      VARCHAR(500) NOT NULL,
    refresh_token     VARCHAR(500) NOT NULL,
    user_agent        TEXT,
    ip_address        INET,
    expires_at        TIMESTAMP NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 游戏表
CREATE TABLE games (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(100) NOT NULL,
    name_en           VARCHAR(100),
    platform          VARCHAR(20) NOT NULL,
    cover_url         TEXT,
    rom_url           TEXT NOT NULL,
    rom_size          BIGINT,
    rom_md5           VARCHAR(32),
    emulator_core     VARCHAR(50),
    category          VARCHAR(50),
    tags              TEXT[],
    description       TEXT,
    release_year      INTEGER,
    publisher         VARCHAR(100),
    play_count        INTEGER DEFAULT 0,
    favorite_count    INTEGER DEFAULT 0,
    status            VARCHAR(20) DEFAULT 'active',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户收藏表
CREATE TABLE user_favorites (
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id           UUID REFERENCES games(id) ON DELETE CASCADE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, game_id)
);

-- 最近玩过表
CREATE TABLE user_recent_games (
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id           UUID REFERENCES games(id) ON DELETE CASCADE,
    platform          VARCHAR(20) NOT NULL,
    last_played_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, game_id)
);

-- 云存档表
CREATE TABLE cloud_saves (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id           UUID REFERENCES games(id) ON DELETE CASCADE,
    platform          VARCHAR(20) NOT NULL,
    slot_id           INTEGER NOT NULL,
    save_name         VARCHAR(100),
    save_data         TEXT NOT NULL,
    screenshot_url    TEXT,
    play_time         INTEGER DEFAULT 0,
    is_auto_save      BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id, platform, slot_id)
);

-- 云截图表
CREATE TABLE cloud_screenshots (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id           UUID REFERENCES games(id),
    platform          VARCHAR(20) NOT NULL,
    screenshot_url    TEXT NOT NULL,
    thumbnail_url     TEXT,
    width             INTEGER,
    height            INTEGER,
    file_size         INTEGER,
    is_public         BOOLEAN DEFAULT FALSE,
    description       TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 云录像表
CREATE TABLE cloud_recordings (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id           UUID REFERENCES games(id),
    platform          VARCHAR(20) NOT NULL,
    title             VARCHAR(200),
    video_url         TEXT NOT NULL,
    thumbnail_url     TEXT,
    duration          INTEGER,
    file_size         BIGINT,
    status            VARCHAR(20) DEFAULT 'processing',
    is_public         BOOLEAN DEFAULT FALSE,
    play_count        INTEGER DEFAULT 0,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引创建
CREATE INDEX idx_games_platform ON games(platform);
CREATE INDEX idx_games_play_count ON games(play_count DESC);
CREATE INDEX idx_cloud_saves_user_game_platform ON cloud_saves(user_id, game_id, platform);
CREATE INDEX idx_screenshots_user_platform ON cloud_screenshots(user_id, platform);
CREATE INDEX idx_recordings_user_platform ON cloud_recordings(user_id, platform);
```

5.3 表结构说明

所有涉及游戏的数据表均包含 platform字段，用于区分FC、MD和SFC三大平台：

· 'nes'：FC/NES平台
· 'md'：Sega Genesis/Mega Drive平台
· 'snes'：Super Nintendo/SNES平台

该字段的设计使平台可以轻松扩展支持更多主机类型（如GBA、N64、PS1等），未来仅需新增platform取值即可。

六、部署方案

6.1 开发环境部署（Docker Compose）

创建docker-compose.yml文件：

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: retro_cloudgame
      POSTGRES_USER: retro_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - pg_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://retro_user:secure_password@postgres:5432/retro_cloudgame
      REDIS_URL: redis://redis:6379
      MINIO_ENDPOINT: minio:9000
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
      - minio

  frontend:
    build: ./frontend
    ports:
      - "80:80"

  coturn:
    image: coturn/coturn
    ports:
      - "3478:3478"
      - "3478:3478/udp"
    environment:
      TURN_PORT: 3478
      TURN_PWD: "shared_secret"

volumes:
  pg_data:
  minio_data:
```

6.2 生产环境部署清单

· Nginx反向代理 + SSL证书
· CDN加速：静态资源（JS/CSS/ROM）使用CDN
· 数据库主从复制（读写分离）
· Redis集群（会话共享）
· 对象存储RAID冗余
· 日志收集（ELK或Loki）
· 监控告警（Prometheus + Grafana）
· 自动备份策略：数据库每日全量备份

七、开发路线图

阶段 周期 里程碑产出 核心交付物
Phase 1 2周 基础框架搭建 Docker环境、前后端脚手架、PostgreSQL初始化
Phase 2 1周 用户认证系统 登录/注册页面、JWT认证中间件
Phase 3 2周 FC模拟器集成 NES核心集成、游戏大厅、ROM加载
Phase 4 1周 MD/SFC扩展支持 Genesis核心、SNES核心、按平台筛选界面
Phase 5 1.5周 云存档功能 手动/自动存档、跨设备同步
Phase 6 1周 云截图功能 截图画廊、分享功能
Phase 7 1.5周 云录像功能 录制上传、BullMQ队列、FFmpeg转码
Phase 8 1周 联机扩展 P2P联机、信令服务器
Phase 9 1周 优化上线 性能优化、安全加固、公测

八、AI编程协作指南（用于指导AI开发）

8.1 提示词模板参考

```
【任务】实现[功能模块名称]

【需求描述】
[具体描述功能点和行为]

【技术栈】
前端: Vue3 + TypeScript + TailwindCSS + EmulatorJS
后端: Node.js + Express + PostgreSQL + Redis + MinIO
架构: Docker Compose

【平台支持】FC(NES) / Sega Genesis(MD) / Super Nintendo(SNES)

【验收标准】
1. [可量化的验收条件]
2. [前端可交互验证]
3. [后端可接口测试]
```

8.2 开发优先级

根据依赖关系，建议按以下顺序开发：

```
1. 数据库初始化与用户认证
    ↓
2. 游戏大厅 + ROM存储（先NES，后MD/SNES）
    ↓
3. 模拟器核心集成（NES → MD → SNES）
    ↓
4. 云存档功能
    ↓
5. 云截图功能
    ↓
6. 云录像功能（异步队列）
    ↓
7. 联机扩展（可选）
```

建议：FC（NES）支持作为最低门槛的平台率先开发和验证，MD和SFC（对于SFC即Super Nintendo/SNES）在NES工作稳定后逐步添加，利用EmulatorJS的multi-core特性可快速扩展。

8.3 关键代码模块

模块 文件路径建议 职责
模拟器服务 frontend/src/services/emulator.service.ts EmulatorJS初始化、多平台核心映射、存档/截图/录像
游戏大厅API backend/src/routes/games.ts 游戏列表CRUD、按平台筛选
云存档API backend/src/routes/saves.ts 存档读写、Base64存储
录像队列 backend/src/workers/recording-worker.ts BullMQ消费FFmpeg转码任务
联机信令 backend/src/socket/signaling.ts Socket.io信令服务器
认证中间件 backend/src/middleware/auth.ts JWT验证、会话管理

8.4 测试策略

测试类型 覆盖范围 推荐工具
单元测试 工具函数、存档加密解密、API路由层 Jest / Vitest
E2E测试 完整流程：注册→选平台→玩游戏→存档→跨设备加载 Playwright
API集成测试 所有API端点的预期响应验证 Supertest
模拟器兼容性 各平台核心加载、存档格式兼容性 手动测试+自动化脚本