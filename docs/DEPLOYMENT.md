# 部署指南

线上由三部分组成，都使用免费档:

| 部分 | 平台 | 说明 |
|------|------|------|
| 前端 | Vercel Hobby | Root Directory 设为 `apps` |
| 后端 | Render Free | 配置见仓库根目录的 `render.yaml` |
| 数据库 | Neon Free | 不要用 Render 的免费数据库，它 30 天后到期 |
| 图片 | Vercel Blob | 由浏览器直传，不经过后端 |

## 部署顺序

### 1. 创建数据库

Neon 项目已经建好，区域是新加坡，配置在根目录的 `neon.ts`。在仓库根目录运行 `neon env pull`，连接字符串会写入 `.env.local`（不进 git）:

- `DATABASE_URL`: 连接池地址（主机名带 `-pooler`），后端用这个
- `DATABASE_URL_UNPOOLED`: 直连地址，迁移和 `pg_dump` 用这个

本地开发继续用 `backend/.env` 里的本地 PostgreSQL。不要把它指向 production 分支：那里的 `SEED_DEMO_DATA=true` 会把演示文章写进线上库，作者账号也会用本地密码创建，之后 Render 的 `AUTHOR_PASSWORD` 不再生效。要用线上数据调试时，先运行 `neon checkout dev --create` 建一个分支。

### 2. 部署后端

在 Render 选择 New > Blueprint，连接本仓库，它会读取 `render.yaml`。按提示填写:

- `DATABASE_URL`: `.env.local` 里的 `DATABASE_URL`（连接池地址），原样粘贴
- `AUTHOR_EMAIL`: 登录后台用的邮箱
- `AUTHOR_PASSWORD`: 初始密码，至少 12 个字符

`SECRET_KEY` 由 Render 自动生成。部署完成后，打开 `https://<服务名>.onrender.com/health` 确认返回 `healthy`。

### 3. 部署前端

在 Vercel 导入本仓库，Root Directory 选 `apps`，添加环境变量:

- `SERVER_API_BASE`: `https://<服务名>.onrender.com/api/v1`

然后在项目的 Storage 页面创建 Blob 存储（访问方式选 Public）并连接到项目，Vercel 会自动设置 `BLOB_STORE_ID` 和 `BLOB_WEBHOOK_PUBLIC_KEY`。连接后重新部署一次。

### 4. 上线检查

1. 打开 `/admin/login`，用作者账号登录
2. 修改初始密码
3. 上传一张图片，确认文章里能显示
4. 发布一篇文章，刷新首页确认

## 免费档的限制

- Render 免费实例闲置 15 分钟后休眠，唤醒约需 1 分钟。访问过的公开页面有缓存，不受影响；从没被访问过的页面、后台登录和搜索要等它唤醒。
- Render 免费实例的本地磁盘不持久，所以图片存在 Vercel Blob。
- Vercel Hobby 仅限个人非商业用途。

## 后续部署

向 `main` 推送后，Vercel 和 Render 会自动重新部署。数据库表在后端启动时自动创建。给已有的表加字段要写进 `backend/app/migrations.py`，后端启动时自动执行。

## 导出数据

迁移和备份都用 `scripts/export-production.ps1`。它只读取数据，不修改线上库，也不启动后端。建议每录入一批内容后导出一次，迁移前再导出一次。

```powershell
powershell -ExecutionPolicy Bypass -File scripts\export-production.ps1
```

- 需要先在仓库根目录运行过 `neon env pull`。脚本读取 `.env.local` 里的 `DATABASE_URL_UNPOOLED`，本机要装有 PostgreSQL 客户端，版本不能低于线上库。
- 生成 `duole-blog-<时间>.zip`，默认保存在仓库旁边的 `duole-ai-blog-backups/` 目录。里面有:
  - `database.dump`: 整个数据库
  - `images/`: 数据库里引用的 Vercel Blob 图片，路径和原来一样（`articles/...`、`projects/...`）
  - `manifest.json`: 导出时间、各表行数、图片下载结果
- 导出文件包含作者邮箱和密码哈希，脚本不允许保存到仓库里，也不要发给别人。
- 退出码 0 表示成功；2 表示有图片没下载成功，失败的地址列在 `manifest.json` 的 `images.failed` 里。
- 用本地开发库试运行时，加上 `-EnvFile backend\.env -Variable DATABASE_URL -OutputDir <仓库外的目录>`。

### 在新服务器上还原

1. 新建一个空数据库，**在后端第一次启动之前**导入。后端启动时会建表并创建作者账号，先启动再导入会冲突。

   ```bash
   unzip duole-blog-<时间>.zip -d export
   pg_restore --no-owner --no-acl --exit-on-error --dbname "$DATABASE_URL" export/database.dump
   ```

   作者账号和密码原样保留，之后 `AUTHOR_EMAIL` 和 `AUTHOR_PASSWORD` 不再起作用。

2. 把 `export/images/` 里的文件复制到新服务器存放图片的目录。
3. 把数据里的 Blob 地址换成新地址。下面以 `/uploads/` 为例，实际按新服务器的图片路径填写:

   ```sql
   UPDATE articles SET content = regexp_replace(content, 'https://[a-z0-9]+\.public\.blob\.vercel-storage\.com/', '/uploads/', 'g');
   UPDATE projects SET cover_url = regexp_replace(cover_url, 'https://[a-z0-9]+\.public\.blob\.vercel-storage\.com/', '/uploads/', 'g') WHERE cover_url IS NOT NULL;
   ```
