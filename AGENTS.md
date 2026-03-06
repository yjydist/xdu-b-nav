# AGENTS.md

`xdu-b-nav` 仓库智能体执行规范（唯一真源）。

## 0. 文档定位与优先级
- 本文件是仓库内开发规范的唯一真源（single source of truth）。
- 任何会话都不能只在开始时读取一次本文件，必须按“重读触发器”持续重读。
- 规则冲突处理优先级（从高到低）：
  1. 用户当前指令
  2. 系统/安全约束
  3. Cursor/Copilot 规则
  4. AGENTS.md
  5. 默认行为

## 1. 规则文件发现结果（仓库本地）
已检查以下位置：
- `AGENTS.md`：存在
- `.cursor/rules/`：不存在
- `.cursorrules`：不存在
- `.github/copilot-instructions.md`：不存在

维护要求：
- 若未来新增上述 Cursor/Copilot 规则文件，必须先更新本文件再执行开发任务。

## 2. 项目范围与技术栈
- 后端：Go 1.21（模块 `xdu-b-nav`）
- 前端：Vite 5 + React 18 + MUI
- 包管理器：Bun（前端）
- 命令入口：`justfile`
- 地图服务：高德 API（可选，未配置时有降级逻辑）
- 图配置：`config/b_graph.jsonc`

## 3. 目录结构与职责
- `cmd/server/main.go`：服务启动、环境变量加载、路由注册、优雅停机
- `internal/graph`：图结构、JSONC 读取、邻接表构建
- `internal/navigation`：Dijkstra 最短路与室内外路径拼接
- `internal/amap`：高德接口封装与地点坐标存储
- `internal/handler`：HTTP Handler、参数校验、JSON 响应
- `config/b_graph.jsonc`：楼内节点/边权重定义
- `config/locations.json`：室外起点与出口坐标
- `frontend/src/api`：前端 API 请求封装
- `frontend/src/components`：前端页面组件

## 4. 环境准备
后端依赖：
```bash
go mod tidy
```

前端依赖：
```bash
cd frontend
bun install
```

可选环境变量：
```bash
cp .env.example .env
```

## 5. 构建 / 运行 / 格式化 / 测试命令基线
优先使用 `just`：
```bash
just build      # go build -o server ./cmd/server
just run        # go run ./cmd/server
just test       # go test ./... -v
just fmt        # go fmt ./...
just dev        # air 存在时用 air，否则 go run
just api-test   # 启动服务并执行 API 烟测 + 回归检查
```

直接命令：
```bash
go build -o server ./cmd/server
go run ./cmd/server
go fmt ./...
go test ./... -v
```

前端命令：
```bash
cd frontend
bun run dev
bun run build
bun run preview
```

## 6. 单元测试命令（重点）
单包：
```bash
go test ./internal/graph -v
go test ./internal/navigation -v
```

单函数：
```bash
go test ./internal/graph -run TestLoadGraph -v
go test ./internal/navigation -run TestFindBestRoute -v
```

正则多函数：
```bash
go test ./internal/navigation -run "TestFindShortestPath|TestFindBestRoute" -v
go test ./internal/graph -run "TestLoadGraph|TestGetFloor" -v
```

执行策略：
- 先跑受影响包/函数，再跑 `go test ./... -v`。
- 仓库当前无独立 linter；`go fmt ./...` 是基础格式门禁。

## 7. 代码风格事实（基于当前仓库实现）
### 7.1 Go 代码
- 导入顺序：标准库 -> 第三方 -> 本仓库内部包（内部包路径使用 `xdu-b-nav/...`）。
- 命名：
  - 导出标识符使用 PascalCase（如 `FindBestRoute`）。
  - 非导出标识符使用 camelCase（如 `buildPathSteps`）。
  - 错误变量统一使用 `err`。
- 类型使用：
  - API 返回优先使用稳定 struct 定义。
  - JSON 字段命名保持 snake_case 兼容现有接口（如 `error_message`、`total_weight`）。
