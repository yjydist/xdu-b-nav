# xdu-b-nav

西电 B 楼导航系统，基于 Go + React 的室内外分段导航应用。后端负责加载楼内拓扑图、计算室内最短路径并组合室外步行路线；前端提供起点与教室选择、路线展示和高德地图渲染能力。

## 功能特点

- **室外导航**：可接入高德 Web 服务 API，从宿舍起点规划到 B 楼目标点的步行路线；未配置 Key 时降级为距离估算。
- **室内导航**：基于 `config/b_graph.jsonc` 中的节点和边权重，使用 Dijkstra 算法计算入口到教室的最短路径。
- **入口择优**：遍历 B 楼入口，自动选择到目标教室室内成本最低的入口。
- **配置驱动坐标**：运行时读取 `config/locations.json`，避免依赖实时地理检索导致点位漂移。
- **Web 界面**：Vite + React + MUI 前端，支持起点/教室选择、路线步骤、加载态和错误态展示。

## 项目结构

```text
xdu-b-nav/
├── AGENTS.md              # 仓库智能体执行规范
├── PROJECT_GUIDE.md       # 项目学习与架构导读
├── README.md              # 项目说明与运行文档
├── Taskfile.yml           # task 命令入口
├── cmd/server/            # Go 服务入口
│   └── main.go
├── config/                # 运行配置数据
│   ├── b_graph.jsonc      # B 楼室内拓扑图数据
│   └── locations.json     # 宿舍起点与 B 楼目标点坐标
├── frontend/              # Vite + React 前端项目
│   ├── package.json
│   ├── vite.config.js
│   └── src/
├── internal/
│   ├── amap/              # 高德 API、地点坐标与降级路线
│   ├── graph/             # 图数据结构、JSONC 加载与邻接表构建
│   ├── handler/           # HTTP API、参数校验与 JSON 响应
│   └── navigation/        # Dijkstra 与室内外路线组合
├── go.mod
└── go.sum
```

## 环境要求

- Go 1.21+
- Node.js（用于运行前端）
- pnpm（前端包管理器，当前 `frontend/package.json` 声明 `pnpm@10.32.1`）
- go-task（推荐，用于执行 `Taskfile.yml` 中的统一命令）

安装 go-task 可参考官方文档：<https://taskfile.dev/installation/>。

## 快速开始

### 1. 安装依赖

后端依赖由 Go modules 管理：

```bash
go mod tidy
```

前端依赖：

```bash
cd frontend
pnpm install
```

### 2. 配置环境变量（可选）

```bash
cp .env.example .env
```

环境变量说明：

| 变量名 | 说明 | 默认值 |
| --- | --- | --- |
| `PORT` | 后端 HTTP 服务端口 | `8080` |
| `GRAPH_PATH` | 室内图数据文件路径 | 未设置时先尝试 `graph.json`，不存在则回退到 `config/b_graph.jsonc` |
| `LOCATION_CONFIG_PATH` | 宿舍起点与 B 楼目标点坐标配置路径 | `config/locations.json` |
| `AMAP_API_KEY` | 高德 Web 服务 API Key，供后端步行路径规划使用 | 空；为空时使用距离估算降级逻辑 |
| `AMAP_JS_API_KEY` | 高德 Web 端 JS API Key，供前端地图展示使用 | 空；为空时地图能力不可用或退化 |
| `AMAP_SECURITY_CODE` | 高德 JS API 安全密钥 | 空 |

高德 API Key 获取入口：

- 高德开放平台：<https://lbs.amap.com/>
- 控制台 Key 管理：<https://console.amap.com/dev/key>
- Web 服务路径规划文档：<https://lbs.amap.com/api/webservice/guide/api/direction>
- JS API 注册说明：<https://lbs.amap.com/api/javascript-api/guide/abc/prepare>

通常需要两类 Key：

1. **Web 服务 Key**：后端调用高德步行路线规划接口。
2. **Web 端 JS API Key + 安全密钥**：前端加载地图并绘制路线。

### 3. 启动服务

推荐使用 `task`：

```bash
task start        # 运行 Go 后端服务
task dev-all      # 同时启动后端与前端开发服务器
task build        # 构建后端二进制
task test         # 运行 Go 单元测试
task fmt          # 执行 Go 格式化
task --list-all   # 查看所有可用任务
```

也可以直接运行后端：

```bash
go run ./cmd/server
```

构建后运行：

```bash
go build -o server ./cmd/server
./server
```

### 4. 启动前端

```bash
cd frontend
pnpm dev
```

前端开发服务器默认监听 `http://localhost:5173`，并通过 Vite 代理把 `/api` 请求转发到 `http://localhost:8080`。

前端构建与预览：

```bash
cd frontend
pnpm build
pnpm preview
```

### 5. 访问应用

- 前端开发地址：<http://localhost:5173>
- 后端 API 地址：<http://localhost:8080>

当前 Go 后端只提供 API，不托管前端静态资源。生产部署时建议将前端构建产物交由静态站点或反向代理托管，并把 `/api` 转发到 Go 服务。

## API 接口

