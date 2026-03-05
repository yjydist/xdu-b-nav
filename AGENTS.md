# AGENTS.md
Practical guidance for coding agents in this repository.
Scope: whole repository (`/Users/yjydist/Repo/xd-b-guide`).

## 1) Project Overview
- Language: Go (`go 1.21`)
- Type: Go backend + static frontend (HTML/CSS/JS)
- Domain: 校园导航（室外高德 API + 室内图最短路）
- Entry: `cmd/server/main.go`
- Core packages:
  - `internal/amap`: 高德 Web 服务 API 集成
  - `internal/graph`: 图数据加载与查询
  - `internal/navigation`: 路径算法与路线组装
  - `internal/handler`: HTTP 接口
- Frontend:
  - `web/index.html`
  - `web/app.js`
  - `web/style.css`

## 2) Build / Run / Test Commands
Prefer `just` first (`justfile`). Use `just --list` to see all commands.

### Build / Run / Stop
- 开发运行: `just run` or `go run ./cmd/server`
- 构建: `just build` or `go build -o server ./cmd/server`
- 二进制运行: `just start` or `./server`
- 停止: `just stop` (pkill -f "./server")
- 重启: `just restart`
- 开发模式: `just dev` (uses `air` if installed, falls back to `go run`)
- 打开浏览器: `just open`
- 清理构建产物: `just clean`

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
- `b_graph.jsonc`: 室内拓扑图数据

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
- 保持原生 JS（不引入重框架，除非明确要求）。
- 文本渲染需做转义（`escapeHtml`）。
- 地图逻辑保持模块化：`initMap`、`renderOutdoorMap`。
- 地图不可用时保留可用的文字路线降级。

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
- 禁止提交构建产物：`server`、日志、备份文件。
- 修改后至少跑受影响包测试。
- 修改 API 协议时需确认前端兼容。
- 关键路由改动后执行 `just route-regression` 验证。

## 9) Cursor/Copilot Rule Files Check
Checked:
- `.cursor/rules/`
- `.cursorrules`
- `.github/copilot-instructions.md`

Status: none found in this repository.
If added later, those files become higher-priority supplements.

## 10) Pre-merge Checklist
- [ ] `go fmt ./...`
- [ ] `go test ./... -v`（或受影响包至少通过）
- [ ] API 关键路径手动冒烟验证
- [ ] 未暂存 `.env` 与二进制/备份文件
- [ ] 文档与配置说明已更新
