# Frontend（React + Vite）

## 1. 作用

前端负责博客展示与交互，数据来自后端 `/api/*` 接口。

核心页面：

- `/` 时间线
- `/posts/*` 文章详情
- `/tags` 与 `/tags/:tag` 标签
- `/folders` 与 `/folders/:path` 目录
- `/search` 搜索

## 2. 本地运行

```bash
npm install
npm run dev
```

默认地址：`http://localhost:5173`

## 3. 配置

通过环境变量配置后端地址：

```env
VITE_API_BASE_URL=https://api.blog.hltt.online
```

说明：

- 键（Key）：`VITE_API_BASE_URL`
- 值（Value）：`https://api.blog.hltt.online`（推荐带 `https://`）

代码入口：`/Users/hltt/projects/my_blog/frontend/src/config/backend.config.ts`

## 4. 当前实现说明

- Markdown 渲染：`react-markdown + remark-gfm + remark-math + rehype-katex`
- Obsidian 兼容：
  - `[[wiki link]]`、`![[embed]]`
  - Obsidian 注释 `%% ... %%`
  - 图片宽度参数（如 `![[a.png|500]]`）
- 加密文章通过 `password` 或 `X-Password` 解锁后展示内容

## 5. 已知限制

- 构建包体积较大（Mermaid 等依赖较重，生产构建会有 chunk warning）。
- “相关文章/邻近文章”逻辑基于 `limit=1000` 拉取，不适合超大文章库。
- API 失败提示目前偏统一，排障信息不够细。

## 6. 建议优化方向

- 将 Mermaid 等重依赖改为按需动态加载。
- 将相关推荐/邻近查询下沉到后端专用接口。
- 统一错误码到前端文案映射，提升可观测性。
