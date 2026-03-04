package amap

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
)

// AMapClient 高德地图 API 客户端
type AMapClient struct {
	APIKey        string
	locationStore *LocationStore
}

// Location 地理位置
type Location struct {
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Address   string  `json:"address"`
}

// StartLocation 起点位置（带显示名称）
type StartLocation struct {
	Name     string `json:"name"`
	Region   string `json:"region"`
	FullName string `json:"full_name"`
}

// WalkingRoute 步行路线
type WalkingRoute struct {
	Origin      Location      `json:"origin"`
	Destination Location      `json:"destination"`
	Distance    int           `json:"distance"` // 米
	Duration    int           `json:"duration"` // 秒
	Polyline    string        `json:"polyline"`
	Steps       []WalkingStep `json:"steps"`
}

// WalkingStep 步行步骤
type WalkingStep struct {
	Instruction string      `json:"instruction"`
	Orientation string      `json:"orientation"`
	Road        interface{} `json:"road"` // 可能是字符串或数组
	Distance    int         `json:"distance"`
	Duration    int         `json:"duration"`
}

// WalkingRouteResponse 步行路线规划响应
type WalkingRouteResponse struct {
	Status   string `json:"status"`
	Info     string `json:"info"`
	Infocode string `json:"infocode"`
	Route    struct {
		Paths []struct {
			Distance string `json:"distance"`
			Duration string `json:"duration"`
			Steps    []struct {
				Instruction     string      `json:"instruction"`
				Orientation     string      `json:"orientation"`
				Road            interface{} `json:"road"` // 可能是字符串或数组
				Distance        string      `json:"distance"`
				Duration        string      `json:"duration"`
				Polyline        string      `json:"polyline"`
				Action          interface{} `json:"action"` // 可能是字符串或数组
				AssistantAction interface{} `json:"assistant_action"`
				WalkType        interface{} `json:"walk_type"`
			} `json:"steps"`
		} `json:"paths"`
	} `json:"route"`
}

// GeocodeResponse 地理编码响应
type GeocodeResponse struct {
	Status   string    `json:"status"`
	Info     string    `json:"info"`
	Geocodes []Geocode `json:"geocodes"`
}

// Geocode 地理编码结果
type Geocode struct {
	Location         string `json:"location"`
	FormattedAddress string `json:"formatted_address"`
}

// 西安电子科技大学宿舍楼配置
var startLocations = []StartLocation{
	// 丁香公寓 (11-15 号楼)
	{Name: "丁香公寓 11 号楼", Region: "丁香公寓", FullName: "西安电子科技大学丁香公寓 11 号楼"},
	{Name: "丁香公寓 12 号楼", Region: "丁香公寓", FullName: "西安电子科技大学丁香公寓 12 号楼"},
	{Name: "丁香公寓 13 号楼", Region: "丁香公寓", FullName: "西安电子科技大学丁香公寓 13 号楼"},
	{Name: "丁香公寓 14 号楼", Region: "丁香公寓", FullName: "西安电子科技大学丁香公寓 14 号楼"},
	{Name: "丁香公寓 15 号楼", Region: "丁香公寓", FullName: "西安电子科技大学丁香公寓 15 号楼"},
	// 海棠公寓 (5-10 号楼，18 号楼，20 号楼)
	{Name: "海棠公寓 5 号楼", Region: "海棠公寓", FullName: "西安电子科技大学海棠公寓 5 号楼"},
	{Name: "海棠公寓 6 号楼", Region: "海棠公寓", FullName: "西安电子科技大学海棠公寓 6 号楼"},
	{Name: "海棠公寓 7 号楼", Region: "海棠公寓", FullName: "西安电子科技大学海棠公寓 7 号楼"},
	{Name: "海棠公寓 8 号楼", Region: "海棠公寓", FullName: "西安电子科技大学海棠公寓 8 号楼"},
	{Name: "海棠公寓 9 号楼", Region: "海棠公寓", FullName: "西安电子科技大学海棠公寓 9 号楼"},
	{Name: "海棠公寓 10 号楼", Region: "海棠公寓", FullName: "西安电子科技大学海棠公寓 10 号楼"},
	{Name: "海棠公寓 18 号楼", Region: "海棠公寓", FullName: "西安电子科技大学海棠公寓 18 号楼"},
	{Name: "海棠公寓 20 号楼", Region: "海棠公寓", FullName: "西安电子科技大学海棠公寓 20 号楼"},
	// 竹园公寓 (1-4 号楼)
	{Name: "竹园公寓 1 号楼", Region: "竹园公寓", FullName: "西安电子科技大学竹园公寓 1 号楼"},
	{Name: "竹园公寓 2 号楼", Region: "竹园公寓", FullName: "西安电子科技大学竹园公寓 2 号楼"},
	{Name: "竹园公寓 3 号楼", Region: "竹园公寓", FullName: "西安电子科技大学竹园公寓 3 号楼"},
	{Name: "竹园公寓 4 号楼", Region: "竹园公寓", FullName: "西安电子科技大学竹园公寓 4 号楼"},
}

