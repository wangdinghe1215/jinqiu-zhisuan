# AGENTS.md - 足球分析仪表盘

## 项目概览

专业足球赛事赔率分析与数据可视化平台，采用暗色主题设计，提供今日分析、流水线状态、历史战绩、数据概览四大面板。

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui
- **Styling**: Tailwind CSS 4
- **图表**: Recharts
- **数据库**: SQLite (better-sqlite3)
- **图标**: Lucide React

## 目录结构

```
src/
├── app/
│   ├── api/                    # 后端API路由
│   │   ├── matches/route.ts    # 比赛列表/日期筛选
│   │   ├── matches/[id]/route.ts # 比赛详情
│   │   ├── history/route.ts    # 历史战绩数据
│   │   └── overview/route.ts   # 概览/流水线数据
│   ├── page.tsx                # 今日分析面板 (首页)
│   ├── pipeline/page.tsx       # 流水线状态面板
│   ├── history/page.tsx        # 历史战绩面板
│   ├── overview/page.tsx       # 数据概览面板
│   ├── layout.tsx              # 根布局
│   └── globals.css             # 全局样式+暗色主题
├── components/
│   ├── AppLayout.tsx           # 应用布局包装器
│   ├── Sidebar.tsx             # 左侧导航栏
│   ├── TopBar.tsx              # 顶部状态栏
│   ├── MatchCard.tsx           # 比赛分析卡片组件
│   ├── badges.tsx              # T-level标签/星级/方向/结果徽章
│   └── ui/                     # shadcn/ui 组件库
├── lib/
│   ├── db.ts                   # SQLite数据库访问层
│   └── utils.ts                # 通用工具函数
```

## 核心功能模块

### 1. 今日分析面板 (`/`)
- 当日所有竞彩比赛赔率分析结果
- 比赛卡片：场次编号、联赛、对阵、SPF/RSPF赔率、让球
- T-level等级标签（T0钻石/T1a/T1b/T2/T2b/T3渐变色）
- 线0方向标记、星级评定、CR交叉比值、黄金比分TOP3
- 支持按T-level、联赛、关键词筛选
- 点击卡片展开详情

### 2. 流水线状态面板 (`/pipeline`)
- 每日自动分析脚本运行状态（成功/失败/运行中）
- 处理场次、耗时统计
- 7天运行记录表格
- 处理场次趋势柱状图、运行耗时折线图

### 3. 历史战绩面板 (`/history`)
- T-level各等级命中率统计柱状图
- 命中率进度条列表
- 钻石信号追踪记录表
- 按日期筛选

### 4. 数据概览面板 (`/overview`)
- 总记录数、日期范围、分析覆盖率
- 各联赛数据占比饼图
- 联赛比赛数量柱状图
- 数据表结构概览

## 数据库设计

**表名**: `matches`

**核心字段**:
- `match_no` TEXT - 场次编号 (主键)
- `league` TEXT - 联赛名
- `home_team` / `away_team` TEXT - 主客队
- `match_date` TEXT - 比赛日期 (YYYY-MM-DD)
- `spf_home/draw/away` REAL - SPF胜平负赔率
- `rspf_home/draw/away` REAL - 让球胜平负赔率
- `handicap` REAL - 让球数
- `score_odds` TEXT - 比分赔率JSON
- `full_time_result/score` TEXT - 赛果
- `analyzed` INTEGER - 是否已分析
- `recommended_direction` TEXT - 推荐方向
- `hit_result` TEXT - 命中结果 (命中/未命中)
- `strategy_used` TEXT - 使用策略
- `t_level` TEXT - T等级 (T0/T1a/T1b/T2/T2b/T3)
- `cr_ratio` REAL - CR交叉比值
- `line0_direction` TEXT - 线0方向
- `star_rating` INTEGER - 星级 (1-5)
- `top_scores` TEXT - 黄金比分TOP3 JSON

## 设计规范

- 暗色主题，主背景 `#0f0f1a`，卡片 `#1a1a2e`
- T-level渐变：钻石青色/金金色/银银色/铜铜色/铁灰色
- 数据密集型表格布局，等宽数字字体
- 响应式：移动端侧边栏收起为汉堡菜单
- 自定义暗色滚动条

## 开发命令

```bash
pnpm install      # 安装依赖
pnpm run dev      # 开发模式
pnpm run build    # 生产构建
pnpm ts-check     # TypeScript检查
pnpm lint         # ESLint检查
```

## 环境变量

- `FOOTBALL_DB_PATH` - SQLite数据库路径（默认: `/app/data/所有对话/主对话/足球分析/odds_database.db`）
- 数据库文件不存在时自动使用内存数据库+示例数据

## API接口

| 方法 | 路径 | 功能 | 参数 |
|------|------|------|------|
| GET | `/api/matches?date=YYYY-MM-DD` | 获取指定日期比赛 | date: 日期 |
| GET | `/api/matches/:id` | 获取单场比赛详情 | id: 场次编号 |
| GET | `/api/history?date=` | 历史战绩+钻石信号 | date: 可选日期筛选 |
| GET | `/api/overview` | 数据概览+流水线状态 | 无 |
