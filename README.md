# duole-ai-blog (多乐 AI 博客)

> 记录 LangChain、LangGraph、AI Agent 学习历程，构建个人技术品牌与项目展示平台。

---

## 1. 项目概述

**项目背景**：当前正在系统学习 LangChain、LangGraph 和 AI Agent 相关技术栈，需要一个平台来沉淀学习笔记、分享技术心得，同时作为个人技术品牌的展示窗口。

**核心目标**：

- 记录和发布 AI Agent 领域的学习文章
- 展示个人开源项目和学习成果
- 在线简历与技能展示
- 完整的内容管理与后台运营能力
- 为未来的 AI 功能（智能搜索、自动标签、AI 写作助手等）预留扩展空间

---

## 2. 技术栈选型

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.x | React 框架，App Router，SSR/SSG/ISR |
| React | 19.x | UI 组件库基础 |
| TypeScript | 5.x | 类型安全 |
| Tailwind CSS | 4.x | 原子化样式系统 |
| shadcn/ui | Latest | 基于 Radix UI 的组件库 |
| Framer Motion | Latest | 页面过渡与交互动画 |
| Lucide React | Latest | 图标系统 |
| remark / rehype | Latest | Markdown / MDX 渲染 |
| rehype-pretty-code / shiki | Latest | 代码语法高亮 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.12+ | 运行时 |
| FastAPI | Latest | RESTful API 框架 |
| SQLAlchemy | 2.x | ORM（异步模式） |
| Alembic | Latest | 数据库迁移 |
| Pydantic | v2 | 数据校验与序列化 |
| python-jose | Latest | JWT 认证 |
| passlib / bcrypt | Latest | 密码哈希 |
| python-multipart | Latest | 文件上传 |
| LangChain / LangGraph | Latest | AI 功能集成 |

### 数据库与基础设施

| 技术 | 用途 |
|------|------|
| PostgreSQL 16 | 主数据库 |
| Redis (可选) | 缓存 / Session / Celery Broker |
| Docker / Docker Compose | 本地开发与部署 |
| Nginx / Caddy (可选) | 反向代理与 SSL |

---

## 3. 系统架构总览

整个系统采用前后端分离架构。

### 架构示意图

`
+---------------+     +-------------------------------------------+     +------------------+
|   浏览器      |     |          Next.js 16 Server                |     |  FastAPI 后端     |
|               |---->|  +-------------------+  +---------------+ |---->|  /api/v1/*       |
|  - 公开页面   |     |  | RSC Server         |  | API Route     | |     |                  |
|  - 管理后台   |<----|  | Components (SSR)   |  | (代理层)      | |<----|  - Auth          |
|               |     |  +-------------------+  +---------------+ |     |  - Articles      |
+---------------+     +-------------------------------------------+     |  - Projects      |
                                                                        |  - Resume        |
                                                                        |  - Tags          |
                                                                        |  - Upload        |
                                                                        +--------+---------+
                                                                                 |
                                                                        +--------v---------+
                                                                        |  PostgreSQL 16    |
                                                                        |  (Asyncpg)        |
                                                                        +------------------+
`

### 数据流说明

1. **公开页面**（博客列表/详情、项目、简历）：Next.js 使用 RSC 在服务端直接调用 FastAPI，渲染成动态 HTML 返回，对 SEO 友好。
2. **管理后台**：采用客户端渲染（"use client"），通过 fetch 请求与后端交互，使用 JWT 鉴权。
3. **文章内容**：以 Markdown 格式存储在 PostgreSQL 中，前端使用 remark + rehype 渲染为 HTML。
4. **图片/文件**：开发期存本地 /uploads，生产环境用对象存储。

---

## 4. 前端架构设计

### 4.1 目录结构

