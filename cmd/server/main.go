package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"xdu-b-nav/internal/amap"
	"xdu-b-nav/internal/graph"
	"xdu-b-nav/internal/handler"
	"xdu-b-nav/internal/navigation"
)

func main() {
	// 这里显式加载 .env 的原因：
	// 1) 团队成员通常通过 `just run` 或 `go run` 直接启动，不会手动 `source .env`
	// 2) 如果不自动加载，AMAP_API_KEY / AMAP_JS_API_KEY 会为空，导致室外路线退化和地图不显示
	// 3) godotenv.Load 不会覆盖已存在的系统环境变量，便于线上/CI 用真实环境变量覆盖本地配置
	if err := godotenv.Load(); err != nil {
		log.Printf("[配置] 未读取到 .env（如果使用系统环境变量可忽略）：%v", err)
	} else {
		log.Printf("[配置] 已加载 .env")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	graphPath := os.Getenv("GRAPH_PATH")
	if graphPath == "" {
		// 默认优先使用根目录 graph.json（更简洁），
		// 为了兼容当前仓库结构，若不存在则回退到 config/b_graph.jsonc。
		graphPath = "graph.json"
		if _, err := os.Stat(graphPath); err != nil {
			legacyPath := "config/b_graph.jsonc"
			if _, legacyErr := os.Stat(legacyPath); legacyErr == nil {
				log.Printf("[配置] 未找到默认图文件 %s，回退到 %s", graphPath, legacyPath)
				graphPath = legacyPath
			}
		}
	}

	g, err := graph.LoadGraph(graphPath)
	if err != nil {
		log.Fatalf("加载图数据失败：%v", err)
	}
	fmt.Printf("成功加载图数据：%d 个节点，%d 条边\n", len(g.Data.Nodes), len(g.Data.Edges))

	navigator := navigation.NewNavigator(g)
	amapClient := amap.NewAMapClient()

	// 将高德客户端传递给导航器（用于室外导航）
	navigator.SetAMapClient(amapClient)

	h := handler.NewHandler(navigator, amapClient)

	mux := http.NewServeMux()

	// API 路由（带 CORS 支持）
	mux.HandleFunc("/api/route", handler.CORS(h.RouteHandler))
	mux.HandleFunc("/api/rooms", handler.CORS(h.RoomsHandler))
	mux.HandleFunc("/api/exits", handler.CORS(h.ExitsHandler))
	mux.HandleFunc("/api/starts", handler.CORS(h.StartsHandler))
	mux.HandleFunc("/api/config", handler.CORS(h.ConfigHandler))
	mux.HandleFunc("/api/coordinates", handler.CORS(h.CoordinatesHandler))

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// 优雅关闭
	go func() {
		fmt.Printf("服务器启动在 http://localhost:%s\n", port)
		fmt.Println("API 端点:")
		fmt.Println("  POST /api/route - 获取导航路径")
		fmt.Println("  GET  /api/rooms - 获取所有教室列表")
		fmt.Println("  GET  /api/exits - 获取所有出口信息")
		fmt.Println("  GET  /api/starts - 获取所有起点列表")
		fmt.Println("  GET  /api/config - 获取前端配置（高德 JS API Key）")
		fmt.Println("  GET  /api/coordinates - 获取坐标映射（前端地图用）")

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("服务器启动失败：%v", err)
		}
	}()

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("正在关闭服务器...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("服务器关闭失败：%v", err)
	}

	log.Println("服务器已关闭")
}
