# B 楼导航系统 - Justfile
# 使用：just <命令>
# 例如：just run, just build, just test

# 默认命令
default:
    @echo "B 楼导航系统"
    @echo ""
    @echo "可用命令:"
    @just --list

# 构建项目
build:
    @echo "构建项目..."
    go build -o server ./cmd/server
    @echo "✓ 构建完成：server"

# 运行服务器
run:
    @echo "启动服务器..."
    go run ./cmd/server

# 运行服务器（生产模式，使用已编译的二进制文件）
start:
    @./server

# 运行测试
test:
    @echo "运行单元测试..."
    go test ./... -v

# 运行测试（简略输出）
test-short:
    @go test ./...

# 检查代码格式
fmt:
    @echo "检查代码格式..."
    go fmt ./...

# 整理依赖
deps:
    @echo "整理依赖..."
    go mod tidy

# 清理构建产物
clean:
    @echo "清理..."
    rm -f server
    @echo "✓ 清理完成"

# 重启服务器（先停止再启动）
restart:
    @echo "停止服务器..."
    -pkill -f "./server" 2>/dev/null || true
    @sleep 1
    @echo "启动服务器..."
    ./server &
    @sleep 2
    @echo "✓ 服务器已重启"

# 停止服务器
stop:
    @echo "停止服务器..."
    -pkill -f "./server" 2>/dev/null || true
    @echo "✓ 服务器已停止"

# API 测试
api-test:
    @echo "=== API 测试 ==="
    @echo ""
    @echo "1. 教室列表:"
    @curl -s http://localhost:8080/api/rooms | python3 -c "import sys,json;d=json.load(sys.stdin);r=d.get('rooms',[]);print(f'  {len(r)} 个教室')"
    @echo ""
    @echo "2. 出口列表:"
    @curl -s http://localhost:8080/api/exits | python3 -c "import sys,json;d=json.load(sys.stdin);r=d.get('exits',[]);print(f'  {len(r)} 个出口')"
    @echo ""
    @echo "3. 导航测试 (宿舍 A 楼 -> B301):"
    @curl -s -X POST http://localhost:8080/api/route -H "Content-Type: application/json" -d '{"start":"宿舍 A 楼","destination":"B301"}' | python3 -c "import sys,json;d=json.load(sys.stdin);o=d.get('outdoor',{});print(f'  入口：{o.get(\"nearest_exit\")}, 距离：{o.get(\"distance\")}米')" 2>/dev/null || echo "  无法连接服务器"

# 完整测试
full-test: build test api-test

# 路由回归测试（重点验证室外时距与室内节点链）
route-regression:
    @echo "运行路由回归测试..."
    @./server > /tmp/xd-regression.log 2>&1 &
    @sleep 2
    @curl -s --noproxy localhost -X POST http://127.0.0.1:8080/api/route -H "Content-Type: application/json" -d '{"start":"丁香公寓 11 号楼","destination":"B301"}' > /tmp/xd-route-regression.json
    @python3 -c "import json,sys; data=json.load(open('/tmp/xd-route-regression.json','r',encoding='utf-8')); out=data.get('outdoor',{}); dist=out.get('distance',0); dur=out.get('duration',0); path=data.get('path',[]); ok=data.get('success') and 50<=dist<=3000 and 60<=dur<=2400 and len(path)>=2; print(('✓ 回归通过: 距离 %s 米, 耗时 %s 秒, 节点数 %s' % (dist,dur,len(path))) if ok else ('✗ 回归失败: success=%s distance=%s duration=%s path_nodes=%s error=%s' % (data.get('success'),dist,dur,len(path),data.get('error_message')))); sys.exit(0 if ok else 1)"
    @pkill -f "./server" >/dev/null 2>&1 || true
    @echo "✓ 路由回归测试完成"

# 刷新所有地点坐标（会写回 config/locations.json）
locations-refresh:
    @echo "刷新所有地点坐标..."
    go run ./cmd/tools/refresh-locations -all=true

# 预览刷新（不写入），用于人工核对 full_name 是否命中正确地点
locations-refresh-dry:
    @echo "预览刷新地点坐标（dry-run）..."
    go run ./cmd/tools/refresh-locations -all=true -dry-run=true

# 刷新单个地点（示例：just locations-refresh-id DX12）
locations-refresh-id id:
    @echo "刷新单个地点: {{id}}"
    go run ./cmd/tools/refresh-locations -id {{id}}

# 打开浏览器
open:
    @echo "打开浏览器..."
    open http://localhost:8080

# 开发模式（自动重新编译）
dev:
    @echo "开发模式..."
    @which air > /dev/null 2>&1 && air || (echo "未安装 air，使用 go run..." && go run ./cmd/server)

# 帮助
help:
    @just --list