`
apps/
+-- app/                          # Next.js App Router
|   +-- layout.tsx                # 根布局 (Header + Footer + 主题)
|   +-- page.tsx                  # 首页
|   +-- globals.css               # 全局样式 + Tailwind
|   |
|   +-- blog/                     # 博客模块 (SSR)
|   |   +-- page.tsx              # 博客列表 (分页/标签过滤)
|   |   +-- [slug]/
|   |   |   +-- page.tsx          # 文章详情
|   |   +-- tags/
|   |       +-- [tag]/
|   |           +-- page.tsx      # 标签聚合页
|   |
|   +-- projects/                 # 项目展示 (SSR)
|   |   +-- page.tsx              # 项目列表
|   |   +-- [slug]/
|   |       +-- page.tsx          # 项目详情
|   |
|   +-- resume/
|   |   +-- page.tsx              # 在线简历 (SSR)
|   |
|   +-- admin/                    # 管理后台 (CSR)
|   |   +-- layout.tsx            # 后台布局 (侧边栏导航)
|   |   +-- page.tsx              # 仪表盘
|   |   +-- login/
|   |   |   +-- page.tsx          # 登录页
|   |   +-- articles/
|   |   |   +-- page.tsx          # 文章管理列表
|   |   |   +-- new/
|   |   |   |   +-- page.tsx      # 新建文章
|   |   |   +-- [id]/
|   |   |       +-- page.tsx      # 编辑文章
|   |   +-- projects/
|   |   |   +-- page.tsx          # 项目管理
|   |   |   +-- new/
|   |   |   |   +-- page.tsx      # 新建项目
|   |   |   +-- [id]/
|   |   |       +-- page.tsx      # 编辑项目
|   |   +-- tags/
|   |   |   +-- page.tsx          # 标签管理
|   |   +-- resume/
|   |   |   +-- page.tsx          # 简历编辑
|   |   +-- settings/
|   |       +-- page.tsx          # 博客设置
|   |
|   +-- api/                      # Next.js API Routes (代理层)
|       +-- [[...path]]/
|           +-- route.ts          # 统一代理到 FastAPI
|
+-- components/                   # 共享组件
|   +-- ui/                       # shadcn/ui 组件
|   +-- layout/                   # header, footer, sidebar, theme-toggle
|   +-- blog/                     # article-card, article-list, article-content, toc
|   +-- projects/                 # project-card
|   +-- resume/                   # resume-timeline
|   +-- shared/                   # pagination, search-input, empty-state
|
+-- lib/                          # 工具函数
|   +-- api-client.ts             # API 请求封装
|   +-- format-date.ts
|   +-- markdown.ts               # MD 渲染配置
|   +-- utils.ts                  # cn() 工具函数
|
+-- hooks/
|   +-- use-auth.ts               # 认证状态
|   +-- use-media-query.ts
|
+-- types/
|   +-- article.ts
|   +-- project.ts
|   +-- tag.ts
|   +-- user.ts
|   +-- api.ts
|
+-- public/
+-- next.config.ts
+-- postcss.config.mjs
+-- tsconfig.json
+-- package.json
`

### 4.2 路由设计

