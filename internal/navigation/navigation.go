package navigation

import (
	"container/heap"
	"fmt"
	"sort"
	"strings"
	"xd-b-guide/internal/amap"
	"xd-b-guide/internal/graph"
)

// PathStep 路径步骤
type PathStep struct {
	From        string `json:"from"`
	To          string `json:"to"`
	Weight      int    `json:"weight"`
	Description string `json:"description"`
	Action      string `json:"action"`
}

// RouteResult 路线规划结果
type RouteResult struct {
	Success      bool          `json:"success"`
	ErrorMessage string        `json:"error_message,omitempty"`
	Outdoor      *OutdoorRoute `json:"outdoor,omitempty"`
	Indoor       []PathStep    `json:"indoor,omitempty"`
	TotalWeight  int           `json:"total_weight"`
	Path         []string      `json:"path"`
}

// OutdoorRoute 室外路线
type OutdoorRoute struct {
	From         string   `json:"from"`
	To           string   `json:"to"`
	NearestExit  string   `json:"nearest_exit"`
	Distance     int      `json:"distance"` // 米
	Duration     int      `json:"duration"` // 秒
	Instructions []string `json:"instructions,omitempty"`
}

// Item 优先队列项
type Item struct {
	node     string
	priority int
	index    int
	prev     string
}

// PriorityQueue 优先队列
type PriorityQueue []*Item

func (pq PriorityQueue) Len() int { return len(pq) }
func (pq PriorityQueue) Less(i, j int) bool {
	return pq[i].priority < pq[j].priority
}
func (pq PriorityQueue) Swap(i, j int) {
	pq[i], pq[j] = pq[j], pq[i]
	pq[i].index = i
	pq[j].index = j
}
func (pq *PriorityQueue) Push(x interface{}) {
	n := len(*pq)
	item := x.(*Item)
	item.index = n
	*pq = append(*pq, item)
}
func (pq *PriorityQueue) Pop() interface{} {
	old := *pq
	n := len(old)
	item := old[n-1]
	old[n-1] = nil
	item.index = -1
	*pq = old[0 : n-1]
	return item
}

// Navigator 导航器
type Navigator struct {
	Graph      *graph.Graph
	AMapClient *amap.AMapClient
}

// NewNavigator 创建导航器
func NewNavigator(g *graph.Graph) *Navigator {
	return &Navigator{Graph: g}
}

// SetAMapClient 设置高德地图客户端
func (n *Navigator) SetAMapClient(client *amap.AMapClient) {
	n.AMapClient = client
}

// FindShortestPath 室内最短路径（Dijkstra 算法）
func (n *Navigator) FindShortestPath(start, end string) ([]string, int, error) {
	if _, ok := n.Graph.NodeMap[start]; !ok {
		return nil, 0, fmt.Errorf("起点不存在：%s", start)
	}
	if _, ok := n.Graph.NodeMap[end]; !ok {
		return nil, 0, fmt.Errorf("终点不存在：%s", end)
	}

	dist := make(map[string]int)
	prev := make(map[string]string)
	pq := make(PriorityQueue, 0)

	for nodeID := range n.Graph.NodeMap {
		dist[nodeID] = 1 << 30
	}
	dist[start] = 0

	heap.Init(&pq)
	startItem := &Item{node: start, priority: 0, prev: ""}
	heap.Push(&pq, startItem)

	for pq.Len() > 0 {
		item := heap.Pop(&pq).(*Item)
		u := item.node

		if u == end {
			break
		}

		if item.priority > dist[u] {
			continue
		}

		for neighbor, weight := range n.Graph.AdjList[u] {
			alt := dist[u] + weight
			if alt < dist[neighbor] {
				dist[neighbor] = alt
				prev[neighbor] = u
				heap.Push(&pq, &Item{node: neighbor, priority: alt, prev: u})
			}
		}
	}

	if dist[end] >= 1<<30 {
		return nil, 0, fmt.Errorf("无法找到从 %s 到 %s 的路径", start, end)
	}

	path := []string{}
	for at := end; at != ""; at = prev[at] {
		path = append(path, at)
	}
	reverse(path)

	return path, dist[end], nil
}

