# B 楼导航系统

一个基于 Go 的室内导航系统，提供从宿舍到 B 楼教室的最短路径规划。

## 功能特点

- ️ **室外导航**：集成高德地图 API，计算从起点到 B 楼最近入口的路线
- 🏢 **室内导航**：基于图论的最短路径算法，提供详细的室内导航指引
- 📱 **Web 界面**：响应式设计，支持手机和桌面浏览器
- ⚡ **高性能**：使用 Go 语言开发，启动快速，响应及时

## 项目结构

```
xd-b-guide/
├── cmd/server/          # 主程序入口
│   ├── main.go
│   └── web/             # 前端静态文件
├── internal/
│   ├── graph/           # 图数据结构和加载
│   ├── navigation/      # 导航算法
│   ├── amap/            # 高德地图 API
│   └── handler/         # HTTP 处理器
├── web/                 # 前端文件 (开发用)
├── b_graph.jsonc        # B 楼室内图数据
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
| `GRAPH_PATH` | 图数据文件路径 | `b_graph.jsonc` |
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

如果你调整了 `full_name`（例如为了命中更精准地点），可以用刷新脚本批量/单点更新坐标：

```bash
# 预览刷新（不写文件）
just locations-refresh-dry

# 刷新全部并写回 config/locations.json
just locations-refresh

# 仅刷新单点（示例）
just locations-refresh-id DX12
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

### 3. 访问应用

```bash
# 开发模式
go run ./cmd/server

# 或者构建后运行
go build -o server ./cmd/server
./server
```

### 3. 访问应用

打开浏览器访问：http://localhost:8080

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

## 权重说明

室内导航的权重设置：
- 上下楼（楼梯）：20
- 教室 ↔ 教室（同层相邻）：30
- 楼梯口 ↔ 教室（同层相邻）：8
- 出口 ↔ 相邻节点：8

## 技术栈

- **后端**：Go 1.21+
- **前端**：HTML5, CSS3, JavaScript (原生)
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

编辑 `b_graph.jsonc` 文件，在 `nodes` 数组中添加新节点，在 `edges` 数组中添加连接关系。

### 修改权重

在 `b_graph.jsonc` 的 `assumptions.costs` 中修改各类边的权重。

## License

MIT
