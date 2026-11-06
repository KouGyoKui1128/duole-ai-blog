# backend (FastAPI)

本目录是多乐 AI 博客的后端服务，提供认证、文章、项目、标签、简历和搜索 API。

## 技术栈

- FastAPI
- SQLAlchemy 2.0 (async)
- PostgreSQL (asyncpg)
- python-dotenv
- JWT (python-jose)

## 目录概览

```text
backend/
  app/
    main.py                 # FastAPI 入口
    database.py             # 数据库连接与 Session
    auth.py                 # JWT、鉴权依赖
    api/v1/                 # API 路由
    models/                 # ORM 模型
    schemas/                # Pydantic schema
  requirements.txt
  .venv/                    # 本地虚拟环境
```

## 本地开发

### 1) 创建虚拟环境并安装依赖

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2) 配置环境变量

复制 `backend/.env.example` 为 `backend/.env`。

最少配置:

```dotenv
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/duole_blog
SECRET_KEY=replace-this-with-a-long-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### 3) 启动后端

```powershell
$env:PYTHONPATH = "$PWD"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

服务地址:

- API: http://127.0.0.1:8000
- OpenAPI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## API 路由前缀

统一前缀: `/api/v1`

- `/auth`
- `/articles`
- `/projects`
- `/tags`
- `/resume`
- `/search`

## 认证说明

- 登录后通过 HttpOnly Cookie 保存 token（`access_token`）
- 受保护接口通过 cookie 自动鉴权
- 站点只有一位作者，所有写接口都要求作者登录

文章、项目和搜索列表支持统一的 `page` / `page_size` 分页参数，响应包含 `items`、`page`、`page_size`、`total` 和 `total_pages`。

## 当前注意事项

- 启动时自动建表，并在没有作者时用 `AUTHOR_EMAIL`、`AUTHOR_PASSWORD` 创建作者账号
- 自动建表不会给已有的表加字段，新字段写进 `app/migrations.py`，语句要能重复执行
- 配置集中在 `app/config.py`，`SECRET_KEY` 或 `DATABASE_URL` 缺失时拒绝启动

## 运行测试

测试使用本地 PostgreSQL 上的 `<数据库名>_test`，不存在时自动创建，不会碰开发数据库。

```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pytest
```

## 导出 API 文档

```powershell
Set-Location backend
$env:PYTHONPATH = "$PWD"
.\.venv\Scripts\python.exe .\scripts\export_openapi.py
```

导出文件路径:

- `backend/openapi.json`
