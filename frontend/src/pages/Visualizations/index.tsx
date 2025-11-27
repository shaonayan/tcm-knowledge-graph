import React, { useState, useEffect } from 'react'
import {
  Card,
  Tabs,
  Space,
  Button,
  Select,
  InputNumber,
  message,
  AutoComplete,
  Statistic,
  Row,
  Col,
  Tag
} from 'antd'
import {
  ExperimentOutlined,
  RocketOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  DatabaseOutlined
} from '@ant-design/icons'
import { Graph3D } from './components/Graph3D'
import { TimelineGraph } from './components/TimelineGraph'
import { EvolutionGraph } from './components/EvolutionGraph'
import { getGraphData, getRootNodes, searchNodes, RootNode } from '@/services/api'
import { LoadingSpinner } from '@/components/common/Loading'
import { PageHeader } from '@/components/common/PageHeader'

const { Option } = Select

const DISEASE_CATEGORY = '\u75be\u75c5\u7c7b'
const SYNDROME_CATEGORY = '\u8bc1\u5019\u7c7b'

export default function Visualizations() {
  const [activeTab, setActiveTab] = useState('3d')
  const [graphData, setGraphData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [rootCode, setRootCode] = useState<string>('')
  const [depth, setDepth] = useState(3)
  const [limit, setLimit] = useState(100)
  const [rootNodes, setRootNodes] = useState<RootNode[]>([])
  const [searchOptions, setSearchOptions] = useState<Array<{ value: string; label: React.ReactNode }>>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [loadingRoots, setLoadingRoots] = useState(false)

  useEffect(() => {
    const loadRootNodes = async () => {
      setLoadingRoots(true)
      try {
        const roots = await getRootNodes()
        setRootNodes(roots)
        if (roots.length > 0 && !rootCode) {
          setRootCode(roots[0].code)
          message.info(`Auto selected root node: ${roots[0].name || roots[0].code}`)
        }
      } catch (error: any) {
        console.error('Failed to load root nodes:', error)
        message.warning('Unable to load root node list, please enter a node code manually')
      } finally {
        setLoadingRoots(false)
      }
    }
    loadRootNodes()
  }, [])

  const handleSearch = async (value: string) => {
    if (!value || value.length < 1) {
      setSearchOptions([])
      return
    }

    setSearchLoading(true)
    try {
      const result = await searchNodes(value, undefined, 10)
      const options = result.data.map(node => ({
        value: node.code,
        label: (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{node.name || node.code}</span>
            <Tag color={node.category === DISEASE_CATEGORY ? 'blue' : 'green'} style={{ marginLeft: 8 }}>
              {node.category}
            </Tag>
          </div>
        )
      }))
      setSearchOptions(options)
    } catch (error: any) {
      console.error('Search failed:', error)
      setSearchOptions([])
    } finally {
      setSearchLoading(false)
    }
  }

  const loadGraphData = async () => {
    if (!rootCode || rootCode.trim() === '') {
      message.warning('请选择或输入根节点代码')
      return
    }

    setLoading(true)
    try {
      const data = await getGraphData(rootCode.trim(), depth, limit)
      if (!data || !data.nodes || data.nodes.length === 0) {
        message.warning('未找到数据，请尝试其他根节点或调整参数')
        setGraphData(null)
        return
      }
      setGraphData(data)
      message.success(`图谱数据加载成功：${data.nodeCount || data.nodes.length} 个节点，${data.edgeCount || data.edges.length} 条边`)
    } catch (error: any) {
      console.error('Failed to load graph data:', error)
      const errorMsg = error.message || '未知错误'
      message.error(`加载图谱数据失败: ${errorMsg}`)
      setGraphData(null)
    } finally {
      setLoading(false)
    }
  }

  const quickSelectNodes = [
    { code: 'A01', name: 'A01 - 外感病证' },
    { code: 'B04', name: 'B04 - 气血津液病证' },
    { code: 'B04.03.01.03.', name: 'B04.03.01.03. - 脾虚' }
  ]

  return (
    <div className="page-wrapper visualizations-human-shell" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <PageHeader
        icon={<ExperimentOutlined />}
        title="高级可视化"
        subtitle="图谱实验室 · 3D / Timeline / Evolution"
        description="在一个舞台上切换多种视角：3D 图谱漫游、时间线剖面、节点演化推演。"
      />

      <div className="visualizations-meta-row">
        <span>根节点：{rootCode || '未选择'}</span>
        <span>深度 {depth}</span>
        <span>节点限制 {limit}</span>
        <span>加载状态：{loading ? '运行中' : '就绪'}</span>
      </div>

      <section className="visualizations-grid">
        <Card className="visualizations-panel" bodyStyle={{ padding: 24 }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div className="visualizations-panel__controls">
              <div className="visualizations-field">
                <label>根节点</label>
                <AutoComplete
                  style={{ width: '100%' }}
                  value={rootCode}
                  onChange={setRootCode}
                  onSearch={handleSearch}
                  options={searchOptions}
                  placeholder="搜索节点代码或名称"
                  notFoundContent={searchLoading ? '搜索中…' : '未找到节点，请尝试其他关键词'}
                  filterOption={false}
                  allowClear
                />
              </div>
              <div className="visualizations-field">
                <label>或从列表选择</label>
                <Select
                  showSearch
                  allowClear
                  loading={loadingRoots}
                  placeholder="选择根节点"
                  value={rootCode}
                  onChange={setRootCode}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    String(option?.children ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {rootNodes.map(node => (
                    <Option key={node.code} value={node.code}>
                      {node.name || node.code}
                      <Tag color={node.category === DISEASE_CATEGORY ? 'blue' : 'green'} style={{ marginLeft: 8 }}>
                        {node.category}
                      </Tag>
                    </Option>
                  ))}
                </Select>
              </div>
              <div className="visualizations-field--compact">
                <label>深度</label>
                <InputNumber min={1} max={5} value={depth} onChange={val => setDepth(val || 3)} />
              </div>
              <div className="visualizations-field--compact">
                <label>节点限制</label>
                <InputNumber min={10} max={500} value={limit} onChange={val => setLimit(val || 100)} />
              </div>
              <Button type="primary" icon={<ReloadOutlined />} onClick={loadGraphData} loading={loading}>
                加载图谱
              </Button>
            </div>

            <div className="visualizations-quick-row">
              <label>快速选择</label>
              <Space wrap>
                {quickSelectNodes.map(node => (
                  <Button
                    key={node.code}
                    size="small"
                    type={rootCode === node.code ? 'primary' : 'default'}
                    onClick={() => {
                      setRootCode(node.code)
                      message.info(`已选择: ${node.name}`)
                    }}
                  >
                    {node.name}
                  </Button>
                ))}
              </Space>
            </div>
          </Space>
        </Card>

        <Card className="visualizations-panel visualizations-panel--stats" bodyStyle={{ padding: 24 }}>
          <p className="eyebrow">数值脉络</p>
          <h3>图谱规模</h3>
          <div className="visualizations-stat-grid">
            {[
              { label: '节点总数', value: graphData?.nodeCount || graphData?.nodes?.length || 0 },
              { label: '边总数', value: graphData?.edgeCount || graphData?.edges?.length || 0 },
              {
                label: '疾病类节点',
                value: graphData?.nodes?.filter((n: any) => n.category === DISEASE_CATEGORY).length || 0
              },
              {
                label: '证候类节点',
                value: graphData?.nodes?.filter((n: any) => n.category === SYNDROME_CATEGORY).length || 0
              }
            ].map(item => (
              <div key={item.label} className="visualizations-stat-card">
                <p>{item.label}</p>
                <h4>{item.value.toLocaleString()}</h4>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="visualizations-panel visualizations-tabs-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: '3d',
              label: (
                <span>
                  <ExperimentOutlined /> 3D 图谱视图
                </span>
              ),
              children: (
                <div style={{ height: '700px' }}>
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <LoadingSpinner />
                    </div>
                  ) : graphData ? (
                    <Graph3D data={graphData} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <p className="text-gray-500 mb-4">请先加载图谱数据</p>
                        <Button type="primary" onClick={loadGraphData} disabled={!rootCode}>
                          加载图谱
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'timeline',
              label: (
                <span>
                  <ClockCircleOutlined /> 时间线图谱
                </span>
              ),
              children: (
                <div style={{ height: '700px' }}>
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <LoadingSpinner />
                    </div>
                  ) : graphData ? (
                    <TimelineGraph data={graphData} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <p className="text-gray-500 mb-4">请先加载图谱数据</p>
                        <Button type="primary" onClick={loadGraphData} disabled={!rootCode}>
                          加载图谱
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'evolution',
              label: (
                <span>
                  <RocketOutlined /> 动态演化展示
                </span>
              ),
              children: (
                <div style={{ height: '700px' }}>
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <LoadingSpinner />
                    </div>
                  ) : graphData ? (
                    <EvolutionGraph data={graphData} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <p className="text-gray-500 mb-4">请先加载图谱数据</p>
                        <Button type="primary" onClick={loadGraphData} disabled={!rootCode}>
                          加载图谱
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  )
}