- 错误处理：
  - 内部逻辑返回 error，不使用 panic。
  - 包装错误时提供上下文（`fmt.Errorf("...: %w", err)`）。
  - Handler 先校验再返回错误，使用正确 HTTP 状态码。
- HTTP/JSON 约定：
  - 设置 `Content-Type: application/json`。
  - 显式拒绝不支持的 HTTP 方法。
  - 错误响应保持 `{ "success": false, "error_message": "..." }` 结构。

### 7.2 前端代码
- 使用函数组件 + Hooks。
- 状态尽量就近管理，共享状态再提升。
- API 请求统一放在 `frontend/src/api`，组件层避免分散直接请求。
- 组件名 PascalCase，变量/函数 camelCase。
- 对加载态、错误态、成功态提供明确 UI 反馈。

## 8. 图数据契约
`config/b_graph.jsonc` 当前核心依赖：
- `nodes`
- `edges`

约束：
- `edges[].w` 直接作为边权重。
- 节点 ID 必须唯一。
- 每条边的两端都必须在 `nodes` 中存在。
- 保证关键路径连通，避免导航断路。

节点 ID 语义：
- `Bxxx`：房间/教室（如 `B301`）
- `S_ST{n}_F{m}`：楼梯（如 `S_ST2_F5`）
- `E{n}`：入口/出口（如 `E1`）

## 9. 开发节奏规范（内置版）
- 全程中文沟通（分析、提问、总结、代码说明）。
- 新增/修改代码时，对非显然逻辑优先写中文注释，重点解释“为什么”。
- 接到任务后先拆 TODO，再按顺序执行。
- 复杂任务默认小步推进，避免一次性大改。
- 提交前必须检查变更范围与目标分支是否匹配。

## 10. Git 分支与发布规范（内置版）
长期分支：
- `main`：生产稳定分支
- `dev`：开发主线分支

常规分支（必须从 `dev` 拉取并回合到 `dev`）：
- `feature/*`
- `fix/*`
- `refactor/*`
- `chore/*`
- `docs/*`

紧急分支：
- `hotfix/*` 必须从 `main` 创建，并同时合并回 `main` 和 `dev`。

发布流程：
- `dev` 合并到 `main` 后，在 `main` 打版本 tag。

明确禁止：
- 直接在 `main` 上进行功能开发提交。
- 将 `feature/*` 或 `fix/*` 直接合并到 `main`。
- 从 `dev` 创建 `hotfix/*`。
- 未经明确授权的强制推送。

## 11. AGENTS 强制重读与更新机制（必须执行）
### 11.1 重读触发器
在以下时机必须重读 `AGENTS.md`：
- 会话开始时
- 执行 `git switch` / `git pull` / `git merge` / `git rebase` 后
- 执行 `commit` / `merge` / `push` 前
- 用户明确提出“规范有更新”或“请重读 AGENTS.md”时
- 长会话每 8-10 轮进行一次一致性重读

### 11.2 更新触发器
出现以下任一情况，必须更新 `AGENTS.md`：
- 用户新增流程约束、命名规则、提交规范、发布规范
- 发现本文件与仓库实际命令/结构/契约不一致
- 新增了 Cursor/Copilot 规则文件

触发后动作（固定顺序）：
1. 先更新 `AGENTS.md`
2. 再在回复中明确声明：`已更新并重读 AGENTS.md，后续按新规则执行`

## 12. Agent 执行清单
改动前：
- 阅读受影响模块与现有实现模式。
- 检查是否涉及 API 契约、配置契约、数据契约。
- 若任务复杂，先给出 TODO 拆解再实施。

改动后：
- 先跑针对性测试（包/函数级），再跑更大范围回归。
- Go 改动后执行 `go fmt ./...`。
- 汇报变更文件与验证命令。

提交前：
- 重读 `AGENTS.md`（强制）。
- 确认分支类型与来源分支符合 Git 工作流规范。
- 确认提交内容聚焦、无敏感信息（如 `.env`、密钥、凭证）。

## 13. 一致性维护说明
- 当 README、justfile、代码行为发生变化且影响开发流程时，需同步更新本文件。
- 若本文件与实际不一致，以“先修正文档再执行”作为默认策略。
