# 配置总览

本文档描述当前项目的关键配置项与推荐值。

## 1. 后端配置

文件: `backend/.env`

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| DATABASE_URL | 是 | (代码内有开发默认值) | PostgreSQL 连接字符串 |
| SECRET_KEY | 是 | duole-dev-secret-change-me | JWT 签名密钥，上线必须替换 |
| ACCESS_TOKEN_EXPIRE_MINUTES | 否 | 10080 | token 过期时间（分钟） |
| BACKEND_HOST | 否 | 127.0.0.1 | 启动脚本可读取 |
| BACKEND_PORT | 否 | 8000 | 启动脚本可读取 |
| REDIS_URL | 否 | 空 | Redis 连接地址；为空时禁用缓存并直接查询数据库 |
| REDIS_DEFAULT_TTL | 否 | 300 | 默认缓存有效期（秒） |

## 2. 前端配置

文件: `apps/.env`

| 变量 | 必填 | 推荐值 | 说明 |
|------|------|--------|------|
| NEXT_PUBLIC_API_BASE | 是 | http://localhost:8000/api/v1 | 浏览器侧请求 API 基地址 |
| SERVER_API_BASE | 是 | http://localhost:8000/api/v1 | Server Component 请求 API 基地址 |

## 3. 当前代码现状

前端 API 基地址已统一为环境变量读取:

1. 管理端通过 `NEXT_PUBLIC_API_BASE` 读取
2. Server Component 通过 `SERVER_API_BASE` 读取
3. `SERVER_API_BASE` 缺失时自动回退到 `NEXT_PUBLIC_API_BASE`
4. 两者均缺失时回退到默认值 `http://127.0.0.1:8000/api/v1`，保证向后兼容
5. 浏览器端在本地开发场景下会优先跟随当前主机（localhost 或 127.0.0.1）生成默认地址，降低 cookie 丢失风险

## 4. 分页与主题

- 文章、项目和搜索接口使用 `page`（从 1 开始）与 `page_size`（1-50）分页。
- Redis 是可选缓存层，Redis 不可用时自动回退数据库。
- 前端主题支持 `system`、`light`、`dark` 三态，用户选择保存在浏览器 localStorage。

## 5. 安全建议

1. 生产环境必须替换 `SECRET_KEY`
2. 生产环境开启 secure cookie（HTTPS）
3. 生产环境将 CORS 限制到业务域名
4. 不要提交任何真实 `.env` 到仓库
