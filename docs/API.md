# API 文档总览

后端统一前缀: `/api/v1`

## 响应结构

大部分接口返回结构:

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

分页列表接口统一使用 `page` 和 `page_size` 参数，`page` 从 1 开始，`page_size` 范围为 1-50。分页数据位于 `data` 中:

```json
{
  "items": [],
  "page": 1,
  "page_size": 10,
  "total": 0,
  "total_pages": 0
}
```

## 健康检查

- `GET /health`

## 认证模块

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

说明:

- 登录成功会设置 HttpOnly Cookie `access_token`
- 管理接口依赖 cookie 鉴权

## 用户模块 (admin)

- `GET /api/v1/users`
- `POST /api/v1/users`
- `PUT /api/v1/users/{user_id}`
- `DELETE /api/v1/users/{user_id}`

角色:

- 仅 `admin` 可调用

## 文章模块

- `GET /api/v1/articles`
- `GET /api/v1/articles?page=1&page_size=10`
- `GET /api/v1/articles/admin?page=1&page_size=10`
- `GET /api/v1/articles/{slug}`
- `POST /api/v1/articles`
- `PUT /api/v1/articles/{article_id}`
- `DELETE /api/v1/articles/{article_id}`

角色:

- 创建: `admin` / `editor`
- 编辑删除: `admin` 或创建者本人 (`editor`)

## 项目模块

- `GET /api/v1/projects`
- `GET /api/v1/projects?page=1&page_size=10`
- `GET /api/v1/projects/admin?page=1&page_size=10`
- `POST /api/v1/projects`
- `PUT /api/v1/projects/{project_id}`
- `DELETE /api/v1/projects/{project_id}`

角色:

- 创建: `admin` / `editor`
- 编辑删除: `admin` 或创建者本人 (`editor`)

## 标签模块

- `GET /api/v1/tags`
- `POST /api/v1/tags`
- `PUT /api/v1/tags/{tag_id}`
- `DELETE /api/v1/tags/{tag_id}`

角色:

- 查询: 所有用户可访问
- 写入: `admin` / `editor`

## 搜索模块

- `GET /api/v1/search?q={keyword}&scope={all|articles|projects}&page={page}&page_size={1-50}`

说明:

- `q` 为空时返回空结果
- `scope=all` 时同时返回文章与项目结果
- `page` 和 `page_size` 控制分页范围；`scope=all` 时文章和项目分别按同一页参数查询，`items` 为两类当前页结果的合并数组

## 简历模块

- `GET /api/v1/resume`
- `PUT /api/v1/resume`

角色:

- 更新: `admin` / `editor`，编辑者受创建者约束

## 查看自动生成文档

运行后端后访问:

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## 导出 OpenAPI 文件

在项目根目录执行:

```powershell
Set-Location backend
$env:PYTHONPATH = "$PWD"
.\.venv\Scripts\python.exe .\scripts\export_openapi.py
```

导出结果:

- `backend/openapi.json`