// 宿舍楼经纬度配置（西电南校区 - 修正后的坐标）
var dormCoordinates = map[string][2]float64{
	// 丁香公寓（北侧）
	"丁香公寓 11 号楼": {34.1612, 108.8485},
	"丁香公寓 12 号楼": {34.1614, 108.8488},
	"丁香公寓 13 号楼": {34.1616, 108.8491},
	"丁香公寓 14 号楼": {34.1618, 108.8494},
	"丁香公寓 15 号楼": {34.1620, 108.8497},
	// 海棠公寓（东侧）
	"海棠公寓 5 号楼":  {34.1595, 108.8520},
	"海棠公寓 6 号楼":  {34.1598, 108.8522},
	"海棠公寓 7 号楼":  {34.1601, 108.8524},
	"海棠公寓 8 号楼":  {34.1604, 108.8526},
	"海棠公寓 9 号楼":  {34.1607, 108.8528},
	"海棠公寓 10 号楼": {34.1610, 108.8530},
	"海棠公寓 18 号楼": {34.1625, 108.8535},
	"海棠公寓 20 号楼": {34.1628, 108.8538},
	// 竹园公寓（南侧）
	"竹园公寓 1 号楼": {34.1565, 108.8490},
	"竹园公寓 2 号楼": {34.1568, 108.8493},
	"竹园公寓 3 号楼": {34.1571, 108.8496},
	"竹园公寓 4 号楼": {34.1574, 108.8499},
}

// B 楼南楼出口位置（西电南校区 - 修正后的坐标）
var bBuildingExits = []Location{
	{Name: "E1", Latitude: 34.1580, Longitude: 108.8500, Address: "西安电子科技大学 B 楼南楼东端出口 (101/105 附近)"},
	{Name: "E2", Latitude: 34.1581, Longitude: 108.8503, Address: "西安电子科技大学 B 楼南楼 106 附近出口"},
	{Name: "E3", Latitude: 34.1582, Longitude: 108.8506, Address: "西安电子科技大学 B 楼南楼 107 附近出口"},
	{Name: "E4", Latitude: 34.1583, Longitude: 108.8512, Address: "西安电子科技大学 B 楼南楼 318/320 附近出口"},
	{Name: "E5", Latitude: 34.1584, Longitude: 108.8518, Address: "西安电子科技大学 B 楼南楼西端出口 (422 侧)"},
}

// B 楼中心位置
var bBuildingCenter = Location{
	Name:      "B 楼南楼",
	Latitude:  34.1582,
	Longitude: 108.8509,
	Address:   "西安电子科技大学 B 楼南楼",
}

// NewAMapClient 创建高德地图客户端
func NewAMapClient() *AMapClient {
	apiKey := os.Getenv("AMAP_API_KEY")

	// 地点配置文件路径支持环境变量覆盖，便于后续脚本/环境切换。
	// 默认放在 config/locations.json，保持“配置与代码分离”。
	locationPath := os.Getenv("LOCATION_CONFIG_PATH")
	if locationPath == "" {
		locationPath = "config/locations.json"
	}

	store, err := loadLocationStore(locationPath)
	if err != nil {
		// 配置不可用时回退到内置默认值，保证服务可启动。
		// 之所以不直接失败：避免线上因为单个配置文件问题导致整体不可用。
		log.Printf("[配置] 读取地点配置失败，使用内置默认值: %v", err)
		store = buildDefaultLocationStore()
	} else {
		log.Printf("[配置] 已加载地点配置: %s (points=%d)", locationPath, len(store.Config.Points))
	}

	return &AMapClient{
		APIKey:        apiKey,
		locationStore: store,
	}
}

// GetStartLocations 获取所有起点列表
func (c *AMapClient) GetStartLocations() []StartLocation {
	starts := make([]StartLocation, 0)
	if c.locationStore == nil {
		return startLocations
	}

	for _, p := range c.locationStore.Config.Points {
		if !p.Enabled || p.Type != "start" {
			continue
		}
		starts = append(starts, StartLocation{
			Name:     p.DisplayName,
			Region:   p.Region,
			FullName: p.FullName,
		})
	}

	return starts
}

