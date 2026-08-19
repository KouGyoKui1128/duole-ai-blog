# 部署指南 (草案)

## 目标环境

- OS: Linux (Ubuntu 22.04+)
- Python: 3.12+
- Node.js: 20+
- PostgreSQL: 16+

## 前端部署

```bash
cd apps
npm ci
npm run build
npm run start
```

默认端口 3000，可通过反向代理暴露。

## 后端部署

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 必配环境变量

- `DATABASE_URL`
- `SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `BACKEND_HOST`
- `BACKEND_PORT`
- `REDIS_URL`（可选；启用缓存时配置）
- `REDIS_DEFAULT_TTL`（可选）

详见 `CONFIGURATION.md`。

## 反向代理建议

- 前端域名: `blog.example.com`
- 后端域名: `api.example.com`
- 生产环境强制 HTTPS

## 生产前检查清单

1. `SECRET_KEY` 已替换为强随机值
2. cookie `secure` 已启用
3. CORS 白名单已限定
4. 数据库账号权限最小化
5. 日志与监控已配置

6. Redis 可用性与缓存降级日志已纳入监控

## 当前缺口

- 尚未提供 Dockerfile 与 docker-compose.yml
- 尚未提供 CI/CD 工作流配置
