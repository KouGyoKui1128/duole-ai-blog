# backend (FastAPI)

本目录是多乐 AI 博客的后端服务，提供认证、用户、文章、项目、简历等 API。

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
- `/users`
- `/articles`
- `/projects`
- `/resume`

## 认证说明

- 登录后通过 HttpOnly Cookie 保存 token（`access_token`）
- 受保护接口通过 cookie 自动鉴权
- 角色: `admin` / `editor` / `viewer`

## 当前注意事项

- `main.py` 在 startup 时会执行迁移与 seed，开发环境方便，生产环境建议拆分为显式脚本
- `auth.py` 中 cookie 参数当前为 `secure=False`，上线前应改为 `True` 并配置 HTTPS
