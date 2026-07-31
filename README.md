# duole-ai-blog

多乐 AI 博客是一个前后端分离的个人技术站点，用于沉淀 AI 学习内容、展示项目与简历，并提供后台内容管理能力。

## 项目状态

- 当前阶段: 学习项目长期维护中
- 前端: 已具备公开页与后台页基础功能
- 后端: 已具备认证、用户、文章、项目、简历 API
- 现状说明: 前端公开页与管理端 API 基地址已统一读取环境变量，并保留默认回退值

## 技术栈

### 前端 (apps)

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI / shadcn 风格组件

### 后端 (backend)

- Python 3.12+
- FastAPI
- SQLAlchemy 2.0 (async)
- PostgreSQL (asyncpg)
- JWT (python-jose)

## 仓库结构

```text
duole-ai-blog/
  apps/                # Next.js 前端
  backend/             # FastAPI 后端
  docs/                # 架构、API、开发、部署文档
  start-dev.ps1        # 一键启动（Windows PowerShell）
  stop-dev.ps1         # 一键停止（Windows PowerShell）
  setup.ps1            # 一键初始化依赖与 .env
  README.md
```

## 快速开始 (Windows)

### 1) 一键初始化

```powershell
.\setup.ps1
```

该脚本会自动完成:

- 前端依赖安装 (`apps/npm install`)
- 后端虚拟环境创建 (`backend/.venv`)
- 后端依赖安装 (`pip install -r requirements.txt`)
- `.env.example` 复制为 `.env`（若目标文件不存在）

### 2) 配置环境变量

请检查并修改以下文件:

- `.env`
- `apps/.env`
- `backend/.env`

模板见:

- `.env.example`
- `apps/.env.example`
- `backend/.env.example`

### 3) 启动项目

```powershell
.\start-dev.ps1
```

访问地址:

- 前端: http://localhost:3000
- 后端: http://127.0.0.1:8000
- OpenAPI: http://127.0.0.1:8000/docs

停止服务:

```powershell
.\stop-dev.ps1
```

## 文档导航

- 前端开发: `apps/README.md`
- 后端开发: `backend/README.md`
- 架构设计: `docs/ARCHITECTURE.md`
- API 清单: `docs/API.md`
- 开发规范: `docs/DEVELOPMENT.md`
- 部署说明: `docs/DEPLOYMENT.md`
- 配置总览: `CONFIGURATION.md`

## 已知不足

- 前端 API 地址已统一，下一步是补齐测试与部署自动化
- 尚未引入自动化测试体系
- Docker 与 CI/CD 仍待补全

## 下一步方向

- Phase 1: 文档与配置基线完善
- Phase 2: 前后端配置统一与接口对齐
- Phase 3: 测试与工程质量建设

## 许可

当前仓库未声明开源许可证。如需开源发布，建议补充 LICENSE 文件。
