package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"xdu-b-nav/internal/amap"
	"xdu-b-nav/internal/navigation"
)

var destinationPattern = regexp.MustCompile(`^B\d{3}$`)

type Handler struct {
	navigator  *navigation.Navigator
	amapClient *amap.AMapClient
}

type RouteRequest struct {
	Start       string `json:"start"`
	Destination string `json:"destination"`
}

type RouteResponse struct {
	Success      bool              `json:"success"`
	ErrorMessage string            `json:"error_message,omitempty"`
	Outdoor      *OutdoorRouteInfo `json:"outdoor,omitempty"`
	Indoor       []IndoorStepInfo  `json:"indoor,omitempty"`
	TotalWeight  int               `json:"total_weight"`
	Path         []string          `json:"path"`
}

type OutdoorRouteInfo struct {
	From         string   `json:"from"`
	To           string   `json:"to"`
	NearestExit  string   `json:"nearest_exit"`
	Distance     int      `json:"distance"`
	Duration     int      `json:"duration"`
	Instructions []string `json:"instructions,omitempty"`
}

type IndoorStepInfo struct {
	From        string `json:"from"`
	To          string `json:"to"`
	Weight      int    `json:"weight"`
	Description string `json:"description"`
	Action      string `json:"action"`
}

func NewHandler(nav *navigation.Navigator, amap *amap.AMapClient) *Handler {
	return &Handler{
		navigator:  nav,
		amapClient: amap,
	}
}

// CORS 中间件
func CORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next(w, r)
	}
}

func (h *Handler) RouteHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.sendError(w, "不支持的请求方法", http.StatusMethodNotAllowed)
		return
	}

	var req RouteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendError(w, "无效的请求格式", http.StatusBadRequest)
		return
	}

	// 验证目的地
	req.Destination = strings.TrimSpace(req.Destination)
	if req.Destination == "" {
		h.sendError(w, "目的地不能为空", http.StatusBadRequest)
		return
	}

	// 验证目的地格式（B + 3 位数字，如 B301）
	if !destinationPattern.MatchString(req.Destination) {
		h.sendError(w, "目的地格式错误，应该是教室号（如 B301）", http.StatusBadRequest)
		return
	}

	log.Printf("[导航请求] 起点：%s, 目的地：%s", req.Start, req.Destination)

	result, err := h.navigator.FindBestRoute(req.Start, req.Destination)
	if err != nil {
		log.Printf("[导航错误] %v", err)
		h.sendError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	resp := RouteResponse{
		Success:      result.Success,
		ErrorMessage: result.ErrorMessage,
		TotalWeight:  result.TotalWeight,
		Path:         result.Path,
	}

	if result.Outdoor != nil {
		resp.Outdoor = &OutdoorRouteInfo{
			From:         result.Outdoor.From,
			To:           result.Outdoor.To,
			NearestExit:  result.Outdoor.NearestExit,
			Distance:     result.Outdoor.Distance,
			Duration:     result.Outdoor.Duration,
			Instructions: result.Outdoor.Instructions,
		}
	}

	for _, step := range result.Indoor {
		resp.Indoor = append(resp.Indoor, IndoorStepInfo{
			From:        step.From,
			To:          step.To,
			Weight:      step.Weight,
			Description: step.Description,
			Action:      step.Action,
		})
	}

	if result.Success {
		log.Printf("[导航成功] 路径权重：%d, 入口：%s", result.TotalWeight, result.Outdoor.NearestExit)
	}

	h.sendJSON(w, resp)
}

func (h *Handler) RoomsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.sendError(w, "不支持的请求方法", http.StatusMethodNotAllowed)
		return
	}
	rooms := h.navigator.GetRoomOptions()
	log.Printf("[API] 获取教室列表，共 %d 个", len(rooms))
	h.sendJSON(w, map[string]interface{}{
		"rooms": rooms,
	})
}

func (h *Handler) ExitsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.sendError(w, "不支持的请求方法", http.StatusMethodNotAllowed)
		return
	}
	exits := h.navigator.Graph.GetExits()
	exitLocationMap := map[string]amap.Location{}
	if h.amapClient != nil {
		exitLocationMap = h.amapClient.GetExitLocationMap()
	}

	type ExitInfo struct {
		ID        string  `json:"id"`
		Name      string  `json:"name"`
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	}

	exitInfos := make([]ExitInfo, 0, len(exits))
	for _, exitID := range exits {
		info := ExitInfo{ID: exitID, Name: exitID}

		if node, ok := h.navigator.Graph.GetNode(exitID); ok && node.Label != "" {
			info.Name = node.Label
		}

		if loc, ok := exitLocationMap[exitID]; ok {
			if loc.Address != "" {
				info.Name = loc.Address
			} else if loc.Name != "" {
				info.Name = loc.Name
			}
			info.Latitude = loc.Latitude
			info.Longitude = loc.Longitude
		}

		exitInfos = append(exitInfos, info)
	}

	log.Printf("[API] 获取出口列表，共 %d 个", len(exits))
	h.sendJSON(w, map[string]interface{}{
		"exits": exitInfos,
	})
}

func (h *Handler) StartsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.sendError(w, "不支持的请求方法", http.StatusMethodNotAllowed)
		return
	}
	starts := h.amapClient.GetStartLocations()
	log.Printf("[API] 获取起点列表，共 %d 个", len(starts))
	h.sendJSON(w, map[string]interface{}{
		"starts": starts,
	})
}

// CoordinatesHandler 返回所有地点的坐标映射，供前端地图使用
// 返回格式：{ "起点名称": [lng, lat], "B 楼": [lng, lat], ... }
func (h *Handler) CoordinatesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.sendError(w, "不支持的请求方法", http.StatusMethodNotAllowed)
		return
	}
	coords := h.amapClient.GetCoordinates()
	log.Printf("[API] 获取坐标映射，共 %d 个", len(coords))
	h.sendJSON(w, map[string]interface{}{
		"coordinates": coords,
	})
}

// ConfigHandler 返回前端配置信息（高德 JS API Key 等）
// 这样前端可以动态获取配置，不需要硬编码在 HTML 中
func (h *Handler) ConfigHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.sendError(w, "不支持的请求方法", http.StatusMethodNotAllowed)
		return
	}

	// 从环境变量读取 JS API 配置
	jsApiKey := os.Getenv("AMAP_JS_API_KEY")
	securityCode := os.Getenv("AMAP_SECURITY_CODE")

	h.sendJSON(w, map[string]interface{}{
		"amap_js_api_key":    jsApiKey,
		"amap_security_code": securityCode,
	})
}

func (h *Handler) sendJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func (h *Handler) sendError(w http.ResponseWriter, message string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":       false,
		"error_message": message,
	})
}
