package graph

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadGraph(t *testing.T) {
	// 创建临时测试文件
	tmpDir := t.TempDir()
	testFile := filepath.Join(tmpDir, "test_graph.jsonc")

	testContent := `{
		"schema": "test/v1",
		"building": "Test Building",
		"assumptions": {
			"east_is_left_on_map": true,
			"stair_indexing": "test",
			"costs": {
				"stair_between_floors": 20,
				"room_to_room_adjacent_same_floor": 30,
				"stair_to_room_adjacent_same_floor": 8,
				"exit_to_adjacent_node": 8
			}
		},
		"nodes": [
			{"id": "E1", "type": "entrance", "floor": 1, "label": "Exit 1"},
			{"id": "B101", "type": "room", "floor": 1, "label": "Room 101"},
			{"id": "S_ST1_F1", "type": "stair", "floor": 1, "label": "Stair 1 F1"},
			{"id": "S_ST1_F2", "type": "stair", "floor": 2, "label": "Stair 1 F2"}
		],
		"edges": [
			{"a": "E1", "b": "B101", "w": 8},
			{"a": "B101", "b": "S_ST1_F1", "w": 8},
			{"a": "S_ST1_F1", "b": "S_ST1_F2", "w": 20}
		]
	}`

	if err := os.WriteFile(testFile, []byte(testContent), 0644); err != nil {
		t.Fatalf("创建测试文件失败：%v", err)
	}

	g, err := LoadGraph(testFile)
	if err != nil {
		t.Fatalf("LoadGraph 失败：%v", err)
	}

	if len(g.Data.Nodes) != 4 {
		t.Errorf("期望 4 个节点，得到 %d", len(g.Data.Nodes))
	}

	if len(g.Data.Edges) != 3 {
		t.Errorf("期望 3 条边，得到 %d", len(g.Data.Edges))
	}

	if len(g.Exits) != 1 || g.Exits[0] != "E1" {
		t.Errorf("出口列表错误：%v", g.Exits)
	}
}

func TestLoadGraphFileNotFound(t *testing.T) {
	_, err := LoadGraph("/nonexistent/path/graph.jsonc")
	if err == nil {
		t.Error("期望错误，得到 nil")
	}
}

func TestExtractStairNum(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"S_ST1_F1", "ST1"},
		{"S_ST2_F3", "ST2"},
		{"S_ST10_F5", "ST10"},
		{"B101", ""},
		{"E1", ""},
		{"", ""},
	}

	for _, tt := range tests {
		result := extractStairNum(tt.input)
		if result != tt.expected {
			t.Errorf("extractStairNum(%q) = %q, 期望 %q", tt.input, result, tt.expected)
		}
	}
}

func TestGetFloor(t *testing.T) {
	g := &Graph{
		NodeMap: map[string]Node{
			"B101": {ID: "B101", Type: "room", Floor: 1},
			"B201": {ID: "B201", Type: "room", Floor: 2},
		},
	}

	floor, err := g.GetFloor("B101")
	if err != nil {
		t.Errorf("GetFloor 失败：%v", err)
	}
	if floor != 1 {
		t.Errorf("期望楼层 1, 得到 %d", floor)
	}

	_, err = g.GetFloor("NOTEXIST")
	if err == nil {
		t.Error("期望错误，得到 nil")
	}
}