// FindBestRoute 完整路线规划（室外 + 室内）
// 新逻辑：
// 1. 室外：起点 → B 楼（固定）
// 2. 室内：从所有入口中找出到目的地最短的那个
func (n *Navigator) FindBestRoute(startName, destination string) (*RouteResult, error) {
	// 验证目的地
	destNode, ok := n.Graph.GetNode(destination)
	if !ok {
		return &RouteResult{
			Success:      false,
			ErrorMessage: fmt.Sprintf("目的地不存在：%s", destination),
		}, nil
	}

	if n.AMapClient == nil {
		return n.findBestRouteFallback(startName, destination, destNode)
	}

	// 1. 室外导航：起点 → B 楼
	_, outdoorRoute, err := n.AMapClient.FindRouteToBuilding(startName)
	if err != nil {
		return &RouteResult{
			Success:      false,
			ErrorMessage: "无法规划室外路线：" + err.Error(),
		}, nil
	}

	// 2. 室内导航：从所有入口中找出到目的地最短的
	exits := n.Graph.GetExits()
	var bestExit string
	var bestIndoorPath []string
	var bestIndoorWeight int = 1 << 30

	for _, exit := range exits {
		path, weight, err := n.FindShortestPath(exit, destination)
		if err != nil {
			continue
		}
		if weight < bestIndoorWeight {
			bestIndoorWeight = weight
			bestIndoorPath = path
			bestExit = exit
		}
	}

	if bestIndoorPath == nil {
		return &RouteResult{
			Success:      false,
			ErrorMessage: "无法找到可行路径",
		}, nil
	}

	indoorSteps := n.buildPathSteps(bestIndoorPath)

	// 3. 构建结果
	instructions := []string{}
	for _, step := range outdoorRoute.Steps {
		instructions = append(instructions, step.Instruction)
	}

	return &RouteResult{
		Success: true,
		Outdoor: &OutdoorRoute{
			From:         startName,
			To:           destination,
			NearestExit:  bestExit,
			Distance:     outdoorRoute.Distance,
			Duration:     outdoorRoute.Duration,
			Instructions: instructions,
		},
		Indoor:      indoorSteps,
		TotalWeight: bestIndoorWeight,
		Path:        bestIndoorPath,
	}, nil
}

// findBestRouteFallback 降级路线规划（不使用高德 API）
func (n *Navigator) findBestRouteFallback(startName, destination string, destNode *graph.Node) (*RouteResult, error) {
	var bestPath []string
	var bestWeight int = 1 << 30
	var bestExit string

	exits := n.Graph.GetExits()
	for _, exit := range exits {
		path, weight, err := n.FindShortestPath(exit, destination)
		if err != nil {
			continue
		}

		if weight < bestWeight {
			bestWeight = weight
			bestPath = path
			bestExit = exit
		}
	}

	if bestPath == nil {
		return &RouteResult{
			Success:      false,
			ErrorMessage: "无法找到可行路径",
		}, nil
	}

	steps := n.buildPathSteps(bestPath)

	return &RouteResult{
		Success: true,
		Outdoor: &OutdoorRoute{
			From:        startName,
			To:          destination,
			NearestExit: bestExit,
			Distance:    0,
			Duration:    0,
		},
		Indoor:      steps,
		TotalWeight: bestWeight,
		Path:        bestPath,
	}, nil
}

func (n *Navigator) buildPathSteps(path []string) []PathStep {
	steps := []PathStep{}

	for i := 0; i < len(path)-1; i++ {
		from := path[i]
		to := path[i+1]
		weight := n.Graph.AdjList[from][to]

		fromNode, _ := n.Graph.GetNode(from)
		toNode, _ := n.Graph.GetNode(to)

		step := PathStep{
			From:   from,
			To:     to,
			Weight: weight,
		}

		step.Action, step.Description = n.describeAction(from, to, fromNode, toNode)
		steps = append(steps, step)
	}

	return steps
}

func (n *Navigator) describeAction(from, to string, fromNode, toNode *graph.Node) (action, description string) {
	fromType := fromNode.Type
	toType := toNode.Type

	switch {
	case fromType == "entrance":
		return "进入", fmt.Sprintf("从%s进入大楼", fromNode.Label)
	case fromType == "stair" && toType == "stair":
		if toNode.Floor > fromNode.Floor {
			return "上楼", fmt.Sprintf("上楼梯到 %d 层", toNode.Floor)
		}
		return "下楼", fmt.Sprintf("下楼梯到 %d 层", toNode.Floor)
	case fromType == "stair" && toType == "room":
		return "出楼梯", fmt.Sprintf("从楼梯出来 (%s)，到达 %s", fromNode.Label, to)
	case fromType == "room" && toType == "stair":
		return "进楼梯", fmt.Sprintf("进入楼梯间 (%s) 准备上下楼", toNode.Label)
	case fromType == "room" && toType == "room":
		if fromNode.Floor == toNode.Floor {
			return "直行", fmt.Sprintf("沿走廊从 %s (%s) 走到 %s (%s)", from, fromNode.Label, to, toNode.Label)
		}
	}

	return "移动", fmt.Sprintf("从 %s 到 %s", from, to)
}

// GetAllRooms 获取所有房间
func (n *Navigator) GetAllRooms() []graph.Node {
	nodes := n.Graph.GetAllNodes()
	rooms := []graph.Node{}
	for _, node := range nodes {
		if node.Type == "room" {
			rooms = append(rooms, node)
		}
	}
	sort.Slice(rooms, func(i, j int) bool {
		return rooms[i].ID < rooms[j].ID
	})
	return rooms
}

// GetRoomOptions 获取房间选项列表
func (n *Navigator) GetRoomOptions() []string {
	rooms := n.GetAllRooms()
	options := []string{}
	for _, room := range rooms {
		if !strings.Contains(room.Label, "天台") {
			options = append(options, room.ID)
		}
	}
	return options
}

func reverse(s []string) {
	for i, j := 0, len(s)-1; i < j; i, j = i+1, j-1 {
		s[i], s[j] = s[j], s[i]
	}
}
