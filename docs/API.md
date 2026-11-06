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
- `POST /api/v1/auth/change-password`

说明:

- 登录成功会设置 HttpOnly Cookie `access_token`
- 管理接口依赖 cookie 鉴权

## 文章模块

- `GET /api/v1/articles`
- `GET /api/v1/articles?page=1&page_size=10&tag={tag_slug}&language={zh|en}`
- `GET /api/v1/articles/admin?page=1&page_size=10`
- `GET /api/v1/articles/{slug}`
- `GET /api/v1/articles/{slug}/related?limit=2`
- `POST /api/v1/articles`
- `PUT /api/v1/articles/{article_id}`
- `POST /api/v1/articles/{article_id}/publish`
- `DELETE /api/v1/articles/{article_id}`

说明:

- 已发布文章按发布日期从新到旧排序
- `language` 默认为 `zh`，公开列表一次只返回一种语言；`/articles/admin` 返回全部语言
- 创建时不传 `language` 即为中文，更新时不传则保持不变
- 相关文章只取同语言、有共同标签的文章，共同标签多的排在前面
- `published_at` 格式为 `2026-01-31`，留空时取发布当天
- `is_public` 为 `false` 是草稿，为 `true` 是已发布；创建时不传即为草稿
- `publish` 接口的请求体是 `{"is_public": true}`

角色:

- 写入: 仅作者

## 项目模块

- `GET /api/v1/projects`
- `GET /api/v1/projects?page=1&page_size=10`
- `GET /api/v1/projects/admin?page=1&page_size=10`
- `POST /api/v1/projects`
- `PUT /api/v1/projects/{project_id}`
- `POST /api/v1/projects/{project_id}/publish`
- `DELETE /api/v1/projects/{project_id}`

角色:

- 写入: 仅作者

## 标签模块

- `GET /api/v1/tags`
- `POST /api/v1/tags`
- `PUT /api/v1/tags/{tag_id}`
- `DELETE /api/v1/tags/{tag_id}`

角色:

- 查询: 所有访客可访问
- 写入: 仅作者

## 搜索模块

- `GET /api/v1/search?q={keyword}&scope={all|articles|projects}&page={page}&page_size={1-50}`

说明:

- `q` 为空时返回空结果
- 文章结果包含中英文，每条带 `language` 字段
- `scope=all` 时同时返回文章与项目结果
- `page` 和 `page_size` 控制分页范围；`scope=all` 时文章和项目分别按同一页参数查询，`items` 为两类当前页结果的合并数组

## 简历模块

- `GET /api/v1/resume`
- `PUT /api/v1/resume`

角色:

- 更新: 仅作者

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
