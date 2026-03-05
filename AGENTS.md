# AGENTS.md
Practical guidance for coding agents in this repository.
Scope: whole repository (`/Users/yjydist/Repo/xd-b-guide`).

## 关于本文档

本文档是 AI 编程助手的指导文件，具有以下特点：
- **启动时读取**：每次会话开始时，AI 会自动读取此文件获取项目上下文
- **手动更新**：本文档需要开发者手动维护，当项目结构或规范变化时及时更新
- **优先级**：本文档的规则高于 AI 的默认行为，但低于用户的直接指令

---

## 1) Project Overview
- Language: Go (`go 1.21`) + React 18 + Vite 5
- Type: Go backend + React frontend (前后端分离)
- Domain: 校园导航（室外高德 API + 室内图最短路）
- Entry: `cmd/server/main.go`
- Core packages:
  - `internal/amap`: 高德 Web 服务 API 集成
  - `internal/graph`: 图数据加载与查询
  - `internal/navigation`: 路径算法与路线组装
  - `internal/handler`: HTTP 接口
- Frontend:
  - `frontend/`: Vite + React 前端项目
  - `web/`: 旧版静态前端（逐步迁移）

## 2) Build / Run / Test Commands
Prefer `just` first (`justfile`). Use `just --list` to see all commands.

### Build / Run / Stop
- 后端开发运行: `just run` or `go run ./cmd/server`
- 后端构建: `just build` or `go build -o server ./cmd/server`
- 后端二进制运行: `just start` or `./server`
- 停止: `just stop` (pkill -f "./server")
- 重启: `just restart`
- 开发模式: `just dev` (uses `air` if installed, falls back to `go run`)
- 打开浏览器: `just open`
- 清理构建产物: `just clean`

### Frontend Commands
- 前端安装依赖: `cd frontend && npm install`
- 前端开发运行: `cd frontend && npm run dev`
- 前端构建: `cd frontend && npm run build`
- 前端预览构建: `cd frontend && npm run preview`

### Format / Lint
- 格式化: `just fmt` or `go fmt ./...`
- 目前无专用 linter 配置；如新增，建议 `golangci-lint`。

### Dependencies
- `just deps` or `go mod tidy`

### Location Coordinate Commands
- 刷新全部坐标: `just locations-refresh` (会写回 `config/locations.json`)
- 预览刷新（不写文件）: `just locations-refresh-dry`
- 刷新单个地点: `just locations-refresh-id <id>` (例: `just locations-refresh-id DX12`)

### Tests
- 全量: `just test` or `go test ./... -v`
- 简略: `just test-short` or `go test ./...`
- 路由回归测试: `just route-regression` (验证室外距离/耗时/路径节点链)
- 完整测试: `just full-test` (build + test + api-test)

### Single package test
- `go test ./internal/graph -v`
- `go test ./internal/navigation -v`

### Single test function
- `go test ./internal/navigation -run TestFindShortestPath -v`
- `go test ./internal/graph -run TestLoadGraph -v`

### API smoke test
- `just api-test`
- 需要服务已运行在 `localhost:8080`

## 3) Environment / Configuration
Use `.env` locally; never commit secrets.

### Config Files
- `config/locations.json`: 起点/终点坐标配置（包含 `display_name` 用于前端展示，`full_name` 用于高德地理检索）
- `b_graph.jsonc`: 室内拓扑图数据（位于项目根目录）
- `.env.example`: 环境变量示例文件

### Tools
- `cmd/tools/refresh-locations`: 坐标刷新工具，用于更新 `config/locations.json` 中的地点坐标

### Environment Variables
Important vars:
- `PORT` (default `8080`)
- `GRAPH_PATH` (default `b_graph.jsonc`)
- `AMAP_API_KEY` (后端 Web 服务 API)
- `AMAP_JS_API_KEY` (前端 JS 地图 key)
- `AMAP_SECURITY_CODE` (前端 JS 安全码)

Notes:
- 后端通过 `os.Getenv` 读取配置。
- 前端通过 `/api/config` 获取地图配置。
- JS key 缺失时前端应降级为文字路线展示。

### Key Code Locations
- 主入口: `cmd/server/main.go`
- 配置文件读取: `internal/amap/location_store.go`
- 图数据加载: `internal/graph/graph.go`
- 导航算法: `internal/navigation/navigation.go`
- 坐标刷新工具: `cmd/tools/refresh-locations/main.go`

## 4) Go Code Style
Follow existing code style first.

### Formatting / imports
- 必须 `go fmt`。
- imports 按标准库/第三方/本地包分组（遵循 `go fmt`）。

### Naming
- 文件名小写、语义化：`graph.go`, `navigation.go`。
- 导出标识符 PascalCase，非导出 camelCase。
- 动作函数用动词前缀：`FindBestRoute`, `LoadGraph`。

### Types
- 请求/响应结构体靠近 handler。
- 第三方 API 响应结构体放 `internal/amap`。
- 外部返回格式不稳定时才使用 `interface{}`。

### Error handling
- 统一包装错误上下文：`fmt.Errorf("...: %w", err)`。
- handler 使用统一 JSON 错误返回（`sendError`）。
- 先做输入校验（method、必填、格式）。
- 不要对用户输入导致的问题使用 panic。

