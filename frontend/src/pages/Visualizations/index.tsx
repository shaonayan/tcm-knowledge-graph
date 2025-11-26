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
      message.warning('Please select or enter a root node code')
      return
    }

    setLoading(true)
    try {
      const data = await getGraphData(rootCode.trim(), depth, limit)
      if (!data || !data.nodes || data.nodes.length === 0) {
        message.warning('No data found, try another root node or adjust the parameters')
        setGraphData(null)
        return
      }
      setGraphData(data)
      message.success(`Graph data loaded: ${data.nodeCount || data.nodes.length} nodes, ${data.edgeCount || data.edges.length} edges`)
    } catch (error: any) {
      console.error('Failed to load graph data:', error)
      const errorMsg = error.message || 'Unknown error'
      message.error(`Failed to load graph data: ${errorMsg}`)
      setGraphData(null)
    } finally {
      setLoading(false)
    }
  }

  const quickSelectNodes = [
    { code: 'A01', name: 'A01 - External syndrome' },
    { code: 'B04', name: 'B04 - Qi & blood syndrome' },
    { code: 'B04.03.01.03.', name: 'B04.03.01.03. - Spleen deficiency' }
  ]

  return (
    <div className="page-wrapper" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <PageHeader
        title="Advanced Visualizations"
        subtitle="Shaonaoyan TCM Knowledge Graph"
        description="Explore multiple visualization forms of the knowledge graph: 3D graph, timeline, and dynamic evolution"
      />

      <Card className="mb-4 glass-panel">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space size="large" wrap>
            <div style={{ flex: 1, minWidth: 300 }}>
              <label className="mr-2">Root node:</label>
              <AutoComplete
                style={{ width: '100%' }}
                value={rootCode}
                onChange={setRootCode}
                onSearch={handleSearch}
                options={searchOptions}
                placeholder="Search node code or name"
                loading={searchLoading}
                notFoundContent={searchLoading ? 'Searching...' : 'No results, try another keyword'}
                filterOption={false}
                allowClear
              />
            </div>
            <div style={{ minWidth: 200 }}>
              <label className="mr-2">Or select from list:</label>
              <Select
                showSearch
                allowClear
                loading={loadingRoots}
                placeholder="Choose a root node"
                value={rootCode}
                onChange={setRootCode}
                style={{ width: '100%' }}
                optionFilterProp="children"
                filterOption={(input, option) => (option?.children as string)?.toLowerCase().includes(input.toLowerCase())}
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
            <div>
              <label className="mr-2">Depth:</label>
              <InputNumber min={1} max={5} value={depth} onChange={val => setDepth(val || 3)} />
            </div>
            <div>
              <label className="mr-2">Node limit:</label>
              <InputNumber min={10} max={500} value={limit} onChange={val => setLimit(val || 100)} />
            </div>
            <Button type="primary" icon={<ReloadOutlined />} onClick={loadGraphData} loading={loading}>
              Load graph
            </Button>
          </Space>

          <div>
            <label className="mr-2">Quick pick:</label>
            <Space wrap>
              {quickSelectNodes.map(node => (
                <Button
                  key={node.code}
                  size="small"
                  type={rootCode === node.code ? 'primary' : 'default'}
                  onClick={() => {
                    setRootCode(node.code)
                    message.info(`Selected: ${node.name}`)
                  }}
                >
                  {node.name}
                </Button>
              ))}
            </Space>
          </div>
        </Space>
      </Card>

      {graphData && (
        <Card className="mb-4 stats-card">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <div className="visualization-stat">
                <Statistic title="Nodes" value={graphData.nodeCount || graphData.nodes?.length || 0} prefix={<DatabaseOutlined />} valueStyle={{ color: '#ffffff' }} />
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="visualization-stat">
                <Statistic title="Edges" value={graphData.edgeCount || graphData.edges?.length || 0} prefix={<DatabaseOutlined />} valueStyle={{ color: '#ffffff' }} />
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="visualization-stat">
                <Statistic
                  title="Disease category"
                  value={graphData.nodes?.filter((n: any) => n.category === DISEASE_CATEGORY).length || 0}
                  valueStyle={{ color: '#ffffff' }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="visualization-stat">
                <Statistic
                  title="Syndrome category"
                  value={graphData.nodes?.filter((n: any) => n.category === SYNDROME_CATEGORY).length || 0}
                  valueStyle={{ color: '#ffffff' }}
                />
              </div>
            </Col>
          </Row>
        </Card>
      )}

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: '3d',
              label: (
                <span>
                  <ExperimentOutlined /> 3D graph view
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
                        <p className="text-gray-500 mb-4">Please load the graph first</p>
                        <Button type="primary" onClick={loadGraphData} disabled={!rootCode}>
                          Load graph
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
                  <ClockCircleOutlined /> Timeline view
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
                        <p className="text-gray-500 mb-4">Please load the graph first</p>
                        <Button type="primary" onClick={loadGraphData} disabled={!rootCode}>
                          Load graph
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
                  <RocketOutlined /> Dynamic evolution
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
                        <p className="text-gray-500 mb-4">Please load the graph first</p>
                        <Button type="primary" onClick={loadGraphData} disabled={!rootCode}>
                          Load graph
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
