/**
 * B 楼导航系统 - 前端主脚本
 * 功能：
 * 1. 动态加载高德地图 JS API
 * 2. 显示起点和目的地选择
 * 3. 调用后端 API 获取导航路径
 * 4. 在地图上绘制室外路线
 * 5. 显示室内导航步骤
 */
document.addEventListener('DOMContentLoaded', function() {
    // 获取页面元素
    const form = document.getElementById('route-form');
    const startSelect = document.getElementById('start');
    const destinationSelect = document.getElementById('destination');
    const resultSection = document.getElementById('result-section');
    const loadingSection = document.getElementById('loading');
    const errorSection = document.getElementById('error');
    const outdoorContent = document.getElementById('outdoor-content');
    const indoorContent = document.getElementById('indoor-content');
    const pathSummary = document.getElementById('path-summary');
    const mapContainer = document.getElementById('map-container');

    // 地图相关变量
    let map = null;                // 地图实例
    let walkingRoute = null;       // 步行路径规划实例
    let markers = [];              // 标记点数组
    let polyline = null;           // 兜底直线（路径失败时使用）
    let isAMapReady = false;       // 标记高德脚本是否已加载完成
    let pendingOutdoorResult = null; // 记录“地图尚未就绪时”的最新室外结果，脚本加载后自动重绘

    // 初始化：加载配置、起点列表、教室列表
    loadAMapConfig();
    loadStartLocations();
    loadRooms();

    // 表单提交事件：规划路径
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const start = startSelect.value;
        const destination = destinationSelect.value;

        if (!start) {
            showError('请选择起点');
            return;
        }

        if (!destination) {
            showError('请选择目的地教室');
            return;
        }

        showLoading();

        try {
            const response = await fetch('/api/route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    start: start,
                    destination: destination,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error_message || `请求失败：${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                showError(result.error_message || '路径规划失败');
                return;
            }

            displayResult(result);
        } catch (error) {
            console.error('导航请求错误:', error);
            showError('网络错误：' + error.message);
        }
    });

    /**
     * 加载高德地图配置
     * 从后端获取 JS API Key 和安全密钥，动态加载地图脚本
     */
    async function loadAMapConfig() {
        try {
            const response = await fetch('/api/config');
            if (!response.ok) {
                throw new Error('加载地图配置失败');
            }
            const config = await response.json();
            
            if (config.amap_js_api_key && config.amap_js_api_key !== '你的 JS_API_Key_填在这里') {
                // 配置安全密钥（高德 JS API 2.0 需要）
                window._AMapSecurityConfig = {
                    securityJsCode: config.amap_security_code || ''
                };

                // 动态加载高德地图脚本。
                // 为什么动态加载：
                // 1) key 从后端配置接口返回，避免硬编码在仓库里；
                // 2) key 缺失时前端依旧可运行（仅文字路线降级），不会整页报错。
                const script = document.getElementById('amap-script');
                // 这里显式追加 plugin 参数的原因：
                // 1) 部分环境下仅加载基础 JS API，不会自动注入 Walking 构造器；
                // 2) 先在 URL 上声明插件，可显著降低“AMap.Walking is not a constructor”的概率；
                // 3) 即使插件参数未生效，后面仍有 AMap.plugin 二次兜底，双保险保证稳定。
                script.src = `https://webapi.amap.com/maps?v=2.0&key=${config.amap_js_api_key}&plugin=AMap.Walking`;
                
                // 等待脚本加载完成后初始化地图
                script.onload = function() {
                    console.log('高德地图 API 加载成功');
                    isAMapReady = true;
                    initMap();

                    // 若用户在脚本加载完成前已点过“规划路径”，这里自动补画路线，
                    // 避免出现“后端有结果但地图空白”的体验问题。
                    if (pendingOutdoorResult) {
                        renderOutdoorMap(pendingOutdoorResult);
                        pendingOutdoorResult = null;
                    }
                };
                
                script.onerror = function() {
                    console.error('高德地图 API 加载失败');
                };
            } else {
                console.warn('未配置高德 JS API Key，地图功能不可用');
                mapContainer.innerHTML = '<div class="map-fallback">未配置 AMAP_JS_API_KEY，当前仅展示文字路线</div>';
            }
        } catch (error) {
            console.error('加载地图配置失败:', error);
        }
    }

    /**
     * 初始化地图
     * 创建地图实例，设置中心点和缩放级别
     */
    function initMap() {
        if (typeof AMap === 'undefined') {
            console.warn('高德地图 API 未加载，使用文本模式显示路线');
            return;
        }

        // 创建地图实例，中心点设为 B 楼南楼
        map = new AMap.Map('map-container', {
            zoom: 16,                    // 缩放级别
            center: [108.8509, 34.1582], // 西电南校区 B 楼中心
            viewMode: '2D'               // 2D 模式
        });
    }

    /**
     * 加载起点列表（宿舍楼）
     * 从后端 API 获取所有可选的起点，按区域分组显示
     */
    async function loadStartLocations() {
        try {
            const response = await fetch('/api/starts');
            if (!response.ok) {
                throw new Error('加载起点列表失败');
            }
            const data = await response.json();
            
            if (data.starts && data.starts.length > 0) {
                // 按区域分组：丁香公寓、海棠公寓、竹园公寓
                const groups = {
                    '丁香公寓': [],
                    '海棠公寓': [],
                    '竹园公寓': []
                };
                
                data.starts.forEach(loc => {
                    for (const region in groups) {
                        if (loc.name.includes(region)) {
                            groups[region].push(loc);
                            break;
                        }
                    }
                });
                
                // 创建带分组的选项
                for (const [region, locations] of Object.entries(groups)) {
                    if (locations.length > 0) {
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = region;
                        locations.forEach(loc => {
                            const option = document.createElement('option');
                            option.value = loc.name;
                            option.textContent = loc.name;
                            optgroup.appendChild(option);
                        });
                        startSelect.appendChild(optgroup);
                    }
                }
            }
        } catch (error) {
            console.error('加载起点列表失败:', error);
        }
    }

    /**
     * 加载教室列表
     * 从后端 API 获取所有 B 楼教室，按楼层分组显示
     */
    async function loadRooms() {
        try {
            const response = await fetch('/api/rooms');
            if (!response.ok) {
                throw new Error('加载教室列表失败');
            }
            const data = await response.json();
            
            if (data.rooms && data.rooms.length > 0) {
                // 按楼层分组
                const floors = {};
                data.rooms.forEach(room => {
                    const floor = parseInt(room.substring(1, 2));
                    if (!floors[floor]) {
                        floors[floor] = [];
                    }
                    floors[floor].push(room);
                });
                
                // 按楼层排序创建选项
                Object.keys(floors).sort().forEach(floor => {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = floor + '楼';
                    floors[floor].sort().forEach(room => {
                        const option = document.createElement('option');
                        option.value = room;
                        option.textContent = room;
                        optgroup.appendChild(option);
                    });
                    destinationSelect.appendChild(optgroup);
                });
            }
        } catch (error) {
            console.error('加载教室列表失败:', error);
        }
    }

    /**
     * 显示加载状态
     */
    function showLoading() {
        loadingSection.classList.remove('hidden');
        resultSection.classList.add('hidden');
        errorSection.classList.add('hidden');
    }

    /**
     * 显示错误信息
     * @param {string} message - 错误消息
     */
    function showError(message) {
        loadingSection.classList.add('hidden');
        resultSection.classList.add('hidden');
        errorSection.classList.remove('hidden');
        document.getElementById('error-message').textContent = message;
        
        // 5 秒后自动隐藏错误
        setTimeout(() => {
            errorSection.classList.add('hidden');
        }, 5000);
    }

    /**
     * 显示导航结果
     * @param {Object} result - 后端返回的导航结果
     */
    function displayResult(result) {
        loadingSection.classList.add('hidden');
        errorSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

        // 显示室外路线（地图 + 文字）
        if (result.outdoor) {
            renderOutdoorMap(result);
            renderOutdoorSteps(result);
            document.getElementById('outdoor-route').classList.remove('hidden');
        } else {
            document.getElementById('outdoor-route').classList.add('hidden');
        }

        // 显示室内路线
        if (result.indoor && result.indoor.length > 0) {
            let indoorHTML = '';
            result.indoor.forEach((step, index) => {
                const icons = {
                    '进入': '🚪',
                    '上楼': '⬆️',
                    '下楼': '⬇️',
                    '出楼梯': '🚶',
                    '进楼梯': '🚶',
                    '直行': '➡️',
                    '移动': '📍'
                };
                const icon = icons[step.action] || '📍';
                
                indoorHTML += `
                    <div class="step">
                        <div class="step-number">${icon}</div>
                        <div class="step-content">
                            <div class="step-action">${escapeHtml(step.action)}</div>
                            <div class="step-description">${escapeHtml(step.description)}</div>
                        </div>
                    </div>
                `;
            });

            // 这里额外展示“完整经过节点序列”。
            // 为什么需要单独展示：
            // 1) 用户反馈“路线看起来跳点”，仅靠自然语言步骤不易核对算法路径；
            // 2) 直接展示 result.path 可让人工校验每一个节点是否按预期经过；
            // 3) 当图数据调整时，可快速发现路径是否异常（例如缺边或权重失衡）。
            if (result.path && result.path.length > 0) {
                const nodeListHtml = result.path
                    .map((node, idx) => `<span class="path-node">${idx + 1}. ${escapeHtml(node)}</span>`)
                    .join('');

                indoorHTML += `
                    <div class="path-node-box">
                        <div class="path-node-title">完整经过节点</div>
                        <div class="path-node-list">${nodeListHtml}</div>
                    </div>
                `;
            }

            indoorContent.innerHTML = indoorHTML;
            document.getElementById('indoor-route').classList.remove('hidden');
        } else {
            document.getElementById('indoor-route').classList.add('hidden');
        }

        // 显示路径摘要
        pathSummary.innerHTML = `
            <h4>总权重</h4>
            <div class="total-weight">${result.total_weight}</div>
            <p class="path-nodes">入口：${escapeHtml(result.outdoor?.nearest_exit || 'N/A')} ｜ 节点数：${(result.path || []).length}</p>
        `;
    }

    /**
     * 渲染室外地图
     * 在地图上标记起点和终点，并绘制步行路线
     * @param {Object} result - 导航结果
     */
    function renderOutdoorMap(result) {
        if (!result.outdoor) return;

        // 清除旧的标记和路线
        if (markers.length > 0) {
            markers.forEach(m => m.setMap(null));
            markers = [];
        }
        if (polyline) {
            polyline.setMap(null);
            polyline = null;
        }

        // 获取起点坐标
        const startPoint = getStartLocationCoord(result.outdoor.from);
        const endPoint = [108.8509, 34.1582]; // B 楼中心

        if (!isAMapReady || typeof AMap === 'undefined' || !map || !startPoint) {
            // 这里不直接报错，而是缓存结果并等待脚本就绪后自动重绘。
            // 为什么要这样做：用户可能在页面刚加载时就点击规划，此时脚本可能尚未完成加载。
            pendingOutdoorResult = result;
            return;
        }

        // 添加起点标记
        const startMarker = new AMap.Marker({
            position: startPoint,
            title: result.outdoor.from,
            map: map
        });
        markers.push(startMarker);

        // 添加终点标记
        const endMarker = new AMap.Marker({
            position: endPoint,
            title: 'B 楼南楼',
            map: map
        });
        markers.push(endMarker);

        // 使用高德步行路径规划。
        // 关键修复点：不直接假设 AMap.Walking 已存在，
        // 必须先确保插件已加载，否则会抛出 “AMap.Walking is not a constructor”。
        ensureWalkingService(function(err) {
            if (err || !walkingRoute) {
                // 插件不可用时退化为直线，保证页面仍可用而不是直接报错。
                drawSimpleLine(startPoint, endPoint);
                return;
            }

            // 先清空旧路线，避免多次规划时叠线。
            walkingRoute.clear();

            // 搜索路径
            walkingRoute.search(startPoint, endPoint, function(status) {
                if (status === 'complete') {
                    // 路径规划成功，调整地图视野
                    fitMapBounds([startPoint, endPoint]);
                } else {
                    // 路径规划失败，画一条直线连接两点
                    drawSimpleLine(startPoint, endPoint);
                }
            });
        });
    }

    /**
     * 确保步行插件可用并创建 walkingRoute 实例。
     * 为什么需要这个函数：
     * 1) 高德 JS API 在不同加载时机下，AMap.Walking 可能尚未挂载；
     * 2) 直接 new AMap.Walking 会在插件缺失时抛异常，导致整条导航流程中断；
     * 3) 统一封装“检测 -> 动态加载 -> 创建实例”逻辑，避免多个调用点重复踩坑。
     */
    function ensureWalkingService(callback) {
        if (typeof callback !== 'function') {
            return;
        }

        if (!isAMapReady || typeof AMap === 'undefined' || !map) {
            callback(new Error('地图未就绪'));
            return;
        }

        // 已有实例且可用时直接复用，减少重复创建。
        if (walkingRoute && typeof walkingRoute.search === 'function') {
            callback(null);
            return;
        }

        // 内部小函数：真正创建步行实例。
        function buildWalkingInstance() {
            try {
                if (typeof AMap.Walking !== 'function') {
                    callback(new Error('Walking 插件未挂载'));
                    return;
                }

                walkingRoute = new AMap.Walking({
                    map: map,
                    // 不使用 panel，把文字步骤统一用后端结果渲染，
                    // 避免“高德面板内容”和“自定义步骤”互相覆盖导致看起来像“路线没显示”。
                    showTraffic: false
                });
                callback(null);
            } catch (e) {
                callback(e instanceof Error ? e : new Error('创建 Walking 实例失败'));
            }
        }

        // 先尝试直接创建（适用于 plugin 参数已生效场景）。
        if (typeof AMap.Walking === 'function') {
            buildWalkingInstance();
            return;
        }

        // 再走插件动态加载兜底（最关键的稳定性保障）。
        if (typeof AMap.plugin === 'function') {
            AMap.plugin(['AMap.Walking'], function() {
                buildWalkingInstance();
            });
            return;
        }

        callback(new Error('当前 AMap 版本不支持 plugin 动态加载'));
    }

    /**
     * 渲染室外文字步骤
     * @param {Object} result - 导航结果
     */
    function renderOutdoorSteps(result) {
        if (!result.outdoor) return;

        let html = `
            <div class="step-summary">
                <div class="step">
                    <div class="step-number">🏠</div>
                    <div class="step-content">
                        <div class="step-action">从 ${escapeHtml(result.outdoor.from)} 出发</div>
                        <div class="step-description">步行前往 B 楼南楼</div>
                        <div class="step-weight">距离：${result.outdoor.distance}米，预计 ${Math.ceil(result.outdoor.duration / 60)}分钟</div>
                    </div>
                </div>
            </div>
        `;

        if (result.outdoor.instructions && result.outdoor.instructions.length > 0) {
            result.outdoor.instructions.forEach((instruction, index) => {
                html += `
                    <div class="step">
                        <div class="step-number">${index + 1}</div>
                        <div class="step-content">
                            <div class="step-description">${escapeHtml(instruction)}</div>
                        </div>
                    </div>
                `;
            });
        }

        outdoorContent.innerHTML = html;
    }

    /**
     * 画简单直线（当路径规划失败时的降级方案）
     * @param {Array} start - 起点坐标 [lng, lat]
     * @param {Array} end - 终点坐标 [lng, lat]
     */
    function drawSimpleLine(start, end) {
        polyline = new AMap.Polyline({
            path: [start, end],
            strokeColor: '#3366FF',  // 蓝色路线
            strokeWeight: 4,         // 线宽 4 像素
            strokeStyle: 'solid',    // 实线
            strokeOpacity: 0.8       // 透明度 80%
        });
        polyline.setMap(map);
        fitMapBounds([start, end]);
    }

    /**
     * 调整地图视野以包含所有点
     * @param {Array} points - 坐标点数组
     */
    function fitMapBounds(points) {
        if (points.length < 2 || typeof AMap === 'undefined') return;
        map.setFitView();
    }

    /**
     * 获取起点坐标
     * @param {string} name - 起点名称
     * @returns {Array|null} 坐标 [lng, lat] 或 null
     */
    function getStartLocationCoord(name) {
        const coords = {
            '丁香公寓 11 号楼': [108.8485, 34.1612],
            '丁香公寓 12 号楼': [108.8488, 34.1614],
            '丁香公寓 13 号楼': [108.8491, 34.1616],
            '丁香公寓 14 号楼': [108.8494, 34.1618],
            '丁香公寓 15 号楼': [108.8497, 34.1620],
            '海棠公寓 5 号楼': [108.8520, 34.1595],
            '海棠公寓 6 号楼': [108.8522, 34.1598],
            '海棠公寓 7 号楼': [108.8524, 34.1601],
            '海棠公寓 8 号楼': [108.8526, 34.1604],
            '海棠公寓 9 号楼': [108.8528, 34.1607],
            '海棠公寓 10 号楼': [108.8530, 34.1610],
            '海棠公寓 18 号楼': [108.8535, 34.1625],
            '海棠公寓 20 号楼': [108.8538, 34.1628],
            '竹园公寓 1 号楼': [108.8490, 34.1565],
            '竹园公寓 2 号楼': [108.8493, 34.1568],
            '竹园公寓 3 号楼': [108.8496, 34.1571],
            '竹园公寓 4 号楼': [108.8499, 34.1574],
        };
        return coords[name] || null;
    }

    /**
     * HTML 转义，防止 XSS 攻击
     * @param {string} text - 原始文本
     * @returns {string} 转义后的文本
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