### Logging
- 用 `log.Printf` 输出运行日志。
- 使用短上下文标签：`[API]`, `[导航请求]`, `[高德 API]`。
- 禁止输出密钥、令牌等敏感信息。

## 5) Frontend Conventions
- 使用 Vite + React 构建前端项目。
- 使用 MUI (Material UI) 实现 Material Design 3 风格。
- 文本渲染需做转义（防止 XSS 攻击）。
- 地图逻辑保持模块化：`initMap`、`renderOutdoorMap`。
- 地图不可用时保留可用的文字路线降级。
- 组件文件使用 PascalCase 命名（如 `RouteForm.jsx`）。
- 样式优先使用 MUI 组件，其次使用 CSS-in-JS。

## 6) Routing Logic Expectations
- 室外：起点 -> B 楼目标（高德步行路径）。
- 室内：从候选入口中选到目的地最短路径。
- 室内算法：Dijkstra on `b_graph.jsonc`。
- 修改边权时保持语义一致并验证路径合理性。

## 7) Data File Rules (`b_graph.jsonc`)
- 作为室内拓扑 source-of-truth。
- 保持 ID 稳定：`E*`, `S_ST*_F*`, `B***`。
- label 改动要谨慎（影响人类可读指引）。
- 调整边/权重后需跑测试并抽样验证路线。

## 8) Git / Change Management
- 变更要小而聚焦，不做无关重构。
- 禁止提交敏感文件：`.env`、密钥、token。
- 禁止提交构建产物：`./server`（项目根目录的二进制）、日志、备份文件。
- 修改后至少跑受影响包测试。
- 修改 API 协议时需确认前端兼容。
- 关键路由改动后执行 `just route-regression` 验证。

<!-- synced: 2026-03-05 -->

## 9) Cursor/Copilot Rule Files Check
Checked:
- `.cursor/rules/`
- `.cursorrules`
- `.github/copilot-instructions.md`

Status: none found in this repository.
If added later, those files become higher-priority supplements.

## 10) 开发规范

### 10.1 交流规范
- 所有对话、解释、提问一律使用**中文**

### 10.2 代码规范
- 所有新增或修改的代码，必须附加**详细的中文注释**
- 注释要解释"为什么这样做"，而不只是"做了什么"
- 关键逻辑、复杂算法、重要配置都必须有注释

### 10.3 开发节奏
- 拿到需求后，首先将整个开发任务**拆分成多个有序的 TODO**，按顺序列出
- 每次只完成**一个 TODO**，完成后暂停等待确认，不要一次性实现所有功能
- TODO 粒度要适中：一个 TODO 对应一次有意义的 git commit

### 10.4 Git 规范
- 每完成一个 TODO，立即执行 `git add` 和 `git commit`
- commit 前先用 `git status` 确认改动范围是否符合预期
- commit message 格式：第一行写总结性概括（直接描述做了什么，不要加 TODO 前缀），换行后用 Conventional Commits 列出具体变更

### 10.5 Git 分支工作流
采用双主线驱动配合临时分支的模型：

| 分支 | 用途 | 规则 |
|------|------|------|
| `main` | 生产环境稳定发布分支 | 绝对禁止直接开发，仅接受 dev 或 hotfix 合并，每次合并后必须打 Tag |
| `dev` | 开发主线分支 | 所有新功能和日常修复最终都必须合并到这里，禁止直接提交 |
| `feature/` | 从 dev 创建的新功能分支 | 完成开发后合并回 dev 并删除 |
| `fix/` | 从 dev 创建的日常 Bug 修复分支 | 完成开发后合并回 dev 并删除 |
| `hotfix/` | 从 main 创建的紧急修复分支 | 必须同时合并到 main 和 dev，合并后必须在 main 上打补丁 Tag |
| `refactor/` | 从 dev 创建的代码重构分支 | 完成开发后合并回 dev 并删除 |
| `chore/` | 从 dev 创建的构建配置/依赖更新/CI 等杂项分支 | 完成开发后合并回 dev 并删除 |
| `docs/` | 从 dev 创建的文档更新分支 | 完成开发后合并回 dev 并删除 |

#### 版本发布流程
1. 确认 `dev` 已通过测试
2. 将 `dev` 合并到 `main`
3. 在合并节点执行 `git tag -a v<x.y.z> -m "release: v<x.y.z>"`
4. 执行 `git push origin main --tags`

#### 绝对禁止事项
- 禁止直接在 `main` 或 `dev` 上提交代码
- 禁止将 `feature/` / `fix/` 等临时分支直接合并到 `main`
- 禁止从 `dev` 创建 `hotfix/` 分支
- 禁止 `hotfix/` 只合并到 `main` 而遗漏 `dev`
- 无充分理由禁止使用 `git push -f`

## 11) Pre-merge Checklist
- [ ] `go fmt ./...`
- [ ] `go test ./... -v`（或受影响包至少通过）
- [ ] API 关键路径手动冒烟验证
- [ ] 未暂存 `.env` 与二进制/备份文件
- [ ] 文档与配置说明已更新
