import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Button, 
  Select, 
  Input, 
  Alert, 
  Empty,
  message,
  Tooltip,
  Statistic,
  Dropdown
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
  FileTextOutlined,
  FileImageOutlined,
  ClearOutlined
} from '@ant-design/icons'
import { getGraphData, expandNode, getRootNodes, searchNodes, type GraphData, type RootNode, type GraphNode } from '@/services/api'
import { LoadingSpinner } from '@/components/common/Loading'
import CytoscapeGraph, { type CytoscapeGraphRef } from '@/components/graph/CytoscapeGraph'
import VirtualizedCytoscapeGraph from '@/components/graph/VirtualizedCytoscapeGraph'
import ForceGraph, { type ForceGraphRef } from '@/components/graph/ForceGraph'
import Graph3D from '@/components/graph/Graph3D'
import PathFinder from '@/components/graph/PathFinder'
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
  const [layout, setLayout] = useState<'dagre' | 'breadthfirst' | 'grid' | 'circle'>(explorerPrefs.layout || 'dagre')
  const [viewMode, setViewMode] = useState<'cytoscape' | 'force' | '3d'>(explorerPrefs.viewMode || 'cytoscape')
  const [rootCode, setRootCode] = useState<string | undefined>(explorerPrefs.defaultRootCode)
  const [depth, setDepth] = useState<number>(explorerPrefs.depth || 2)
  const [limit, setLimit] = useState<number>(explorerPrefs.limit || 100)
  const [rootNodes, setRootNodes] = useState<RootNode[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)
  const [levelFilter, setLevelFilter] = useState<number | undefined>(undefined)
  const [codePrefixFilter, setCodePrefixFilter] = useState<string>('')
  const [quickSearchTerm, setQuickSearchTerm] = useState<string>('')
  const [viewMode, setViewMode] = useState<'cytoscape' | 'force' | '3d'>('cytoscape')
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [highlightedPath, setHighlightedPath] = useState<string[]>([])
  const graphRef = useRef<CytoscapeGraphRef>(null)
  const forceGraphRef = useRef<ForceGraphRef>(null)

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
    graphRef.current?.resetZoom()
  }

  // 重置所有参数
  const resetAll = () => {
    setGraphData(null)
    setRootCode(undefined)
    setSelectedNode(null)
    setSearchQuery('')
    setQuickSearchTerm('')
    setCategoryFilter(undefined)
    setLevelFilter(undefined)
    setCodePrefixFilter('')
    graphRef.current?.resetZoom()
    message.success('已重置所有参数')
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
    <div className="linear-page explorer-linear-page">
      <div className="linear-page-hero">
        <div>
          <p className="eyebrow">Graph Explorer</p>
          <h1>知识图谱探索器</h1>
          <p>少纳言中医知识图谱 · Neo4j 实时驱动</p>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px' }}>
            快捷键：Ctrl/Cmd + +/- 缩放 · Ctrl/Cmd + 0 重置 · Ctrl/Cmd + F 适应窗口
          </p>
        </div>
        <div className="linear-page-hero__actions">
          <Button icon={<ReloadOutlined />} onClick={() => loadGraph(rootCode)} loading={loading}>
            刷新图谱
          </Button>
        </div>
      </div>

      <div className="linear-pill-row">
        <span>当前根节点：{rootCode || '未选择'}</span>
        <span>深度：{depth}</span>
        <span>节点限制：{limit}</span>
        <span>已加载节点：{graphData?.nodeCount ?? '-'}</span>
      </div>

      <section className="explorer-panels-grid">
        <div className="linear-panel explorer-panel explorer-panel--controls">
          <header>
            <div>
              <p className="eyebrow">快速搜索</p>
              <h4>节点定位</h4>
            </div>
          </header>
          <div className="linear-form-group">
            <Input
              placeholder="快速搜索（例如：脾虚）"
              prefix={<SearchOutlined />}
              value={quickSearchTerm}
              onChange={(e) => setQuickSearchTerm(e.target.value)}
              onPressEnter={() => handleQuickSearch(quickSearchTerm)}
              allowClear
              size="large"
            />
            <div className="linear-form-actions">
              <Button
                type="primary"
                size="large"
                onClick={() => handleQuickSearch(quickSearchTerm)}
                loading={loading}
                icon={<SearchOutlined />}
              >
                搜索并加载
              </Button>
              <Button 
                size="large"
                onClick={() => handleQuickSearch('脾虚')}
              >
                示例：脾虚
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="linear-panel explorer-panel explorer-panel--controls">
        <header>
          <div>
            <p className="eyebrow">图谱控制台</p>
            <h4>参数配置</h4>
          </div>
          <Tooltip title="重置所有参数并清空图谱">
            <Button icon={<ClearOutlined />} onClick={resetAll} type="text" size="small" />
          </Tooltip>
        </header>
        <div className="linear-form-group">
          <label>根节点选择</label>
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
          <div className="linear-form-actions">
            <Button
              type="primary"
              icon={<NodeIndexOutlined />}
              onClick={() => loadGraph(rootCode)}
              loading={loading}
            >
              加载图谱
            </Button>
            <Button
              icon={<SearchOutlined />}
              onClick={() => handleQuickSearch(quickSearchTerm)}
              loading={loading}
            >
              快速搜索
            </Button>
          </div>
        </div>

        <div className="linear-form-group">
          <label>视图模式</label>
          <Select
            value={viewMode}
            onChange={(value) => {
              setViewMode(value)
              saveModulePreferences('explorer', { viewMode: value })
            }}
            style={{ width: '100%' }}
            size="large"
          >
            <Option value="cytoscape">Cytoscape（经典布局）</Option>
            <Option value="force">力导向图（D3）</Option>
            <Option value="3d">3D可视化</Option>
          </Select>
        </div>

        {viewMode === 'cytoscape' && (
          <div className="linear-form-group">
            <label>布局与参数</label>
            <div className="linear-form-row">
              <Select
                value={layout}
                onChange={(value) => {
                  setLayout(value)
                  saveModulePreferences('explorer', { layout: value })
                }}
                style={{ flex: 1 }}
              >
                <Option value="dagre">层次布局</Option>
                <Option value="breadthfirst">广度优先</Option>
                <Option value="grid">网格布局</Option>
                <Option value="circle">圆形布局</Option>
              </Select>
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
          <div className="linear-form-row">
            <Select
              placeholder="类别筛选"
              style={{ flex: 1 }}
              value={categoryFilter}
              onChange={setCategoryFilter}
              allowClear
            >
              <Option value="疾病类">疾病类</Option>
              <Option value="证候类">证候类</Option>
            </Select>
            <Select
              placeholder="层级筛选"
              style={{ flex: 1 }}
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
            <Input
              placeholder="代码前缀"
              value={codePrefixFilter}
              onChange={(e) => setCodePrefixFilter(e.target.value)}
              style={{ flex: 1 }}
              allowClear
            />
            </div>
          </div>
        )}

        <div className="linear-form-group">
          <label>视图操作</label>
          <div className="linear-form-actions">
            {viewMode === 'cytoscape' && (
              <>
                <Button icon={<ZoomInOutlined />} onClick={() => graphRef.current?.zoomIn()}>
                  放大
                </Button>
                <Button icon={<ZoomOutOutlined />} onClick={() => graphRef.current?.zoomOut()}>
                  缩小
                </Button>
                <Button icon={<HomeOutlined />} onClick={() => graphRef.current?.resetZoom()}>
                  重置
                </Button>
                <Button icon={<FullscreenOutlined />} onClick={() => graphRef.current?.fit()}>
                  适应
                </Button>
              </>
            )}
            {viewMode === 'force' && (
              <>
                <Button icon={<ZoomInOutlined />} onClick={() => forceGraphRef.current?.zoomIn()}>
                  放大
                </Button>
                <Button icon={<ZoomOutOutlined />} onClick={() => forceGraphRef.current?.zoomOut()}>
                  缩小
                </Button>
                <Button icon={<HomeOutlined />} onClick={() => forceGraphRef.current?.resetZoom()}>
                  重置
                </Button>
                <Button icon={<FullscreenOutlined />} onClick={() => forceGraphRef.current?.fit()}>
                  适应
                </Button>
              </>
            )}
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'json',
                    label: '导出为JSON',
                    icon: <FileTextOutlined />,
                    onClick: () => {
                      if (!graphData) {
                        message.warning('请先加载图谱数据')
                        return
                      }
                      const exportData = {
                        nodes: graphData.nodes.map((node: any) => ({
                          id: node.id,
                          code: node.code,
                          name: node.name || node.label,
                          category: node.category,
                          level: node.level
                        })),
                        edges: graphData.edges.map((edge: any) => ({
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
                    }
                  },
                  {
                    key: 'png',
                    label: '导出为PNG',
                    icon: <FileImageOutlined />,
                    onClick: () => {
                      if (!graphData) {
                        message.warning('请先加载图谱数据')
                        return
                      }
                      graphRef.current?.exportPNG(`graph-${rootCode || 'all'}-${Date.now()}.png`)
                      message.success('图谱图片导出成功')
                    }
                  }
                ]
              }}
              placement="bottomRight"
            >
              <Button icon={<DownloadOutlined />}>导出</Button>
            </Dropdown>
          </div>
        </div>
      </div>

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '24px' }}
        />
      )}

      <div className="linear-panel explorer-panel explorer-panel--graph">
        <header>
          <div>
            <p className="eyebrow">图谱视图</p>
            <h4>可视化展示</h4>
          </div>
          {selectedNode && (
            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
              选中：{selectedNode.name || selectedNode.code}
            </div>
          )}
        </header>
        <div className="explorer-graph-container">
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
                onClick={() => loadGraph(rootCode)}
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
                title="视图模式" 
                value={viewMode === 'cytoscape' ? 'Cytoscape' : viewMode === 'force' ? '力导向图' : '3D可视化'}
                valueStyle={{ fontSize: '18px' }}
              />
              {viewMode === 'cytoscape' && (
                <Statistic 
                  title="当前布局" 
                  value={layout === 'dagre' ? '层次' : layout === 'breadthfirst' ? '广度优先' : layout === 'grid' ? '网格' : '圆形'}
                  valueStyle={{ fontSize: '18px' }}
                />
              )}
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
              {viewMode === '3d' ? (
                <Graph3D
                  nodes={graphData.nodes}
                  edges={graphData.edges}
                  onNodeClick={handleNodeClick}
                  onNodeHover={setHoveredNode}
                  searchQuery={searchQuery}
                  categoryFilter={categoryFilter}
                  levelFilter={levelFilter}
                  codePrefixFilter={codePrefixFilter}
                  style={{ width: '100%', height: '100%', minHeight: '600px' }}
                />
              ) : viewMode === 'force' ? (
                <ForceGraph
                  ref={forceGraphRef}
                  nodes={graphData.nodes}
                  edges={graphData.edges}
                  onNodeClick={handleNodeClick}
                  onNodeDoubleClick={handleNodeDoubleClick}
                  onNodeHover={setHoveredNode}
                  searchQuery={searchQuery}
                  categoryFilter={categoryFilter}
                  levelFilter={levelFilter}
                  codePrefixFilter={codePrefixFilter}
                  style={{ width: '100%', height: '100%', minHeight: '600px' }}
                />
              ) : graphData.nodes.length > 200 ? (
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
        </div>
      </div>
    </div>
  )
}

export default Explorer
