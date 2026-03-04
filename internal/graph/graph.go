package graph

import (
	"encoding/json"
	"fmt"
	"os"
	"regexp"
	"strings"
)

type Node struct {
	ID    string `json:"id"`
	Type  string `json:"type"`
	Floor int    `json:"floor"`
	Label string `json:"label"`
}

type Edge struct {
	A string `json:"a"`
	B string `json:"b"`
	W int    `json:"w"`
}

type GraphData struct {
	Schema      string `json:"schema"`
	Building    string `json:"building"`
	Assumptions struct {
		EastIsLeftOnMap bool   `json:"east_is_left_on_map"`
		StairIndexing   string `json:"stair_indexing"`
		Costs           struct {
			StairBetweenFloors           int `json:"stair_between_floors"`
			RoomToRoomAdjacentSameFloor  int `json:"room_to_room_adjacent_same_floor"`
			StairToRoomAdjacentSameFloor int `json:"stair_to_room_adjacent_same_floor"`
			ExitToAdjacentNode           int `json:"exit_to_adjacent_node"`
		} `json:"costs"`
	} `json:"assumptions"`
	Nodes []Node `json:"nodes"`
	Edges []Edge `json:"edges"`
}

type Graph struct {
	Data    GraphData
	AdjList map[string]map[string]int
	NodeMap map[string]Node
	Exits   []string
	Stairs  map[string][]string
	Rooms   []string
}

func removeJSONComments(content []byte) []byte {
	re := regexp.MustCompile(`//[^\n]*`)
	return re.ReplaceAll(content, []byte{})
}

func LoadGraph(path string) (*Graph, error) {
	file, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("读取图文件失败：%w", err)
	}

	cleanContent := removeJSONComments(file)

	var data GraphData
	if err := json.Unmarshal(cleanContent, &data); err != nil {
		return nil, fmt.Errorf("解析 JSON 失败：%w", err)
	}

	g := &Graph{
		Data:    data,
		AdjList: make(map[string]map[string]int),
		NodeMap: make(map[string]Node),
		Stairs:  make(map[string][]string),
	}

	for _, node := range data.Nodes {
		g.NodeMap[node.ID] = node
		g.AdjList[node.ID] = make(map[string]int)

		switch node.Type {
		case "entrance":
			g.Exits = append(g.Exits, node.ID)
		case "room":
			if strings.HasPrefix(node.ID, "B") && !strings.Contains(node.ID, "天台") {
				g.Rooms = append(g.Rooms, node.ID)
			}
		case "stair":
			stairNum := extractStairNum(node.ID)
			if stairNum != "" {
				g.Stairs[stairNum] = append(g.Stairs[stairNum], node.ID)
			}
		}
	}

	for _, edge := range data.Edges {
		g.AdjList[edge.A][edge.B] = edge.W
		g.AdjList[edge.B][edge.A] = edge.W
	}

	return g, nil
}

func extractStairNum(id string) string {
	if !strings.HasPrefix(id, "S_ST") {
		return ""
	}
	parts := strings.Split(id, "_")
	if len(parts) < 2 {
		return ""
	}
	return parts[1]
}

func (g *Graph) GetNode(id string) (*Node, bool) {
	node, ok := g.NodeMap[id]
	return &node, ok
}

func (g *Graph) GetNeighbors(id string) map[string]int {
	return g.AdjList[id]
}

func (g *Graph) GetAllNodes() []Node {
	return g.Data.Nodes
}

func (g *Graph) GetRoomsByFloor(floor int) []string {
	var rooms []string
	for _, node := range g.Data.Nodes {
		if node.Type == "room" && node.Floor == floor {
			rooms = append(rooms, node.ID)
		}
	}
	return rooms
}

func (g *Graph) GetStairsByFloor(floor int) []string {
	var stairs []string
	for _, node := range g.Data.Nodes {
		if node.Type == "stair" && node.Floor == floor {
			stairs = append(stairs, node.ID)
		}
	}
	return stairs
}

func (g *Graph) GetExits() []string {
	return g.Exits
}

func (g *Graph) GetFloor(roomID string) (int, error) {
	node, ok := g.NodeMap[roomID]
	if !ok {
		return 0, fmt.Errorf("节点不存在：%s", roomID)
	}
	return node.Floor, nil
}
