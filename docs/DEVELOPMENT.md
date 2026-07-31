# 开发指南

## 分支与提交流程

建议使用:

1. `main`: 稳定分支
2. `feature/*`: 功能分支
3. `fix/*`: 修复分支

提交建议遵循 Conventional Commits:

- `feat:` 新功能
- `fix:` 修复
- `docs:` 文档
- `refactor:` 重构
- `chore:` 维护

## 本地开发流程

1. 安装前后端依赖
2. 配置 `.env`
3. 使用 `start-dev.ps1` 启动
4. 开发完成后使用 `stop-dev.ps1` 停止

首次初始化可直接使用:

```powershell
.\setup.ps1
```

## 编码约定

### 前端

- 优先 TypeScript 严格类型
- 页面组件按路由聚合
- 公共 UI 组件放在 `components/ui`
- API 调用统一收敛到 `lib/*api*.ts`

### 后端

- 路由函数命名统一动宾结构
- Pydantic payload 与响应结构明确分离
- 权限检查统一使用依赖注入或 helper
- 所有数据库读写使用 async session

## 联调约定

- 前端默认地址: http://localhost:3000
- 后端默认地址: http://127.0.0.1:8000
- 使用浏览器开发者工具检查 cookie 与请求头

## 质量建议

当前仓库尚未建立完整测试体系，建议优先补齐:

1. 后端单元测试 (pytest)
2. 后端接口测试
3. 前端关键逻辑测试
4. CI 自动 lint + test
