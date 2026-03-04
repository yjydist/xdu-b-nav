package amap

import (
	"encoding/json"
	"fmt"
	"os"
)

// LocationPoint 是地点配置文件中的单个点位定义。
// 之所以把前端展示名(display_name)与查询全称(full_name)分开，
// 是因为用户界面更适合短名称，而地理检索必须使用严格全称避免歧义。
type LocationPoint struct {
	ID          string  `json:"id"`
	Type        string  `json:"type"`
	Region      string  `json:"region"`
	DisplayName string  `json:"display_name"`
	FullName    string  `json:"full_name"`
	Latitude    float64 `json:"lat"`
	Longitude   float64 `json:"lng"`
	Enabled     bool    `json:"enabled"`
	// UpdatedAt 记录最近一次通过刷新脚本校准坐标的时间。
	// 使用字符串（RFC3339）而非 time.Time，目的是保持 JSON 可读性和跨语言兼容性。
	UpdatedAt string `json:"updated_at,omitempty"`
}

// LocationConfig 对应 config/locations.json 的根结构。
type LocationConfig struct {
	Version string          `json:"version"`
	Campus  string          `json:"campus"`
	Points  []LocationPoint `json:"points"`
}

// LocationStore 是运行期索引结构。
// 为什么要做索引：
// 1) 导航是高频读操作，线性扫描 points 会让逻辑分散且重复；
// 2) 统一索引后，前后端都能用同一份配置源，避免多处硬编码不一致。
type LocationStore struct {
	Config         LocationConfig
	ByID           map[string]LocationPoint
	StartByDisplay map[string]LocationPoint
	ExitPoints     []LocationPoint
	Destination    *LocationPoint
}

// loadLocationStore 读取并构建地点索引。
// 读取失败时返回错误，由上层决定是否回退到内置默认值。
func loadLocationStore(path string) (*LocationStore, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("读取地点配置失败: %w", err)
	}

	var cfg LocationConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return nil, fmt.Errorf("解析地点配置失败: %w", err)
	}

	store := &LocationStore{
		Config:         cfg,
		ByID:           make(map[string]LocationPoint),
		StartByDisplay: make(map[string]LocationPoint),
		ExitPoints:     make([]LocationPoint, 0),
	}

	for _, p := range cfg.Points {
		if !p.Enabled {
			continue
		}
		store.ByID[p.ID] = p

		switch p.Type {
		case "start":
			store.StartByDisplay[p.DisplayName] = p
		case "entrance":
			store.ExitPoints = append(store.ExitPoints, p)
		case "destination":
			// 目的地只有一个固定点（B 楼），按最后一个启用项覆盖即可。
			cp := p
			store.Destination = &cp
		}
	}

	if len(store.StartByDisplay) == 0 {
		return nil, fmt.Errorf("地点配置无可用起点")
	}
	if store.Destination == nil {
		return nil, fmt.Errorf("地点配置缺少 destination 点位")
	}

	return store, nil
}

// buildDefaultLocationStore 构建兼容旧逻辑的默认配置。
// 该回退仅用于“配置文件缺失/损坏”场景，保证服务仍可启动。
func buildDefaultLocationStore() *LocationStore {
	store := &LocationStore{
		ByID:           make(map[string]LocationPoint),
		StartByDisplay: make(map[string]LocationPoint),
		ExitPoints:     make([]LocationPoint, 0),
	}

	for _, s := range startLocations {
		coord, ok := dormCoordinates[s.Name]
		if !ok {
			continue
		}
		p := LocationPoint{
			ID:          s.Name,
			Type:        "start",
			Region:      s.Region,
			DisplayName: s.Name,
			FullName:    s.FullName,
			Latitude:    coord[0],
			Longitude:   coord[1],
			Enabled:     true,
		}
		store.ByID[p.ID] = p
		store.StartByDisplay[p.DisplayName] = p
	}

	for _, e := range bBuildingExits {
		p := LocationPoint{
			ID:          e.Name,
			Type:        "entrance",
			Region:      "B楼",
			DisplayName: e.Name,
			FullName:    e.Address,
			Latitude:    e.Latitude,
			Longitude:   e.Longitude,
			Enabled:     true,
		}
		store.ByID[p.ID] = p
		store.ExitPoints = append(store.ExitPoints, p)
	}

	d := LocationPoint{
		ID:          "B_BUILDING",
		Type:        "destination",
		Region:      "B楼",
		DisplayName: bBuildingCenter.Name,
		FullName:    bBuildingCenter.Address,
		Latitude:    bBuildingCenter.Latitude,
		Longitude:   bBuildingCenter.Longitude,
		Enabled:     true,
	}
	store.ByID[d.ID] = d
	store.Destination = &d

	return store
}
