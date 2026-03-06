# xdu-b-nav

西电 B 楼导航系统，基于 Go + React 的室内外导航应用。

## 功能特点

- ️ **室外导航**：集成高德地图 API，计算从起点到 B 楼最近入口的路线
- 🏢 **室内导航**：基于图论的最短路径算法，提供详细的室内导航指引
- 📱 **Web 界面**：响应式设计，支持手机和桌面浏览器
- ⚡ **高性能**：使用 Go 语言开发，启动快速，响应及时

## 项目结构

```
xdu-b-nav/
├── cmd/server/          # 主程序入口
│   └── main.go
├── internal/
│   ├── graph/           # 图数据结构和加载
│   ├── navigation/      # 导航算法
│   ├── amap/            # 高德地图 API
│   └── handler/         # HTTP 处理器
├── frontend/            # Vite + React 前端项目
│   ├── src/
│   └── package.json
├── config/              # 配置文件
│   ├── b_graph.jsonc    # 室内拓扑图数据
│   └── locations.json   # 地点坐标配置
├── justfile             # 命令工具配置
└── go.mod
```

## 快速开始

### 1. 配置环境变量 (可选)

```bash
cp .env.example .env
# 编辑 .env 文件
```

**环境变量说明：**

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务器端口 | `8080` |
| `GRAPH_PATH` | 图数据文件路径 | `config/b_graph.jsonc` |
| `AMAP_API_KEY` | 高德 Web 服务 API Key（后端路径规划） | 无（使用模拟数据） |
| `AMAP_JS_API_KEY` | 高德 Web 端 JS API Key（前端地图显示） | 无（仅文字显示） |
| `AMAP_SECURITY_CODE` | 高德 JS API 安全密钥 | 无 |

**获取高德 API Key：**

需要申请两种 Key：

1. **Web 服务 API Key**（后端使用）
   - 访问 [高德开放平台](https://lbs.amap.com/)
   - 进入 [控制台](https://console.amap.com/dev/key)
   - 创建应用并添加 Key
   - 服务平台选择 `Web 服务`

2. **Web 端 JS API Key**（前端使用）
   - 访问 [高德开放平台](https://lbs.amap.com/)
   - 进入 [控制台](https://console.amap.com/dev/key)
   - 创建应用并添加 Key
   - 服务平台选择 `Web 端 (JS API)`
   - 查看安全密钥（需要在控制台设置）

**配置说明：**
- 只配置 `AMAP_API_KEY`：后端使用真实数据，前端只显示文字路线
- 同时配置两种 Key：完整功能（地图显示 + 路线绘制）

**配置地点与坐标（推荐）**

项目改为“配置驱动坐标”模式：

- 运行时直接读取 `config/locations.json` 的经纬度进行室外路径规划
- 前端显示短名称（`display_name`），地理检索使用完整名称（`full_name`）
- 避免运行时名称歧义导致地点漂移

示例字段：

```json
{
  "id": "DX12",
  "type": "start",
  "display_name": "丁香公寓 12 号楼",
  "full_name": "西安电子科技大学南校区丁香公寓12号楼",
  "lat": 34.1614,
  "lng": 108.8488,
  "enabled": true
}
```

### 2. 运行服务器

**使用 just（推荐）:**
```bash
just run     # 开发模式运行
just build   # 构建项目
just test    # 运行测试
just --list  # 查看所有可用命令
```

**不使用 just:**
```bash
# 开发模式
go run ./cmd/server

# 或者构建后运行
go build -o server ./cmd/server
./server
```

### 3. 运行前端（可选）

前端使用 Bun + Vite 开发：

```bash
cd frontend
bun install      # 安装依赖
bun run dev     # 开发模式运行
bun run build   # 构建生产版本
```

前端默认在 http://localhost:5173，它会自动代理 API 请求到后端（8080 端口）。

### 4. 访问应用

打开浏览器访问：http://localhost:8080（后端）或 http://localhost:5173（前端开发服务器）

## API 接口

### POST /api/route

获取导航路径

**请求体：**
```json
{
  "start": "宿舍 A 楼",
  "destination": "B301"
}
```

**响应：**
```json
{
  "success": true,
  "outdoor": {
    "from": "宿舍 A 楼",
    "to": "B301",
    "nearest_exit": "E1",
    "distance": 500,
    "duration": 360
  },
  "indoor": [
    {
      "from": "E1",
      "to": "B101",
      "weight": 8,
      "action": "进入",
      "description": "从入口 E1 进入大楼"
    }
  ],
  "total_weight": 150,
  "path": ["E1", "B101", "S_ST1_F1", "S_ST1_F3", "B301"]
}
```

### GET /api/rooms

获取所有可用教室列表

### GET /api/exits

获取所有出口信息

## 图数据约定

`config/b_graph.jsonc` 只保留两类信息：
- `nodes`：节点定义
- `edges`：边定义（`w` 为边权重）

节点 ID 约定：
- `Bxxx`：教室/房间节点（例如 `B301`）
- `S_ST{n}_F{m}`：第 `n` 个楼梯在第 `m` 层的楼梯口（例如 `S_ST2_F5`）
- `E{n}`：建筑出口节点（例如 `E1`）

权重由 `edges` 中每条边的 `w` 直接定义，不再额外维护统一权重配置。

## 技术栈

- **后端**：Go 1.21+
- **前端**：Vite 5 + React 18 + MUI (Material UI)
- **包管理器**：Bun
- **地图服务**：高德地图 API (可选)
- **算法**：Dijkstra 最短路径算法
- **命令工具**：just

## 安装 just (可选)

just 是一个命令运行工具，可以简化常用命令的输入。

**macOS:**
```bash
brew install just
```

**Linux:**
```bash
sudo apt install just
# 或
cargo install just
```

**使用后:**
```bash
just run      # 运行服务器
just build    # 构建项目
just test     # 运行测试
just --list   # 查看所有命令
```

## 测试

运行所有测试：

```bash
go test ./... -v
```

导航回归（推荐每次改动后执行）：

```bash
just route-regression
```

该回归会自动校验：

- 室外距离是否落在校园内合理区间（防止回归到异常量级）
- 室外耗时是否落在可接受区间
- 室内路径节点链是否完整（避免“跳点”现象）

## 代码质量保证

- ✅ 输入验证（目的地格式、空值检查）
- ✅ 错误处理（文件读取、JSON 解析、网络请求）
- ✅ 边界条件处理（不存在节点、孤立节点）
- ✅ CORS 支持（跨域请求）
- ✅ 优雅关闭（信号处理）
- ✅ 日志记录（请求日志、错误日志）
- ✅ 单元测试（核心算法测试）

## 开发说明

### 添加新教室

编辑 `config/b_graph.jsonc` 文件，在 `nodes` 数组中添加新节点，在 `edges` 数组中添加连接关系。

### 修改权重

在 `config/b_graph.jsonc` 的 `edges` 数组中，直接修改对应边的 `w`。

## License

MIT