// FindStartLocation 查找起点位置
func (c *AMapClient) FindStartLocation(name string) (*Location, error) {
	// 运行时只允许“配置驱动坐标”，不再做地理编码兜底。
	// 为什么这样设计：
	// 1) 校园内导航点位固定，名称检索会受到同名地点/搜索策略影响而漂移；
	// 2) 路径稳定性优先，必须保证同一输入得到可复现的坐标与路线；
	// 3) 名称变更应通过 refresh-locations 脚本更新配置，而不是运行时临时检索。
	if c.locationStore != nil {
		if point, ok := c.locationStore.StartByDisplay[name]; ok {
			return &Location{
				Name:      point.DisplayName,
				Latitude:  point.Latitude,
				Longitude: point.Longitude,
				Address:   point.FullName,
			}, nil
		}
	}

	return nil, fmt.Errorf("未在地点配置中找到起点: %s，请先在 config/locations.json 配置或通过刷新脚本更新", name)
}

// Geocode 地理编码
func (c *AMapClient) Geocode(address string) (*Location, error) {
	if c.APIKey == "" {
		return nil, fmt.Errorf("未配置 API Key")
	}

	baseURL := "https://restapi.amap.com/v3/geocode/geo"
	params := url.Values{}
	params.Set("address", address)
	params.Set("key", c.APIKey)
	params.Set("output", "json")

	resp, err := http.Get(baseURL + "?" + params.Encode())
	if err != nil {
		return nil, fmt.Errorf("地理编码请求失败：%w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败：%w", err)
	}

	var geocodeResp GeocodeResponse
	if err := json.Unmarshal(body, &geocodeResp); err != nil {
		return nil, fmt.Errorf("解析响应失败：%w", err)
	}

	if geocodeResp.Status != "1" || len(geocodeResp.Geocodes) == 0 {
		return nil, fmt.Errorf("地理编码失败：%s", geocodeResp.Info)
	}

	loc := geocodeResp.Geocodes[0]
	coords := strings.Split(loc.Location, ",")
	if len(coords) != 2 {
		return nil, fmt.Errorf("无效坐标格式：%s", loc.Location)
	}

	var lat, lng float64
	fmt.Sscanf(coords[1], "%f", &lat)
	fmt.Sscanf(coords[0], "%f", &lng)

	return &Location{
		Latitude:  lat,
		Longitude: lng,
		Address:   loc.FormattedAddress,
	}, nil
}

// WalkingRoute 步行路径规划（调用高德 API）
func (c *AMapClient) WalkingRoute(origin, destination *Location) (*WalkingRoute, error) {
	// 没有 API Key 时使用模拟数据
	if c.APIKey == "" {
		distance := int(haversine(origin.Latitude, origin.Longitude, destination.Latitude, destination.Longitude))
		if distance < 50 {
			distance = 50
		}
		return &WalkingRoute{
			Origin:      *origin,
			Destination: *destination,
			Distance:    distance,
			Duration:    distance * 4 / 3,
			Polyline:    "",
			Steps: []WalkingStep{
				{
					Instruction: fmt.Sprintf("从 %s 步行前往 %s", origin.Address, destination.Address),
					Distance:    distance,
					Duration:    distance * 4 / 3,
				},
			},
		}, nil
	}

	// 调用高德步行路径规划 API
	baseURL := "https://restapi.amap.com/v3/direction/walking"
	params := url.Values{}
	params.Set("origin", fmt.Sprintf("%.6f,%.6f", origin.Longitude, origin.Latitude))
	params.Set("destination", fmt.Sprintf("%.6f,%.6f", destination.Longitude, destination.Latitude))
	params.Set("key", c.APIKey)
	params.Set("output", "json")

	log.Printf("[高德 API] 请求步行路径：%s -> %s", origin.Address, destination.Address)

	resp, err := http.Get(baseURL + "?" + params.Encode())
	if err != nil {
		return nil, fmt.Errorf("路径规划请求失败：%w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败：%w", err)
	}

	var amapResp WalkingRouteResponse
	if err := json.Unmarshal(body, &amapResp); err != nil {
		return nil, fmt.Errorf("解析响应失败：%w", err)
	}

	log.Printf("[高德 API] 响应状态：%s, Info: %s", amapResp.Status, amapResp.Info)

	if amapResp.Status != "1" || len(amapResp.Route.Paths) == 0 {
		return nil, fmt.Errorf("路径规划失败：%s (infocode: %s)", amapResp.Info, amapResp.Infocode)
	}

	path := amapResp.Route.Paths[0]
	distance, _ := strconv.Atoi(path.Distance)
	duration, _ := strconv.Atoi(path.Duration)

	steps := make([]WalkingStep, len(path.Steps))
	for i, step := range path.Steps {
		dist, _ := strconv.Atoi(step.Distance)
		dur, _ := strconv.Atoi(step.Duration)
		steps[i] = WalkingStep{
			Instruction: step.Instruction,
			Orientation: step.Orientation,
			Road:        step.Road,
			Distance:    dist,
			Duration:    dur,
		}
	}

	return &WalkingRoute{
		Origin:      *origin,
		Destination: *destination,
		Distance:    distance,
		Duration:    duration,
		Steps:       steps,
	}, nil
}

