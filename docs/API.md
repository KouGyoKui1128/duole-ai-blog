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
- `GET /api/v1/articles/{slug}`
- `POST /api/v1/articles`
- `PUT /api/v1/articles/{article_id}`
- `DELETE /api/v1/articles/{article_id}`

角色:

- 创建: `admin` / `editor`
- 编辑删除: `admin` 或创建者本人 (`editor`)

## 项目模块

- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `PUT /api/v1/projects/{project_id}`
- `DELETE /api/v1/projects/{project_id}`

角色:

- 创建: `admin` / `editor`
- 编辑删除: `admin` 或创建者本人 (`editor`)

## 简历模块

- `GET /api/v1/resume`
- `PUT /api/v1/resume`

角色:

- 更新: `admin` / `editor`，编辑者受创建者约束

## 查看自动生成文档

运行后端后访问:

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
