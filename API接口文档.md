# 中医知识图谱系统 - API接口文档

版本：v1.0.0  
最后更新：2025-01-24  
基础地址：`http://localhost:3001/api`

> 说明：后端默认端口为3001，可通过环境变量 `PORT` 修改。生产环境可通过 `FRONTEND_URL` 自动代理 `/api`。

---

## 1. 认证与通用约定
- 当前版本接口无需认证，可根据需要接入JWT。
- 所有接口返回 JSON，统一格式如下：

```json
{
  "success": true,
  "data": {},
  "message": "可选提示信息"
}
```

出现错误时：
```json
{
  "success": false,
  "error": "错误描述",
  "message": "可选提示",
  "statusCode": 400
}
```

---

## 2. 健康检查

### 2.1 GET `/health`
- **说明**：检查服务与数据库状态。
- **响应示例**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-01-24T10:30:00.000Z"
}
```

---

## 3. 图谱统计与节点

### 3.1 GET `/stats`
- **说明**：获取节点数量、关系数量、标签统计。
- **响应示例**
```json
{
  "success": true,
  "data": {
    "totalNodes": 6820,
    "totalRelationships": 43542,
    "labelStats": [
      { "label": "Disease", "count": 1200 }
    ],
    "dataCompleteness": 100
  }
}
```

### 3.2 GET `/nodes/roots`
- **说明**：获取根节点（顶层分类）。
- **响应参数**：无
- **响应示例**
```json
{
  "success": true,
  "data": [
    {
      "code": "A01.",
      "name": "外感病",
      "category": "疾病",
      "level": 1
    }
  ]
}
```

### 3.3 GET `/nodes/:code`
- **说明**：获取指定节点详情。
- **路径参数**
  - `code`：节点代码
- **响应示例**
```json
{
  "success": true,
  "data": {
    "code": "A01.001",
    "name": "伤寒",
    "category": "疾病",
    "level": 3,
    "properties": { "synonyms": ["中风"] },
    "parents": [
      { "code": "A01.", "name": "外感病", "level": 1 }
    ],
    "children": [
      { "code": "A01.001.01", "name": "太阳伤寒", "level": 4 }
    ],
    "parentCount": 1,
    "childrenCount": 2
  }
}
```

### 3.4 GET `/nodes/:code/neighbors`
- **说明**：获取节点的父、子节点。
- **查询参数**
  - `direction`（可选）：`parents` / `children` / `both`（默认）

### 3.5 GET `/nodes/:code/path`
- **说明**：获取节点到根节点的路径。

> 注意：以上接口基于 `server-simple.js` 的路由实现，部分高级接口在 `backend/src/app.ts` + `routes` 中，需要启动 TypeScript 版后端。

---

## 4. 搜索与分析

### 4.1 GET `/search`
- **说明**：按关键词搜索节点。
- **查询参数**
  - `q`（必填）：关键字（名称、代码）
  - `category`（可选）：分类，如 `疾病`
  - `level`（可选）：层级
- **响应示例**
```json
{
  "success": true,
  "data": [
    { "code": "A01.001", "name": "伤寒", "category": "疾病", "level": 3 }
  ]
}
```

### 4.2 GET `/analytics/overview`
- **说明**：获取分析概览（节点增长、类别分布等）。
- **响应示例**
```json
{
  "success": true,
  "data": {
    "categoryDistribution": [
      { "category": "疾病", "count": 3200 }
    ],
    "levelDistribution": [
      { "level": 1, "count": 17 }
    ],
    "latestUpdates": [
      { "code": "A01.005", "name": "新节点", "updatedAt": "2025-01-20" }
    ]
  }
}
```

### 4.3 GET `/analytics/category`
- **说明**：按类别统计节点数量。
- **查询参数**
  - `limit`（可选）默认10

### 4.4 GET `/analytics/level`
- **说明**：按层级统计节点数量。

### 4.5 GET `/analytics/evolution`
- **说明**：节点新增趋势。
- **查询参数**
  - `range`：`7d` / `30d` / `12m`

> 以上分析接口在 `frontend/src/services/api.ts` 中有对应方法，后端TypeScript版本提供实现；若使用 `server-simple.js`，可根据需要复制对应路由。

---

## 5. 可视化与导出

### 5.1 GET `/graph/subgraph`
- **说明**：获取特定根节点的子图数据，供2D/3D可视化。
- **查询参数**
  - `rootCode`：根节点代码
  - `depth`（默认3）：展开层级
  - `limit`（默认200）：节点限制

### 5.2 GET `/graph/path`
- **说明**：获取两个节点之间的路径。
- **查询参数**
  - `source`：起始节点代码
  - `target`：目标节点代码

### 5.3 GET `/graph/export`
- **说明**：导出子图为JSON/CSV。
- **查询参数**
  - `format`：`json` / `csv`
  - `rootCode`、`depth` 等同上

---

## 6. 错误码

| 状态码 | 说明 | 解决方案 |
|--------|------|----------|
| 200 | 成功 | - |
| 400 | 参数错误 | 检查必填字段、格式 |
| 404 | 资源不存在 | 确认节点/路径是否存在 |
| 503 | 数据库未连接 | 检查Neo4j服务、环境变量 |
| 500 | 服务器错误 | 查看后端日志 |

---

## 7. Swagger & Postman
- 在线文档：`http://localhost:3001/api-docs`
- 可导出Swagger JSON供Postman/Apifox导入。

---

## 8. 前端调用示例

```ts
import { getStats, getNodeDetail } from '@/services/api'

const loadStats = async () => {
  try {
    const stats = await getStats()
    console.log(stats.totalNodes)
  } catch (err) {
    message.error('获取统计数据失败')
  }
}

const loadNode = async (code: string) => {
  const detail = await getNodeDetail(code)
  setNode(detail)
}
```

---

如需扩展，请在 `backend/src/routes` 中添加新路由，并在 `frontend/src/services/api.ts` 中更新对应方法。