所有接口均返回 JSON。后端已对 API 路由开启 CORS，允许 `GET`、`POST` 和 `OPTIONS`。

### POST `/api/route`

获取从宿舍起点到 B 楼教室的组合导航路线。

请求体：

```json
{
  "start": "丁香公寓 12 号楼",
  "destination": "B301"
}
```

参数说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `start` | string | 起点显示名称，需匹配 `config/locations.json` 中启用的 `type=start` 点位 |
| `destination` | string | 目标教室，格式为 `B` + 3 位数字，例如 `B301` |

成功响应示例：

```json
{
  "success": true,
  "outdoor": {
    "from": "丁香公寓 12 号楼",
    "to": "B301",
    "nearest_exit": "E1",
    "distance": 500,
    "duration": 360,
    "instructions": ["沿道路步行到达 B 楼南楼"]
  },
  "indoor": [
    {
      "from": "E1",
      "to": "B101",
      "weight": 8,
      "description": "从B101附近的出入口进入大楼",
      "action": "进入"
    }
  ],
  "total_weight": 150,
  "path": ["E1", "B101", "S_ST1_F1", "S_ST1_F3", "B301"]
}
```

错误响应示例：

```json
{
  "success": false,
  "error_message": "目的地格式错误，应该是教室号（如 B301）"
}
```

### GET `/api/rooms`

获取所有可用教室列表。

响应示例：

```json
{
  "rooms": ["B101", "B102", "B301"]
}
```

### GET `/api/exits`

获取 B 楼入口列表。若 `config/locations.json` 未配置 `type=entrance` 点位，入口坐标可能为 `0`。

响应示例：

```json
{
  "exits": [
    {
      "id": "E1",
      "name": "E1",
      "latitude": 0,
      "longitude": 0
    }
  ]
}
```

### GET `/api/starts`

获取可选宿舍起点列表。

响应示例：

```json
{
  "starts": [
    {
      "name": "丁香公寓 12 号楼",
      "region": "丁香公寓",
      "full_name": "西安电子科技大学长安校区丁香公寓12号楼"
    }
  ]
}
```

### GET `/api/config`

获取前端地图所需配置。

响应示例：

```json
{
  "amap_js_api_key": "your_amap_js_api_key_here",
  "amap_security_code": "your_amap_security_code_here"
}
```

### GET `/api/coordinates`

获取前端地图使用的坐标映射，坐标顺序为 `[lng, lat]`。

响应示例：

```json
{
  "coordinates": {
    "丁香公寓 12 号楼": [108.82826, 34.123248],
    "B 楼南楼": [108.831946, 34.126019]
  }
}
```

## 配置数据约定

### 室内图数据：`config/b_graph.jsonc`

核心字段：

- `nodes`：节点定义。
- `edges`：边定义，`w` 直接作为边权重。

节点 ID 约定：

- `Bxxx`：教室/房间节点，例如 `B301`。
- `S_ST{n}_F{m}`：第 `n` 个楼梯在第 `m` 层的楼梯口，例如 `S_ST2_F5`。
- `E{n}`：入口/出口节点，例如 `E1`。

约束：

- 节点 ID 必须唯一。
- 每条边的两端都必须存在于 `nodes`。
- 路径关键节点应保持连通，否则会导致导航失败。
- 修改边权时直接调整对应 `edges[].w`。

### 坐标数据：`config/locations.json`

核心字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 点位唯一标识 |
| `type` | 点位类型，当前主要使用 `start` 与 `destination`，入口坐标可使用 `entrance` 扩展 |
| `region` | 所属区域，用于前端分组或展示 |
| `display_name` | 前端展示和 API 入参使用的短名称 |
| `full_name` | 完整地理名称 |
| `lat` / `lng` | 纬度 / 经度 |
| `enabled` | 是否启用 |

## 技术栈

- 后端：Go 1.21+
- 前端：Vite 5 + React 18 + MUI 5
- 包管理器：pnpm
- 命令入口：Taskfile.yml / go-task
- 地图服务：高德地图 API（可选）
- 算法：Dijkstra 最短路径算法

## 测试与验证

运行 Go 测试：

```bash
task test
```

或直接运行：

```bash
go test ./... -v
```

运行前端构建验证：

```bash
cd frontend
pnpm build
```

基础接口验证需要先启动后端：

```bash
task start
curl http://localhost:8080/api/rooms
curl http://localhost:8080/api/starts
```

## 常见开发任务

### 添加新教室

1. 在 `config/b_graph.jsonc` 的 `nodes` 数组中添加教室节点。
2. 在 `edges` 数组中添加与走廊、楼梯或入口相连的边。
3. 运行 `go test ./... -v` 验证图加载与导航逻辑。

### 修改室内路径成本

直接修改 `config/b_graph.jsonc` 中对应边的 `w`。运行时不会从 `assumptions.costs` 自动推导边权。

### 添加或调整宿舍起点

1. 在 `config/locations.json` 中添加或修改 `type=start` 点位。
2. 确保 `display_name` 是前端展示名称，也是 `/api/route` 的 `start` 入参。
3. 若新增区域不属于丁香、海棠或竹园，需同步调整前端起点分组逻辑。

## License

MIT
