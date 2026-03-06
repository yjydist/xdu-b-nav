# xdu-b-nav - Justfile

# 构建项目
build:
    @echo "构建项目..."
    go build -o server ./cmd/server
    @echo "✓ 构建完成：server"

# 运行服务器
run:
    @echo "启动服务器..."
    go run ./cmd/server

# 运行单元测试（Go）
test:
    @echo "运行 Go 单元测试..."
    go test ./... -v

# 检查代码格式
fmt:
    @echo "检查代码格式..."
    go fmt ./...

# 整理依赖（Go + 前端）
deps:
    @echo "整理 Go 依赖..."
    go mod tidy
    @echo "整理前端依赖..."
    cd frontend && bun install

# 清理构建产物（Go + 前端）
clean:
    @echo "清理 Go 构建产物..."
    rm -f server
    @echo "清理前端构建产物..."
    rm -rf frontend/dist
    @echo "✓ 清理完成"

# 停止服务器
stop:
    @echo "停止服务器..."
    -pkill -f "./server" 2>/dev/null || true
    @echo "✓ 服务器已停止"

# API 测试（需先构建：just build）
# 测试所有 API 接口 + 路由回归验证
api-test:
    @echo "启动服务..."
    @./server > /tmp/xd-api-test.log 2>&1 &
    @sleep 2
    @echo ""
    @echo "=== API 测试 ==="
    @echo ""
    @echo "1. 教室列表 /api/rooms:"
    @curl -s http://localhost:8080/api/rooms | python3 -c "import sys,json;d=json.load(sys.stdin);r=d.get('rooms',[]);print(f'  {len(r)} 个教室')"
    @echo ""
    @echo "2. 出口列表 /api/exits:"
    @curl -s http://localhost:8080/api/exits | python3 -c "import sys,json;d=json.load(sys.stdin);r=d.get('exits',[]);print(f'  {len(r)} 个出口')"
    @echo ""
    @echo "3. 起点列表 /api/starts:"
    @curl -s http://localhost:8080/api/starts | python3 -c "import sys,json;d=json.load(sys.stdin);r=d.get('starts',[]);print(f'  {len(r)} 个起点')"
    @echo ""
    @echo "4. 前端配置 /api/config:"
    @curl -s http://localhost:8080/api/config | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  js_api_key: {\"已配置\" if d.get(\"amap_js_api_key\") else \"未配置\"}')"
    @echo ""
    @echo "5. 坐标映射 /api/coordinates:"
    @curl -s http://localhost:8080/api/coordinates | python3 -c "import sys,json;d=json.load(sys.stdin);r=d.get('coordinates',[]);print(f'  {len(r)} 个坐标点')"
    @echo ""
    @echo "6. 导航测试 /api/route (丁香公寓 11 号楼 -> B301):"
    @curl -s -X POST http://localhost:8080/api/route -H "Content-Type: application/json" -d '{"start":"丁香公寓 11 号楼","destination":"B301"}' > /tmp/xd-route-regression.json
    @python3 -c "import json,sys; data=json.load(open('/tmp/xd-route-regression.json','r',encoding='utf-8')); out=data.get('outdoor',{}); dist=out.get('distance',0); dur=out.get('duration',0); path=data.get('path',[]); ok=data.get('success') and 50<=dist<=3000 and 60<=dur<=2400 and len(path)>=2; print(('✓ 回归通过: 距离 %s 米, 耗时 %s 秒, 节点数 %s' % (dist,dur,len(path))) if ok else ('✗ 回归失败: success=%s distance=%s duration=%s path_nodes=%s error=%s' % (data.get('success'),dist,dur,len(path),data.get('error_message')))); sys.exit(0 if ok else 1)"
    @pkill -f "./server" >/dev/null 2>&1 || true
    @echo "✓ API 测试完成"

# 开发模式（自动重新编译）
dev:
    @echo "开发模式..."
    @which air > /dev/null 2>&1 && air || (echo "未安装 air，使用 go run..." && go run ./cmd/server)
