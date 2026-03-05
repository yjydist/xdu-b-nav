package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"xd-b-guide/internal/amap"
)

// toolConfig 是脚本参数集合。
// 之所以集中定义，而不是散落在 main 中，
// 是为了让后续扩展（例如 query-override、批量过滤）更容易维护。
type toolConfig struct {
	Path   string
	All    bool
	ID     string
	Type   string
	DryRun bool
	Strict bool
}

func main() {
	// 这里主动加载 .env，原因是该脚本通常由命令行直接触发，
	// 大多数场景不会先执行 `source .env`，导致 AMAP_API_KEY 读取失败。
	// 与服务端启动逻辑保持一致后，开发体验会更稳定，减少“命令本身可用但环境未导入”的误判。
	if err := godotenv.Load(); err != nil {
		fmt.Printf("[提示] 未读取到 .env（如果使用系统环境变量可忽略）: %v\n", err)
	}

	cfg := parseFlags()

	if os.Getenv("AMAP_API_KEY") == "" {
		fmt.Println("[错误] 未设置 AMAP_API_KEY，无法调用高德地理编码接口")
		os.Exit(1)
	}

	raw, err := os.ReadFile(cfg.Path)
	if err != nil {
		fmt.Printf("[错误] 读取配置文件失败: %v\n", err)
		os.Exit(1)
	}

	var locationCfg amap.LocationConfig
	if err := json.Unmarshal(raw, &locationCfg); err != nil {
		fmt.Printf("[错误] 解析配置文件失败: %v\n", err)
		os.Exit(1)
	}

	client := amap.NewAMapClient()

	updated := 0
	failed := 0

	for i := range locationCfg.Points {
		point := &locationCfg.Points[i]
		if !needRefresh(*point, cfg) {
			continue
		}

		if strings.TrimSpace(point.FullName) == "" {
			fmt.Printf("[跳过] %s(%s): full_name 为空\n", point.DisplayName, point.ID)
			failed++
			continue
		}

		loc, err := client.Geocode(point.FullName)
		if err != nil {
			fmt.Printf("[失败] %s(%s): %v\n", point.DisplayName, point.ID, err)
			failed++
			continue
		}

		fmt.Printf("[成功] %s(%s): %.6f,%.6f -> %.6f,%.6f\n",
			point.DisplayName,
			point.ID,
			point.Longitude,
			point.Latitude,
			loc.Longitude,
			loc.Latitude,
		)

		point.Longitude = loc.Longitude
		point.Latitude = loc.Latitude
		point.UpdatedAt = time.Now().Format(time.RFC3339)
		updated++
	}

	if updated == 0 {
		fmt.Println("[提示] 没有任何点位被刷新")
	}

	if cfg.DryRun {
		// dry-run 的目的：
		// 1) 先验证 full_name 是否能命中正确地理位置；
		// 2) 避免批量刷新时误写坐标，便于人工确认后再落盘。
		fmt.Printf("[完成] dry-run 模式，未写入文件（成功=%d，失败=%d）\n", updated, failed)
		if cfg.Strict && failed > 0 {
			os.Exit(1)
		}
		return
	}

	out, err := json.MarshalIndent(locationCfg, "", "  ")
	if err != nil {
		fmt.Printf("[错误] 序列化配置失败: %v\n", err)
		os.Exit(1)
	}

	if err := os.WriteFile(cfg.Path, out, 0o644); err != nil {
		fmt.Printf("[错误] 写回配置失败: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("[完成] 已写入 %s（成功=%d，失败=%d）\n", cfg.Path, updated, failed)
	if cfg.Strict && failed > 0 {
		os.Exit(1)
	}
}

func parseFlags() toolConfig {
	var cfg toolConfig
	flag.StringVar(&cfg.Path, "path", "config/locations.json", "地点配置文件路径")
	flag.BoolVar(&cfg.All, "all", true, "是否刷新所有启用点位")
	flag.StringVar(&cfg.ID, "id", "", "仅刷新指定 ID（如 DX12）")
	flag.StringVar(&cfg.Type, "type", "", "仅刷新指定类型（start/entrance/destination）")
	flag.BoolVar(&cfg.DryRun, "dry-run", false, "仅预览刷新结果，不写入文件")
	flag.BoolVar(&cfg.Strict, "strict", false, "有任何失败时返回非零退出码")
	flag.Parse()
	return cfg
}

func needRefresh(p amap.LocationPoint, cfg toolConfig) bool {
	if !p.Enabled {
		return false
	}
	if cfg.ID != "" {
		return p.ID == cfg.ID
	}
	if cfg.Type != "" {
		return p.Type == cfg.Type
	}
	if cfg.All {
		return true
	}
	return false
}
