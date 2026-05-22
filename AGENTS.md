# AGENTS.md

`xdu-b-nav` 仓库智能体执行规范（唯一真源）。

## 0. 文档定位与优先级
- 本文件是仓库内开发规范的唯一真源。
- 规则冲突处理优先级（从高到低）：用户指令 > 系统约束 > AGENTS.md > 默认行为。

## 1. 规则文件发现结果
已检查以下位置：
- `AGENTS.md`：存在
- `.cursor/rules/`：不存在
- `.cursorrules`：不存在
- `.github/copilot-instructions.md`：不存在

维护要求：若未来新增 Cursor/Copilot 规则文件，必须先更新本文件再执行开发任务。

## 2. 项目范围与技术栈
- 后端：Go 1.21+（模块 `xdu-b-nav`，由 `go.mod` 声明）
- 前端：Vite 5 + React 18 + MUI
- 包管理器：pnpm
- 命令入口：`Taskfile.yml`（使用 go-task）
- 地图服务：高德 API（可选，未配置时有降级逻辑）

## 3. 目录结构与职责
- `cmd/server/main.go`：服务启动、路由注册、优雅停机
- `internal/graph`：图结构、JSONC 读取、邻接表构建
- `internal/navigation`：Dijkstra 最短路与室内外路径拼接
- `internal/amap`：高德接口封装与地点坐标存储
- `internal/handler`：HTTP Handler、参数校验、JSON 响应
- `config/b_graph.jsonc`：楼内节点/边权重定义
- `config/locations.json`：室外起点与出口坐标

## 4. 构建 / 运行 / 测试命令

完整命令见 `README.md` "快速开始" 和 "测试" 章节。常用命令：

```bash
task start        # 启动后端
task dev-all      # 同时启动前后端开发服务器
task build        # 构建后端二进制
task test         # 运行 Go 单元测试
task fmt          # 格式化
task --list-all   # 查看所有任务
```

单元测试详细命令：

```bash
# 单包
go test ./internal/graph -v
go test ./internal/navigation -v

# 单函数
go test ./internal/graph -run TestLoadGraph -v
go test ./internal/navigation -run TestFindBestRoute -v

# 正则多函数
go test ./internal/navigation -run "TestFindShortestPath|TestFindBestRoute" -v
```

## 5. 代码风格

### Go
- 导入顺序：标准库 -> 第三方 -> 本仓库内部包
- 导出标识符 PascalCase，非导出 camelCase
- API 返回使用稳定 struct，JSON 字段 snake_case（如 `error_message`、`total_weight`）
- 内部逻辑返回 error，不使用 panic
- HTTP 错误响应保持 `{ "success": false, "error_message": "..." }` 结构

### 前端
- 函数组件 + Hooks
- API 请求统一放在 `frontend/src/api`
- 组件名 PascalCase，变量/函数 camelCase
- 对加载态、错误态、成功态提供明确 UI 反馈

## 6. 图数据契约

`config/b_graph.jsonc` 核心约束：
- `edges[].w` 直接作为边权重
- 节点 ID 必须唯一
- 每条边两端都必须在 `nodes` 中存在

节点 ID 语义：
- `Bxxx`：房间/教室（如 `B301`）
- `S_ST{n}_F{m}`：楼梯（如 `S_ST2_F5`）
- `E{n}`：入口/出口（如 `E1`）

## 7. 开发节奏规范
- 全程中文沟通
- 新增/修改代码时，对非显然逻辑写中文注释，解释"为什么"
- 复杂任务先拆 TODO，小步推进
- 提交前检查变更范围与目标分支是否匹配

## 8. Git 分支与发布规范

长期分支：
- `main`：受保护的稳定分支，仅用于合并与打 release tag

常规分支前缀：`feature/*`、`fix/*`、`refactor/*`、`chore/*`、`docs/*`、`hotfix/*`

明确禁止：
- 直接在 `main` 上修改或提交
- 未创建分支就开始编码
- 未经授权的强制推送

## 9. AGENTS 强制重读与更新机制

### 重读触发器
- 会话开始时
- `git switch` / `git pull` / `git merge` / `git rebase` 后
- `commit` / `merge` / `push` 前
- 用户明确提出规范有更新时
- 长会话每 8-10 轮进行一次一致性重读

### 更新触发器
- 用户新增流程约束、命名规则、提交规范、发布规范
- 发现本文件与仓库实际命令/结构/契约不一致
- 新增 Cursor/Copilot 规则文件

触发后动作：
1. 先更新 `AGENTS.md`
2. 再在回复中声明：`已更新并重读 AGENTS.md，后续按新规则执行`

## 10. Agent 执行清单

改动前：
- 阅读受影响模块与现有实现模式
- 检查是否涉及 API/配置/数据契约变更
- 复杂任务先给出 TODO 拆解

改动后：
- 先跑针对性测试，再跑更大范围回归
- Go 改动后执行 `go fmt ./...`
- 汇报变更文件与验证命令

提交前：
- 重读 `AGENTS.md`
- 确认不在 `main` 上开发，分支类型符合规范
- 确认提交内容聚焦、无敏感信息

## 11. 一致性维护说明

- 当 README、`Taskfile.yml`、代码行为发生变化且影响开发流程时，需同步更新本文件
- 若本文件与实际不一致，以"先修正文档再执行"作为默认策略