| 路由 | 渲染 | 描述 |
|------|------|------|
| / | SSR | 首页（最新文章 + 精选项目） |
| /blog | SSR | 博客列表（分页、标签筛选） |
| /blog/[slug] | SSR | 文章详情（SEO 友好） |
| /blog/tags/[tag] | SSR | 标签聚合页 |
| /projects | SSR | 项目展示列表 |
| /projects/[slug] | SSR | 项目详情 |
| /resume | SSR | 在线简历 |
| /admin/* | CSR | 管理后台（JWT 保护） |

**设计原则**：内容展示类页面使用 Server Components；管理后台使用 Client Components。

### 4.3 关键渲染链路

文章内容渲染流程：

`
PostgreSQL (Markdown)
    -> FastAPI API (返回 Markdown 字符串)
    -> Next.js Server Component
    -> remarkParse + remarkGfm + rehypeSanitize + rehypePrettyCode
    -> HTML + Shiki 语法高亮 + 自动 TOC
    -> Tailwind Typography 排版
    -> 最终 HTML 输出到浏览器
`

### 4.4 样式与主题

- Tailwind CSS v4 @theme 指令定义主题色
- 亮/暗模式切换（next-themes）
- 文章内容使用 Tailwind Typography（prose）
- 代码块使用 Shiki 引擎

### 4.5 Framer Motion 动效策略

- 页面切换：AnimatePresence + 淡入上移
- 文章列表：Intersection Observer + 逐项入场
- 管理后台：避免过度动画，仅保留微交互

---

## 5. 后端架构设计

### 5.1 目录结构

`
backend/
+-- alembic/                     # 数据库迁移
|   +-- versions/
|   +-- env.py
|   +-- alembic.ini
|
+-- app/
|   +-- __init__.py
|   +-- main.py                  # FastAPI 入口
|   +-- config.py                # pydantic-settings 配置
|   +-- database.py              # 异步引擎 / Session 工厂
|   |
|   +-- api/                     # 路由层
|   |   +-- __init__.py
|   |   +-- deps.py              # 依赖注入
|   |   +-- v1/
|   |       +-- __init__.py
|   |       +-- router.py        # 路由聚合
|   |       +-- articles.py
|   |       +-- projects.py
|   |       +-- tags.py
|   |       +-- resume.py
|   |       +-- auth.py
|   |       +-- admin.py
|   |       +-- upload.py
|   |       +-- site.py
|   |
|   +-- models/                  # SQLAlchemy ORM
|   |   +-- __init__.py
|   |   +-- base.py              # DeclarativeBase + Mixins
|   |   +-- article.py
|   |   +-- project.py
|   |   +-- tag.py
|   |   +-- article_tag.py
|   |   +-- user.py
|   |   +-- resume.py
|   |   +-- site_config.py
|   |
|   +-- schemas/                 # Pydantic v2
|   |   +-- __init__.py
|   |   +-- article.py
|   |   +-- project.py
|   |   +-- tag.py
|   |   +-- user.py
|   |   +-- resume.py
|   |   +-- auth.py
|   |   +-- common.py
|   |
|   +-- services/                # 业务逻辑
|   |   +-- __init__.py
|   |   +-- article_service.py
|   |   +-- project_service.py
|   |   +-- tag_service.py
|   |   +-- auth_service.py
|   |   +-- resume_service.py
|   |   +-- upload_service.py
|   |
|   +-- repositories/            # 数据访问
|   |   +-- __init__.py
|   |   +-- base.py              # 通用 CRUD 基类
|   |   +-- article_repo.py
|   |   +-- project_repo.py
|   |   +-- tag_repo.py
|   |   +-- user_repo.py
|   |
|   +-- core/                    # 基础设施
|   |   +-- __init__.py
|   |   +-- security.py          # JWT / 密码
|   |   +-- exceptions.py        # 异常
|   |   +-- middleware.py        # CORS / 日志
|   |
|   +-- ai/                      # AI 预留
|       +-- __init__.py
|       +-- agent.py
|       +-- tools.py
|
+-- tests/
+-- uploads/
+-- requirements.txt
+-- Dockerfile
+-- .env.example
`

### 5.2 架构分层

`
Router (api/v1/) --> Service (services/) --> Repository (repositories/) --> Model (SQLAlchemy) --> PostgreSQL
   |                      |                        |
   v                      v                        v
Schema (Pydantic)    Core (JWT/密码)           Base (通用 CRUD)
`

**分层职责**：

- **Router**：最薄的一层，做 HTTP 协议转换，参数提取 -> 调用 Service -> 返回响应。
- **Service**：核心业务逻辑。跨模型操作、权限校验、事务边界。
- **Repository**：数据访问抽象。封装数据库查询，支持分页/排序/过滤。
- **Schema**：Pydantic v2 请求/响应定义。统一响应格式 {code, message, data}。
- **Core**：跨切面能力——JWT、密码哈希、全局异常处理、CORS。

---

## 6. 数据库设计

### 6.1 表关系

`
User 1--N Article
User 1--N Project
User 1--1 Resume
Article N--M Tag (通过 article_tags 关联)
SiteConfig (键值对)
`

### 6.2 核心表

**articles**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| title | VARCHAR(200) | 标题 |
| slug | VARCHAR(250) UNIQUE | URL 友好标识 |
| summary | VARCHAR(500) | 摘要 |
| content_markdown | TEXT | Markdown 正文 |
| cover_image_url | VARCHAR(500) | 封面图 |
| status | ENUM('draft','published','archived') | 状态 |
| is_featured | BOOLEAN | 精选 |
| view_count | INTEGER | 阅读数 |
| author_id | UUID FK - users | 作者 |
| published_at | TIMESTAMPTZ | 发布时间 |
| created_at / updated_at | TIMESTAMPTZ | 时间戳 |

**tags**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| name | VARCHAR(50) UNIQUE | 名称 |
| slug | VARCHAR(80) UNIQUE | URL 标识 |
| color | VARCHAR(7) | 颜色 |
| created_at | TIMESTAMPTZ | 创建时间 |

**article_tags**（多对多关联表）

| 字段 | 类型 |
|------|------|
| article_id | UUID FK - articles ON DELETE CASCADE |
| tag_id | UUID FK - tags ON DELETE CASCADE |
| PRIMARY KEY | (article_id, tag_id) |

**projects**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| title | VARCHAR(200) | 标题 |
| slug | VARCHAR(250) UNIQUE | URL 标识 |
| summary | VARCHAR(500) | 摘要 |
| description_markdown | TEXT | 描述 |
| cover_image_url | VARCHAR(500) | 封面 |
| repo_url | VARCHAR(500) | 仓库链接 |
| demo_url | VARCHAR(500) | 演示链接 |
| status | ENUM('draft','published') | 状态 |
| tech_stack | TEXT[] | 技术栈数组 |
| sort_order | INTEGER | 排序权重 |
| author_id | UUID FK - users | 作者 |
| created_at / updated_at | TIMESTAMPTZ | 时间戳 |

**users**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| email | VARCHAR(255) UNIQUE | 邮箱 |
| username | VARCHAR(50) UNIQUE | 用户名 |
| hashed_password | VARCHAR(255) | bcrypt 哈希 |
| display_name | VARCHAR(100) | 显示名 |
| avatar_url | VARCHAR(500) | 头像 |
| bio | TEXT | 简介 |
| is_admin | BOOLEAN | 管理员标记 |
| created_at / updated_at | TIMESTAMPTZ | 时间戳 |

**resumes**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| user_id | UUID FK - users | 所属用户 |
| data | JSONB | 简历结构化数据 |
| is_published | BOOLEAN | 是否公开 |
| created_at / updated_at | TIMESTAMPTZ | 时间戳 |

---

## 7. API 接口设计

### 7.1 规范

- 基础路径：/api/v1
- 统一响应：{ "code": 200, "message": "success", "data": { ... } }
- 分页响应：{ "code": 200, "message": "success", "data": { "items": [...], "total": 100, "page": 1, "page_size": 20, "total_pages": 5 } }

### 7.2 公开接口（无需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/articles | 文章列表（分页、标签筛选） |
| GET | /api/v1/articles/{slug} | 文章详情 |
| GET | /api/v1/articles/featured | 精选文章 |
| GET | /api/v1/articles/{slug}/related | 相关文章 |
| GET | /api/v1/tags | 标签列表 |
| GET | /api/v1/tags/{slug}/articles | 标签下文章 |
| GET | /api/v1/projects | 项目列表 |
| GET | /api/v1/projects/{slug} | 项目详情 |
| GET | /api/v1/resume | 公开简历 |
| GET | /api/v1/site | 站点信息 |

### 7.3 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/auth/login | 登录（返回 JWT） |
| POST | /api/v1/auth/refresh | 刷新 Token |

### 7.4 管理接口（需 JWT）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/admin/articles | 文章管理列表（含草稿） |
| POST | /api/v1/admin/articles | 创建文章 |
| PUT | /api/v1/admin/articles/{id} | 更新文章 |
| DELETE | /api/v1/admin/articles/{id} | 删除文章 |
| PATCH | /api/v1/admin/articles/{id}/status | 更新状态 |
| POST | /api/v1/admin/projects | 创建项目 |
| PUT | /api/v1/admin/projects/{id} | 更新项目 |
| DELETE | /api/v1/admin/projects/{id} | 删除项目 |
| POST | /api/v1/admin/tags | 创建标签 |
| PUT | /api/v1/admin/tags/{id} | 更新标签 |
| DELETE | /api/v1/admin/tags/{id} | 删除标签 |
| PUT | /api/v1/admin/resume | 更新简历 |
| PUT | /api/v1/admin/site | 更新站点配置 |
| POST | /api/v1/admin/upload | 文件上传 |
| GET | /api/v1/admin/stats | 仪表盘统计 |

### 7.5 公共查询参数

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数 |
| tag | string | - | 标签 slug 筛选 |
| search | string | - | 模糊搜索 |
| sort | string | -published_at | 排序 |

---

## 8. 核心模块功能清单

### 8.1 博客模块

**前端**：卡片列表（标题/摘要/封面/标签/日期/阅读量）、Markdown 渲染 + 代码高亮 + TOC、标签筛选、搜索。

**后端**：文章 CRUD（draft/published/archived 状态机）、标签自动关联、分页、浏览计数。

### 8.2 项目展示模块

**前端**：卡片网格（封面/标题/技术栈标签/链接）、项目详情页。

**后端**：项目 CRUD、手动排序（sort_order）、技术栈数组。

### 8.3 简历模块

**前端**：时间线布局、打印友好。

**后端**：JSONB 灵活存储、发布/草稿切换。

### 8.4 管理后台

**前端**：仪表盘、Markdown 编辑器（分屏 + 实时预览 + 代码高亮 + 图片上传）、文章/项目/标签/简历管理、站点配置。

**后端**：JWT 认证、文件上传。

### 8.5 AI 功能（预留）

自动标签推荐（LangChain）、文章摘要、语义搜索、AI 写作助手、LangGraph 自动发文流程。

---

## 9. 部署架构

### 9.1 Docker Compose 开发环境

`yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: duole_blog
      POSTGRES_USER: duole
      POSTGRES_PASSWORD: 
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://duole:@postgres:5432/duole_blog
    depends_on:
      - postgres

  frontend:
    build: ./apps
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1
    depends_on:
      - backend

volumes:
  pgdata:
`

### 9.2 生产环境

用户浏览器 -> CDN (Cloudflare) -> Nginx/Caddy (反向代理 + SSL) -> Next.js (端口 3000) / FastAPI (端口 8000) -> PostgreSQL

### 9.3 环境变量

| 变量 | 开发 | 生产 |
|------|------|------|
| NEXT_PUBLIC_API_URL | http://localhost:8000/api/v1 | https://api.duole.dev/api/v1 |
| DATABASE_URL | asyncpg://... | asyncpg://... |
| SECRET_KEY | 随机生成 | 强随机 |
| CORS_ORIGINS | http://localhost:3000 | https://duole.dev |

---

## 10. 开发路线图

**Phase 1: 基础设施（1-2 天）**
- [x] Next.js 项目初始化
- [ ] 安装配置 shadcn/ui + Framer Motion + Lucide
- [ ] 搭建 FastAPI 项目骨架
- [ ] 数据库初始化（Alembic）
- [ ] Docker Compose（PG + 后端 + 前端）

**Phase 2: 核心后端（3-4 天）**
- [ ] SQLAlchemy 数据模型
- [ ] Repository 层通用 CRUD
- [ ] Article Service（创建/发布/查询）
- [ ] Auth Service（JWT）
- [ ] Tag Service
- [ ] 文件上传
- [ ] API 测试

**Phase 3: 前端页面（3-4 天）**
- [ ] Header / Footer / 主题切换
- [ ] 博客列表 + 文章卡片
- [ ] 文章详情 + MD 渲染 + TOC + 代码高亮
- [ ] 标签页 + 项目展示 + 简历
- [ ] Framer Motion 动画

**Phase 4: 管理后台（3-4 天）**
- [ ] 登录 + JWT 持久化
- [ ] 仪表盘
- [ ] Markdown 编辑器
- [ ] 文章/项目/标签/简历管理

**Phase 5: 部署上线（2-3 天）**
- [ ] SEO（metadata + sitemap）
- [ ] ISR 与缓存策略
- [ ] Docker 生产镜像
- [ ] VPS 部署 + HTTPS

**Phase 6: AI 增强（未来）**
- [ ] LangChain 自动标签
- [ ] 文章摘要
- [ ] AI 写作助手
- [ ] LangGraph 工作流

---

## 11. 项目目录结构（概述）

`
duole-ai-blog/
+-- apps/            # Next.js 前端
|   +-- app/         # App Router 页面
|   +-- components/  # 共享组件
|   +-- lib/         # 工具函数
|   +-- hooks/       # 自定义 Hooks
|   +-- types/       # TypeScript 类型
+-- backend/         # FastAPI 后端
|   +-- app/         # 应用代码
|   |   +-- api/     # API 路由
|   |   +-- models/  # 数据模型
|   |   +-- schemas/ # Pydantic 模式
|   |   +-- services/# 业务逻辑
|   |   +-- repos/   # 数据访问
|   |   +-- core/    # 基础设施
|   +-- alembic/     # 数据库迁移
|   +-- tests/       # 测试
+-- docker-compose.yml
+-- .gitignore
`

---

## 关键设计决策

1. **前后端分离**：FastAPI 在 AI 生态中不可替代（LangChain/LangGraph Python SDK 生态远超 JS），后期引入 AI 无需重构。

2. **Markdown 存储**：数据可移植，支持 Git 版本管理，便于 AI 工具交互。

3. **Repository 模式**：隔离 ORM 细节，使 Service 聚焦业务，方便 Mock 测试。

4. **UUID 主键**：避免自增 ID 信息泄露，便于未来分库分表。

5. **JSONB 简历**：简历格式多变，JSONB 避免频繁改表，PG 支持索引查询。

6. **CSR 后台 + SSR 前台**：后台交互频繁用 SPA 体验；前台内容用 SSR 保 SEO。
