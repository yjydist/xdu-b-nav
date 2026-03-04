package main

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
	"xd-b-guide/internal/amap"
	"xd-b-guide/internal/graph"
	"xd-b-guide/internal/handler"
	"xd-b-guide/internal/navigation"
)

//go:embed web
var webFiles embed.FS

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	graphPath := os.Getenv("GRAPH_PATH")
	if graphPath == "" {
		graphPath = "b_graph.jsonc"
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

	// 静态文件
	webFS, err := fs.Sub(webFiles, "web")
	if err != nil {
		log.Fatalf("加载 web 文件失败：%v", err)
	}
	mux.Handle("/", http.FileServer(http.FS(webFS)))

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
