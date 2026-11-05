# 配置总览

## 1. 后端配置

文件: `backend/.env`，模板见 `backend/.env.example`。

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| DATABASE_URL | 是 | 无 | PostgreSQL 连接字符串，Neon 这类托管地址可以直接粘贴 |
| SECRET_KEY | 是 | 无 | JWT 签名密钥，至少 32 个字符，缺失或太弱时后端拒绝启动 |
| AUTHOR_EMAIL | 首次启动必填 | 无 | 作者账号邮箱 |
| AUTHOR_PASSWORD | 首次启动必填 | 无 | 作者账号初始密码，至少 12 个字符 |
| COOKIE_SECURE | 否 | true | 本地 http 开发时设为 false |
| SEED_DEMO_DATA | 否 | false | 空数据库时写入演示内容，只用于本地开发 |
| CORS_ORIGINS | 否 | localhost:3000 | 逗号分隔的来源列表 |
| ACCESS_TOKEN_EXPIRE_MINUTES | 否 | 10080 | token 过期时间（分钟） |
| BACKEND_HOST | 否 | 127.0.0.1 | 启动脚本读取 |
| BACKEND_PORT | 否 | 8000 | 启动脚本读取 |
| REDIS_URL | 否 | 空 | 为空时禁用缓存，直接查询数据库 |
| REDIS_DEFAULT_TTL | 否 | 300 | 默认缓存有效期（秒） |

作者账号只在数据库里没有作者时创建一次。之后改这两个变量不起作用，密码要在后台“修改密码”里改，重启不会重置。

## 2. 前端配置

文件: `apps/.env`，模板见 `apps/.env.example`。

| 变量 | 必填 | 推荐值 | 说明 |
|------|------|--------|------|
| SERVER_API_BASE | 是 | http://127.0.0.1:8000/api/v1 | 后端 API 地址 |
| BLOB_READ_WRITE_TOKEN | 上传图片时必填 | 无 | Vercel Blob 令牌，连接 Blob 存储后由 Vercel 自动设置 |

浏览器只访问本站的 `/api/v1`，再由 `next.config.ts` 转发到 `SERVER_API_BASE`。这样登录 cookie 属于本站，不需要跨域。转发规则在构建时生成，修改 `SERVER_API_BASE` 后要重新部署。

## 3. 缓存

- 公开页面的数据缓存 60 秒。后端休眠时，访问过的页面显示上一次的内容，从没被访问过的页面要等后端唤醒。
- 作者在后台改动内容后，缓存立即失效，下一次访问就能看到变化。
- 搜索不走缓存。
- Redis 是可选的后端缓存层，不可用时自动回退数据库。

## 4. 分页与主题

- 文章、项目和搜索接口使用 `page`（从 1 开始）与 `page_size`（1-50）分页。
- 前端主题支持 `system`、`light`、`dark` 三态，用户选择保存在浏览器 localStorage。

## 5. 安全建议

1. 不要提交任何真实 `.env` 到仓库
2. 生产环境不要设置 `COOKIE_SECURE=false` 和 `SEED_DEMO_DATA=true`
3. 首次登录后立即修改初始密码
