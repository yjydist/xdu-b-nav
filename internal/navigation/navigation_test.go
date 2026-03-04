package navigation

import (
	"testing"
	"xd-b-guide/internal/graph"
)

func TestFindShortestPath(t *testing.T) {
	g := &graph.Graph{
		NodeMap: map[string]graph.Node{
			"A": {ID: "A", Type: "room"},
			"B": {ID: "B", Type: "room"},
			"C": {ID: "C", Type: "room"},
		},
		AdjList: map[string]map[string]int{
			"A": {"B": 10, "C": 5},
			"B": {"A": 10, "C": 3},
			"C": {"A": 5, "B": 3},
		},
	}

	nav := NewNavigator(g)

	// 测试正常路径
	path, weight, err := nav.FindShortestPath("A", "B")
	if err != nil {
		t.Errorf("FindShortestPath 失败：%v", err)
	}
	if weight != 8 { // A->C->B = 5+3 = 8
		t.Errorf("期望权重 8, 得到 %d", weight)
	}
	if len(path) != 3 || path[0] != "A" || path[2] != "B" {
		t.Errorf("路径错误：%v", path)
	}
}

func TestFindShortestPathInvalidNode(t *testing.T) {
	g := &graph.Graph{
		NodeMap: map[string]graph.Node{
			"A": {ID: "A", Type: "room"},
		},
		AdjList: map[string]map[string]int{
			"A": {},
		},
	}

	nav := NewNavigator(g)

	// 测试起点不存在
	_, _, err := nav.FindShortestPath("X", "A")
	if err == nil {
		t.Error("期望错误，得到 nil")
	}

	// 测试终点不存在
	_, _, err = nav.FindShortestPath("A", "X")
	if err == nil {
		t.Error("期望错误，得到 nil")
	}
}

func TestFindBestRoute(t *testing.T) {
	g := &graph.Graph{
		NodeMap: map[string]graph.Node{
			"E1":    {ID: "E1", Type: "entrance", Floor: 1},
			"S_ST1": {ID: "S_ST1", Type: "stair", Floor: 1},
			"B101":  {ID: "B101", Type: "room", Floor: 1},
			"B201":  {ID: "B201", Type: "room", Floor: 2},
			"S_ST2": {ID: "S_ST2", Type: "stair", Floor: 2},
		},
		AdjList: map[string]map[string]int{
			"E1":    {"B101": 8},
			"B101":  {"E1": 8, "S_ST1": 8},
			"S_ST1": {"B101": 8, "S_ST2": 20},
			"B201":  {"S_ST2": 8},
			"S_ST2": {"S_ST1": 20, "B201": 8},
		},
	}
	g.Exits = []string{"E1"}

	nav := NewNavigator(g)

	// 测试到 2 楼的路径
	result, err := nav.FindBestRoute("", "B201")
	if err != nil {
		t.Errorf("FindBestRoute 失败：%v", err)
	}
	if !result.Success {
		t.Errorf("期望成功，得到失败：%s", result.ErrorMessage)
	}
	if result.Outdoor.NearestExit != "E1" {
		t.Errorf("期望入口 E1, 得到 %s", result.Outdoor.NearestExit)
	}
}
