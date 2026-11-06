# apps (Next.js Frontend)

本目录是多乐 AI 博客的前端应用，基于 Next.js App Router，包含公开页面与后台管理页面。

## 目录概览

```text
apps/
	app/
		page.tsx                 # 首页
		blog/                    # 博客公开页面
		projects/                # 项目公开页面
		resume/                  # 简历公开页面
		admin/                   # 后台管理页面
	components/
		ui/                      # 基础 UI 组件
		layout/                  # Header/Footer/Sidebar
	lib/
		admin-api.ts             # 管理端 API 请求封装
		mock-data.ts             # 本地 mock 数据
```

## 本地开发

### 1) 安装依赖

```bash
npm install
```

### 2) 配置环境变量

复制 `apps/.env.example` 为 `apps/.env`。

建议至少配置:

```dotenv
SERVER_API_BASE=http://127.0.0.1:8000/api/v1
```

### 3) 启动开发服务器

```bash
npm run dev
```

默认地址: http://localhost:3000

## 运行脚本

- `npm run dev` 启动开发模式
- `npm run build` 生产构建
- `npm run start` 启动生产模式
- `npm run lint` 代码检查

## 当前实现说明

- 管理端 API 通过 `lib/admin-api.ts` 请求本站的 `/api/v1`，由 `next.config.ts` 转发到后端
- 公开页面通过 `lib/public-api.ts` 读取 `SERVER_API_BASE`，数据缓存 60 秒
- 图片由浏览器直传 Vercel Blob，`app/api/uploads/route.ts` 校验作者身份后发放上传令牌
- 文章正文由 `components/blog/markdown-content.tsx` 渲染 Markdown 和代码高亮
- 博客、项目、搜索和后台文章/项目列表已支持分页；分页控件会保留在 URL 中
- 中文文章在 `/blog`，英文文章在 `/english`，共用 `components/blog/article-index.tsx` 和 `article-detail.tsx`，界面文案在 `lib/article-language.ts`
- Header 与后台侧边栏支持深色和浅色切换，默认深色

## 开发约定

- 新页面默认使用 App Router
- 公共页面优先 Server Component
- 后台页面使用 Client Component + 权限校验
- 样式使用 Tailwind，组件优先复用 `components/ui`