// FindRouteToBuilding 计算从起点到 B 楼的路线（固定终点为 B 楼）
func (c *AMapClient) FindRouteToBuilding(startName string) (*Location, *WalkingRoute, error) {
	// 获取起点位置
	startLoc, err := c.FindStartLocation(startName)
	if err != nil {
		return nil, nil, fmt.Errorf("查找起点失败：%w", err)
	}

	// 规划到 B 楼中心的路线（目标点优先走地点配置）
	route, err := c.WalkingRoute(startLoc, c.GetBBuildingLocation())
	if err != nil {
		return nil, nil, fmt.Errorf("路径规划失败：%w", err)
	}

	return startLoc, route, nil
}

// GetExitLocations 获取 B 楼所有出口位置
func (c *AMapClient) GetExitLocations() []Location {
	if c.locationStore == nil || len(c.locationStore.ExitPoints) == 0 {
		return bBuildingExits
	}

	result := make([]Location, 0, len(c.locationStore.ExitPoints))
	for _, p := range c.locationStore.ExitPoints {
		result = append(result, Location{
			Name:      p.ID,
			Latitude:  p.Latitude,
			Longitude: p.Longitude,
			Address:   p.FullName,
		})
	}
	return result
}

// GetBBuildingLocation 获取 B 楼中心位置
func (c *AMapClient) GetBBuildingLocation() *Location {
	if c.locationStore != nil && c.locationStore.Destination != nil {
		d := c.locationStore.Destination
		return &Location{
			Name:      d.DisplayName,
			Latitude:  d.Latitude,
			Longitude: d.Longitude,
			Address:   d.FullName,
		}
	}
	return &bBuildingCenter
}

// haversine 计算两点之间的球面距离（米）
func haversine(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371000
	dLat := (lat2 - lat1) * 0.017453292519943295
	dLon := (lon2 - lon1) * 0.017453292519943295
	a := (1-mathCos(dLat))/2 + mathCos(lat1*0.017453292519943295)*mathCos(lat2*0.017453292519943295)*(1-mathCos(dLon))/2
	c := 2 * mathAtan2(mathSqrt(a), mathSqrt(1-a))
	return R * c
}

func mathCos(x float64) float64 {
	for x < -3.141592653589793 {
		x += 2 * 3.141592653589793
	}
	for x > 3.141592653589793 {
		x -= 2 * 3.141592653589793
	}
	x2 := x * x
	return 1 - x2/2 + x2*x2/24 - x2*x2*x2/720
}

func mathSqrt(x float64) float64 {
	if x <= 0 {
		return 0
	}
	z := x
	for i := 0; i < 10; i++ {
		z = (z + x/z) / 2
	}
	return z
}

func mathAtan2(y, x float64) float64 {
	if x > 0 {
		return mathAtan(y / x)
	}
	if x < 0 && y >= 0 {
		return mathAtan(y/x) + 3.141592653589793
	}
	if x < 0 && y < 0 {
		return mathAtan(y/x) - 3.141592653589793
	}
	if x == 0 && y > 0 {
		return 3.141592653589793 / 2
	}
	if x == 0 && y < 0 {
		return -3.141592653589793 / 2
	}
	return 0
}

func mathAtan(x float64) float64 {
	if x > 1 {
		return 3.141592653589793/2 - mathAtan(1/x)
	}
	if x < -1 {
		return -3.141592653589793/2 - mathAtan(1/x)
	}
	x2 := x * x
	return x - x*x2/3 + x*x2*x2/5 - x*x2*x2*x2/7
}
