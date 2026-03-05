/**
 * API 服务模块
 * 封装与后端服务器通信的所有接口
 * 使用相对路径，开发环境通过 Vite 代理转发
 */

const API_BASE = '/api';

/**
 * 获取导航路径
 * @param {string} start - 起点名称
 * @param {string} destination - 目的地教室号
 * @returns {Promise<Object>} 导航结果
 */
export async function fetchRoute(start, destination) {
  const response = await fetch(`${API_BASE}/route`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ start, destination }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error_message || `请求失败：${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error_message || '路径规划失败');
  }

  return result;
}

/**
 * 获取所有教室列表
 * @returns {Promise<Object>} 教室列表数据
 */
export async function fetchRooms() {
  const response = await fetch(`${API_BASE}/rooms`);
  if (!response.ok) {
    throw new Error('加载教室列表失败');
  }
  return response.json();
}

/**
 * 获取所有出口信息
 * @returns {Promise<Object>} 出口列表数据
 */
export async function fetchExits() {
  const response = await fetch(`${API_BASE}/exits`);
  if (!response.ok) {
    throw new Error('加载出口列表失败');
  }
  return response.json();
}

/**
 * 获取所有起点列表
 * @returns {Promise<Object>} 起点列表数据
 */
export async function fetchStarts() {
  const response = await fetch(`${API_BASE}/starts`);
  if (!response.ok) {
    throw new Error('加载起点列表失败');
  }
  return response.json();
}

/**
 * 获取前端配置（高德 JS API Key）
 * @returns {Promise<Object>} 配置数据
 */
export async function fetchConfig() {
  const response = await fetch(`${API_BASE}/config`);
  if (!response.ok) {
    throw new Error('加载地图配置失败');
  }
  return response.json();
}

/**
 * 获取所有地点的坐标映射，供前端地图使用
 * 返回格式：{ "起点名称": [lng, lat], "B 楼": [lng, lat], ... }
 * @returns {Promise<Object>} 坐标映射数据
 */
export async function fetchCoordinates() {
  const response = await fetch(`${API_BASE}/coordinates`);
  if (!response.ok) {
    throw new Error('加载坐标映射失败');
  }
  return response.json();
}
