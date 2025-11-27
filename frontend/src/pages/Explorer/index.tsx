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
    <div className="page-wrapper" style={{ minHeight: 'calc(100vh - 72px)' }}>
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105" style={{
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3), 0 1px 0 rgba(255, 255, 255, 0.3) inset'
          }} />
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{
              letterSpacing: '-0.02em',
              fontWeight: 700
            }}>
              知识图谱探索器
            </h1>
            <p className="text-sm text-gray-500 mb-2" style={{
              letterSpacing: '-0.01em'
            }}>少纳言中医知识图谱</p>
            <p className="text-xs text-gray-400" style={{
              letterSpacing: '-0.01em'
            }}>
              快捷键：Ctrl/Cmd + +/- 缩放，Ctrl/Cmd + 0 重置，Ctrl/Cmd + F 适应窗口
            </p>
          </div>
        </div>
      </div>

      {/* 快速搜索区域 */}
      <Card className="mb-5 glass-panel" style={{ padding: '20px' }}>
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <Input
              placeholder="快速搜索（例如：脾虚）"
              prefix={<SearchOutlined />}
              value={quickSearchTerm}
              onChange={(e) => setQuickSearchTerm(e.target.value)}
              onPressEnter={() => handleQuickSearch(quickSearchTerm)}
              allowClear
              size="large"
              style={{
                borderRadius: '12px',
                fontSize: '15px'
              }}
            />
          </div>
          <Button
            type="primary"
            size="large"
            onClick={() => handleQuickSearch(quickSearchTerm)}
            loading={loading}
            icon={<SearchOutlined />}
            style={{
              borderRadius: '12px',
              fontWeight: 500,
              letterSpacing: '-0.01em'
            }}
          >
            搜索并加载
          </Button>
          <Button 
            size="large"
            onClick={() => handleQuickSearch('脾虚')}
            style={{
              borderRadius: '12px',
              fontWeight: 500,
              letterSpacing: '-0.01em'
            }}
          >
            示例：脾虚
          </Button>
        </div>
      </Card>

      {/* 主控制面板 */}
      <Card className="mb-5 glass-panel" style={{ padding: '24px' }}>
        <div className="space-y-5">
          {/* 第一行：根节点选择和主要操作 */}
          <div className="flex gap-3 items-center flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <Select
                placeholder="选择根节点"
                style={{ width: '100%' }}
                size="large"
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
            </div>
            <Button
              type="primary"
              size="large"
              icon={<NodeIndexOutlined />}
              onClick={() => loadGraph(rootCode)}
              loading={loading}
            >
              加载图谱
            </Button>
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => loadGraph(rootCode)}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              size="large"
              icon={<HomeOutlined />}
              onClick={resetView}
            >
              重置
            </Button>
          </div>

          {/* 第二行：布局和参数设置 */}
          <div className="flex gap-3 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">布局：</span>
              <Select
                value={layout}
                onChange={(value) => {
                  setLayout(value)
                  saveModulePreferences('explorer', { layout: value })
                }}
                style={{ width: 120 }}
              >
                <Option value="dagre">层次布局</Option>
                <Option value="breadthfirst">广度优先</Option>
                <Option value="grid">网格布局</Option>
                <Option value="circle">圆形布局</Option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">深度：</span>
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
                style={{ width: 80 }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">限制：</span>
              <Input
                type="number"
                placeholder="限制"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                min={10}
                max={500}
                style={{ width: 100 }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">类别：</span>
              <Select
                placeholder="全部"
                style={{ width: 120 }}
                value={categoryFilter}
                onChange={setCategoryFilter}
                allowClear
              >
                <Option value="疾病类">疾病类</Option>
                <Option value="证候类">证候类</Option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">层级：</span>
              <Select
                placeholder="全部"
                style={{ width: 100 }}
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
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">代码前缀：</span>
              <Input
                placeholder="如：A01"
                value={codePrefixFilter}
                onChange={(e) => setCodePrefixFilter(e.target.value)}
                allowClear
                style={{ width: 120 }}
              />
            </div>
          </div>

          {/* 第三行：视图控制和导出 */}
          <div className="flex gap-3 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">视图控制：</span>
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
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">导出：</span>
              <Button.Group>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    if (!graphData) {
                      message.warning('请先加载图谱数据')
                      return
                    }
                    
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
                  JSON
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
                  PNG
                </Button>
              </Button.Group>
            </div>
          </div>
        </div>
      </Card>

      {/* 搜索和分析面板 */}
      <Card className="mb-5 glass-panel" style={{ padding: '20px' }}>
        <Tabs
          defaultActiveKey="search"
          size="large"
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
                  size="large"
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

      {/* 图谱可视化区域 */}
      <Card className="glass-panel" style={{ 
        height: 'calc(100vh - 500px)', 
        minHeight: '600px',
        padding: '24px'
      }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : !graphData ? (
          <div className="flex items-center justify-center h-full">
            <Empty
              description='请选择根节点并点击"加载图谱"按钮开始可视化'
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                size="large"
                icon={<NodeIndexOutlined />}
                onClick={() => loadGraph()}
                loading={loading}
              >
                加载根节点图谱
              </Button>
            </Empty>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* 统计信息栏 */}
            <div className="flex gap-8 items-center mb-5 pb-4 border-b" style={{
              borderColor: 'rgba(0, 0, 0, 0.06)'
            }}>
              <Statistic 
                title="节点数量" 
                value={graphData.nodeCount} 
                prefix={<NodeIndexOutlined />}
                valueStyle={{ color: '#1890ff', fontSize: '18px' }}
              />
              <Statistic 
                title="关系数量" 
                value={graphData.edgeCount} 
                prefix={<NodeIndexOutlined />}
                valueStyle={{ color: '#52c41a', fontSize: '18px' }}
              />
              <Statistic 
                title="当前布局" 
                value={layout === 'dagre' ? '层次' : layout === 'breadthfirst' ? '广度优先' : layout === 'grid' ? '网格' : '圆形'}
                valueStyle={{ fontSize: '18px' }}
              />
              {selectedNode && (
                <div className="ml-auto">
                  <div className="text-sm text-gray-500 mb-1">选中节点</div>
                  <div className="text-base font-semibold text-gray-800">
                    {selectedNode.name || selectedNode.code}
                  </div>
                </div>
              )}
            </div>

            {/* 图谱可视化容器 */}
            <div style={{ flex: 1, position: 'relative', minHeight: '500px' }}>
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
                  style={{ width: '100%', height: '100%' }}
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
                  style={{ width: '100%', height: '100%' }}
                />
              )}
              
              {/* 选中节点信息卡片 */}
              {selectedNode && (
                <div className="absolute top-6 right-6 z-10 max-w-xs" style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'saturate(180%) blur(20px)',
                  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                  padding: '20px',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 1px 0 rgba(255, 255, 255, 0.8) inset',
                  border: '1px solid rgba(255, 255, 255, 0.8)'
                }}>
                  <div className="text-sm">
                    <div className="font-bold text-base mb-4 text-gray-900" style={{
                      letterSpacing: '-0.01em'
                    }}>选中节点信息</div>
                    <div className="space-y-2 mb-4">
                      <div><span className="text-gray-500 text-xs">代码：</span><span className="font-mono text-gray-900 ml-2">{selectedNode.code}</span></div>
                      <div><span className="text-gray-500 text-xs">名称：</span><span className="text-gray-900 ml-2">{selectedNode.name}</span></div>
                      <div><span className="text-gray-500 text-xs">类别：</span><span className="text-gray-900 ml-2">{selectedNode.category}</span></div>
                      <div><span className="text-gray-500 text-xs">层级：</span><span className="text-gray-900 ml-2">L{selectedNode.level}</span></div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => navigate(`/nodes/${selectedNode.code}`)}
                        block
                        style={{
                          borderRadius: '10px',
                          fontWeight: 500
                        }}
                      >
                        查看详情
                      </Button>
                      <Button
                        size="small"
                        onClick={() => expandNodeData(selectedNode)}
                        loading={loading}
                        block
                        style={{
                          borderRadius: '10px',
                          fontWeight: 500
                        }}
                      >
                        展开节点
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Explorer
