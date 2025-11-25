import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Card, 
  Button, 
  Space, 
  Select, 
  Input, 
  Alert, 
  Empty,
  message,
  Tooltip,
  Statistic,
  Row,
  Col,
  Tabs
} from 'antd'
import { 
  NodeIndexOutlined, 
  FullscreenOutlined,
  ReloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  HomeOutlined,
  SearchOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { getGraphData, expandNode, getRootNodes, searchNodes, type GraphData, type RootNode, type GraphNode } from '@/services/api'
import { LoadingSpinner } from '@/components/common/Loading'
import CytoscapeGraph, { type CytoscapeGraphRef } from '@/components/graph/CytoscapeGraph'
import VirtualizedCytoscapeGraph from '@/components/graph/VirtualizedCytoscapeGraph'
import { GraphAnalysis } from '@/components/analysis/GraphAnalysis'
import { getModulePreferences, saveModulePreferences } from '@/utils/preferences'

const { Option } = Select

const Explorer: React.FC = () => {
  const navigate = useNavigate()
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  // 从用户偏好设置加载初始值
  const explorerPrefs = getModulePreferences('explorer')
  const [layout, setLayout] = useState<'dagre' | 'breadthfirst' | 'grid' | 'circle'>(explorerPrefs.layout)
  const [rootCode, setRootCode] = useState<string | undefined>(explorerPrefs.defaultRootCode)
  const [depth, setDepth] = useState<number>(explorerPrefs.depth)
  const [limit, setLimit] = useState<number>(explorerPrefs.limit)
  const [rootNodes, setRootNodes] = useState<RootNode[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)
  const [levelFilter, setLevelFilter] = useState<number | undefined>(undefined)
  const [codePrefixFilter, setCodePrefixFilter] = useState<string>('')
  const [quickSearchTerm, setQuickSearchTerm] = useState<string>('')
  const graphRef = useRef<CytoscapeGraphRef>(null)

  // 加载根节点列表
  useEffect(() => {
    const fetchRootNodes = async () => {
      try {
        const roots = await getRootNodes()
        setRootNodes(roots)
      } catch (err) {
        console.error('加载根节点失败:', err)
      }
    }
    fetchRootNodes()
  }, [])

  // 加载图谱数据
  const loadGraph = useCallback(async (code?: string) => {
    console.log('📥 开始加载图谱数据')
    console.log('参数:', { code, depth, limit })
    setLoading(true)
    setError(null)
    setSelectedNode(null)

    try {
      const data = await getGraphData(code, depth, limit)
      console.log('✅ 图谱数据加载成功')
      console.log('数据详情:', {
        节点数: data.nodeCount,
        边数: data.edgeCount,
        实际节点数组长度: data.nodes?.length || 0,
        实际边数组长度: data.edges?.length || 0,
        前3个节点: data.nodes?.slice(0, 3),
        前3条边: data.edges?.slice(0, 3)
      })
      setGraphData(data)
      message.success(`加载成功：${data.nodeCount} 个节点，${data.edgeCount} 条边`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载图谱数据失败'
      console.error('❌ 图谱数据加载失败:', err)
      setError(errorMessage)
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [depth, limit])

  // 展开节点
  const expandNodeData = useCallback(async (node: GraphNode) => {
    setLoading(true)
    setError(null)

    try {
      const data = await expandNode(node.code, 1, 50)
      
      // 合并到现有图谱数据
      if (graphData) {
        const existingNodeIds = new Set(graphData.nodes.map(n => n.id))
        const existingEdgeIds = new Set(graphData.edges.map(e => e.id))
        
        const newNodes = data.nodes.filter(n => !existingNodeIds.has(n.id))
        const newEdges = data.edges.filter(e => !existingEdgeIds.has(e.id))
        
        setGraphData({
          nodes: [...graphData.nodes, ...newNodes],
          edges: [...graphData.edges, ...newEdges],
          nodeCount: graphData.nodes.length + newNodes.length,
          edgeCount: graphData.edges.length + newEdges.length
        })
        
        message.success(`展开节点：新增 ${newNodes.length} 个节点`)
      } else {
        setGraphData(data)
        message.success(`加载成功：${data.nodeCount} 个节点`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '展开节点失败'
      setError(errorMessage)
      message.error(errorMessage)
      console.error('展开节点失败:', err)
    } finally {
      setLoading(false)
    }
  }, [graphData])

  // 节点点击事件
  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node)
    message.info(`选中节点：${node.name || node.code}`)
  }

  // 节点双击事件
  const handleNodeDoubleClick = (node: GraphNode) => {
    navigate(`/nodes/${node.code}`)
  }

  // 重置视图
  const resetView = () => {
    setGraphData(null)
    setRootCode(undefined)
    setSelectedNode(null)
    setSearchQuery('')
    setQuickSearchTerm('')
  }

  // 快捷键支持（只在图谱加载时生效）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果用户在输入框中输入，不触发快捷键
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Ctrl/Cmd + Plus 或 Ctrl/Cmd + = 放大
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=' || e.keyCode === 187)) {
        e.preventDefault()
        if (graphRef.current && graphData) {
          graphRef.current.zoomIn()
          message.success('放大', 0.5)
        }
      }
      // Ctrl/Cmd + Minus 缩小
      else if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.keyCode === 189)) {
        e.preventDefault()
        if (graphRef.current && graphData) {
          graphRef.current.zoomOut()
          message.success('缩小', 0.5)
        }
      }
      // Ctrl/Cmd + 0 重置缩放
      else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        if (graphRef.current && graphData) {
          graphRef.current.resetZoom()
          message.success('重置缩放', 0.5)
        }
      }
      // Ctrl/Cmd + F 适应窗口
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        if (graphRef.current && graphData) {
          graphRef.current.fit()
          message.success('适应窗口', 0.5)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [graphData])

  // 快速搜索节点（用于加载知识图谱）
  const handleQuickSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      message.warning('请输入搜索关键词')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await searchNodes(term, undefined, 20)
      
      if (result.data.length === 0) {
        message.info(`未找到与"${term}"相关的节点`)
      } else {
        message.success(`找到 ${result.total} 个相关节点`)
        // 自动加载第一个结果的知识图谱
        if (result.data.length > 0) {
          const firstNode = result.data[0]
          setRootCode(firstNode.code)
          await loadGraph(firstNode.code)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '搜索失败'
      setError(errorMessage)
      message.error(errorMessage)
      console.error('搜索失败:', err)
    } finally {
      setLoading(false)
    }
  }, [loadGraph])

  return (
    <div className="page-wrapper flex flex-col" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-white font-bold text-xl">探</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2 leading-tight">
              知识图谱探索器
            </h1>
            <p className="text-sm text-gray-500 mb-3 leading-tight">少纳言中医知识图谱</p>
            <p className="text-gray-600 leading-relaxed">
              从 Neo4j 数据库直接映射知识图谱，支持交互式探索和可视化
              <span className="ml-2 text-xs text-gray-500">
                （快捷键：Ctrl/Cmd + +/- 缩放，Ctrl/Cmd + 0 重置，Ctrl/Cmd + F 适应窗口）
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 快速搜索 */}
      <Card className="mb-4">
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="快速搜索（例如：脾虚）"
            prefix={<SearchOutlined />}
            value={quickSearchTerm}
            onChange={(e) => setQuickSearchTerm(e.target.value)}
            onPressEnter={() => handleQuickSearch(quickSearchTerm)}
            allowClear
          />
          <Button
            type="primary"
            onClick={() => handleQuickSearch(quickSearchTerm)}
            loading={loading}
          >
            搜索并加载图谱
          </Button>
          <Button onClick={() => handleQuickSearch('脾虚')}>
            脾虚知识图谱
          </Button>
        </Space.Compact>
      </Card>

      {/* 控制面板 */}
      <Card className="mb-4">
        <Row gutter={16} align="middle">
          <Col span={5}>
            <Select
              placeholder="选择根节点"
              style={{ width: '100%' }}
              value={rootCode}
              onChange={(value) => {
                setRootCode(value)
                if (value) {
                  loadGraph(value)
                }
              }}
              showSearch
              filterOption={(input, option) => {
                const label = String(option?.label ?? '')
                return label.toLowerCase().includes(input.toLowerCase())
              }}
            >
              {rootNodes.map(node => (
                <Option key={node.code} value={node.code} label={node.name}>
                  {node.code} - {node.name}
                </Option>
              ))}
            </Select>
          </Col>

          <Col span={3}>
            <Select
              value={layout}
              onChange={(value) => {
                setLayout(value)
                saveModulePreferences('explorer', { layout: value })
              }}
              style={{ width: '100%' }}
            >
              <Option value="dagre">层次布局</Option>
              <Option value="breadthfirst">广度优先</Option>
              <Option value="grid">网格布局</Option>
              <Option value="circle">圆形布局</Option>
            </Select>
          </Col>

          <Col span={2}>
            <Input
              type="number"
              placeholder="深度"
              value={depth}
              onChange={(e) => {
                const newDepth = parseInt(e.target.value) || 2
                setDepth(newDepth)
                saveModulePreferences('explorer', { depth: newDepth })
              }}
              min={1}
              max={5}
            />
          </Col>

          <Col span={2}>
            <Input
              type="number"
              placeholder="限制"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
              min={10}
              max={500}
            />
          </Col>

          <Col span={3}>
            <Select
              placeholder="类别筛选"
              style={{ width: '100%' }}
              value={categoryFilter}
              onChange={setCategoryFilter}
              allowClear
            >
              <Option value="疾病类">疾病类</Option>
              <Option value="证候类">证候类</Option>
            </Select>
          </Col>

          <Col span={2}>
            <Select
              placeholder="层级"
              style={{ width: '100%' }}
              value={levelFilter}
              onChange={setLevelFilter}
              allowClear
            >
              <Option value={1}>L1</Option>
              <Option value={2}>L2</Option>
              <Option value={3}>L3</Option>
              <Option value={4}>L4</Option>
              <Option value={5}>L5</Option>
            </Select>
          </Col>

          <Col span={3}>
            <Input
              placeholder="代码前缀"
              value={codePrefixFilter}
              onChange={(e) => setCodePrefixFilter(e.target.value)}
              allowClear
            />
          </Col>

          <Col span={8}>
            <Space>
              <Button
                type="primary"
                icon={<NodeIndexOutlined />}
                onClick={() => loadGraph(rootCode)}
                loading={loading}
              >
                加载图谱
              </Button>

              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadGraph(rootCode)}
                loading={loading}
              >
                刷新
              </Button>

              <Button
                icon={<HomeOutlined />}
                onClick={resetView}
              >
                重置
              </Button>

              <Button.Group>
                <Tooltip title="放大 (Ctrl/Cmd + +)">
                  <Button
                    icon={<ZoomInOutlined />}
                    onClick={() => graphRef.current?.zoomIn()}
                    disabled={!graphData}
                  />
                </Tooltip>
                <Tooltip title="缩小 (Ctrl/Cmd + -)">
                  <Button
                    icon={<ZoomOutOutlined />}
                    onClick={() => graphRef.current?.zoomOut()}
                    disabled={!graphData}
                  />
                </Tooltip>
                <Tooltip title="重置缩放 (Ctrl/Cmd + 0)">
                  <Button
                    icon={<HomeOutlined />}
                    onClick={() => graphRef.current?.resetZoom()}
                    disabled={!graphData}
                  />
                </Tooltip>
                <Tooltip title="适应窗口 (Ctrl/Cmd + F)">
                  <Button
                    icon={<FullscreenOutlined />}
                    onClick={() => graphRef.current?.fit()}
                    disabled={!graphData}
                  />
                </Tooltip>
              </Button.Group>

              <Button.Group>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    if (!graphData) {
                      message.warning('请先加载图谱数据')
                      return
                    }
                    
                    // 导出为JSON
                    const exportData = {
                      nodes: graphData.nodes.map(node => ({
                        id: node.id,
                        code: node.code,
                        name: node.name || node.label,
                        category: node.category,
                        level: node.level
                      })),
                      edges: graphData.edges.map(edge => ({
                        id: edge.id,
                        source: edge.source,
                        target: edge.target,
                        type: edge.type
                      })),
                      metadata: {
                        nodeCount: graphData.nodeCount,
                        edgeCount: graphData.edgeCount,
                        rootCode: rootCode,
                        depth: depth,
                        limit: limit,
                        exportTime: new Date().toISOString()
                      }
                    }
                    
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.download = `graph-export-${rootCode || 'all'}-${Date.now()}.json`
                    link.href = url
                    link.click()
                    URL.revokeObjectURL(url)
                    message.success('图谱数据导出成功')
                  }}
                  disabled={!graphData}
                >
                  导出JSON
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    if (!graphData) {
                      message.warning('请先加载图谱数据')
                      return
                    }
                    graphRef.current?.exportPNG(`graph-${rootCode || 'all'}-${Date.now()}.png`)
                    message.success('图谱图片导出成功')
                  }}
                  disabled={!graphData}
                >
                  导出PNG
                </Button>
              </Button.Group>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 节点搜索和图谱分析 */}
      <Card className="mb-4">
        <Tabs
          defaultActiveKey="search"
          items={[
            {
              key: 'search',
              label: (
                <span>
                  <SearchOutlined /> 节点搜索
                </span>
              ),
              children: (
                <Input
                  placeholder="搜索节点（按名称或代码）..."
                  prefix={<SearchOutlined />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                  style={{ width: '100%' }}
                />
              )
            },
            {
              key: 'analysis',
              label: (
                <span>
                  <NodeIndexOutlined /> 图谱分析
                </span>
              ),
              children: (
                <GraphAnalysis selectedNodeCode={selectedNode?.code} />
              )
            }
          ]}
        />
      </Card>

      {/* 错误提示 */}
      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      {/* 图谱可视化 - 支持多种可视化方式 */}
      <Card style={{ height: 'calc(100vh - 300px)', minHeight: '700px' }}>
        {loading ? (
          <LoadingSpinner />
        ) : !graphData ? (
          <Empty
            description='请选择根节点并点击"加载图谱"按钮开始可视化'
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<NodeIndexOutlined />}
              onClick={() => loadGraph()}
              loading={loading}
            >
              加载根节点图谱
            </Button>
          </Empty>
        ) : (
          <>
            {/* 统计信息 */}
            <Row gutter={16} className="mb-4">
              <Col span={6}>
                <Statistic 
                  title="节点数量" 
                  value={graphData.nodeCount} 
                  prefix={<NodeIndexOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="关系数量" 
                  value={graphData.edgeCount} 
                  prefix={<NodeIndexOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="当前布局" 
                  value={layout === 'dagre' ? '层次' : layout === 'breadthfirst' ? '广度优先' : layout === 'grid' ? '网格' : '圆形'}
                />
              </Col>
              {selectedNode && (
                <Col span={6}>
                  <Statistic 
                    title="选中节点" 
                    value={selectedNode.name || selectedNode.code}
                    valueStyle={{ fontSize: 14 }}
                  />
                </Col>
              )}
            </Row>

            {/* 图谱可视化 */}
            <div style={{ width: '100%', height: 'calc(100vh - 400px)', minHeight: '650px', position: 'relative' }}>
              {/* 根据节点数量自动选择使用虚拟渲染或普通渲染 */}
              {graphData.nodes.length > 200 ? (
                <VirtualizedCytoscapeGraph
                  nodes={graphData.nodes}
                  edges={graphData.edges}
                  layout={layout}
                  onNodeClick={handleNodeClick}
                  onNodeDoubleClick={handleNodeDoubleClick}
                  searchQuery={searchQuery}
                  categoryFilter={categoryFilter}
                  levelFilter={levelFilter}
                  codePrefixFilter={codePrefixFilter}
                  style={{ width: '100%', height: '100%', minHeight: '650px' }}
                  virtualRenderThreshold={200}
                  visibleRange={150}
                />
              ) : (
                <CytoscapeGraph
                  ref={graphRef}
                  nodes={graphData.nodes}
                  edges={graphData.edges}
                  layout={layout}
                  onNodeClick={handleNodeClick}
                  onNodeDoubleClick={handleNodeDoubleClick}
                  searchQuery={searchQuery}
                  categoryFilter={categoryFilter}
                  levelFilter={levelFilter}
                  codePrefixFilter={codePrefixFilter}
                  style={{ width: '100%', height: '100%', minHeight: '650px' }}
                />
              )}
              
              {/* 操作提示 */}
              {selectedNode && (
                <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="text-sm">
                    <div className="font-bold mb-2">选中节点</div>
                    <div>代码: {selectedNode.code}</div>
                    <div>名称: {selectedNode.name}</div>
                    <div>类别: {selectedNode.category}</div>
                    <div className="mt-2">
                      <Button
                        size="small"
                        onClick={() => navigate(`/nodes/${selectedNode.code}`)}
                        className="mr-2"
                      >
                        查看详情
                      </Button>
                      <Button
                        size="small"
                        onClick={() => expandNodeData(selectedNode)}
                        loading={loading}
                      >
                        展开节点
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export default Explorer
