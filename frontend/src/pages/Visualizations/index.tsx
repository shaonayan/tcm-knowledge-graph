import React, { useState, useEffect } from 'react'
import { Card, Tabs, Space, Button, Select, InputNumber, message, AutoComplete, Statistic, Row, Col, Tag } from 'antd'
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

  // 加载根节点列表
  useEffect(() => {
    const loadRootNodes = async () => {
      setLoadingRoots(true)
      try {
        const roots = await getRootNodes()
        setRootNodes(roots)
        // 设置默认根节点（如果有的话）
        if (roots.length > 0 && !rootCode) {
          setRootCode(roots[0].code)
          message.info(`已自动选择根节点: ${roots[0].name || roots[0].code}`)
        }
      } catch (error: any) {
        console.error('加载根节点失败:', error)
        message.warning('加载根节点列表失败，请手动输入节点代码')
      } finally {
        setLoadingRoots(false)
      }
    }
    loadRootNodes()
  }, [])

  // 当切换标签页时，如果已有数据，自动加载
  useEffect(() => {
    if (graphData && activeTab) {
      // 标签页切换时不需要重新加载数据
    }
  }, [activeTab])

  // 搜索节点
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
            <Tag color={node.category === '疾病类' ? 'blue' : 'green'} style={{ marginLeft: 8 }}>
              {node.category}
            </Tag>
          </div>
        )
      }))
      setSearchOptions(options)
    } catch (error: any) {
      console.error('搜索失败:', error)
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
        message.warning('未找到数据，请尝试其他根节点或调整深度/限制参数')
        setGraphData(null)
        return
      }
      setGraphData(data)
      message.success(`图谱数据加载成功：${data.nodeCount || data.nodes.length} 个节点，${data.edgeCount || data.edges.length} 条边`)
    } catch (error: any) {
      console.error('加载图谱数据失败:', error)
      const errorMsg = error.message || '未知错误'
      message.error(`加载图谱数据失败: ${errorMsg}`)
      setGraphData(null)
    } finally {
      setLoading(false)
    }
  }

  // 快速选择常用节点
  const quickSelectNodes = [
    { code: 'A01', name: 'A01 - 外感病证' },
    { code: 'B04', name: 'B04 - 气血津液病证' },
    { code: 'B04.03.01.03.', name: 'B04.03.01.03. - 脾虚' },
  ]

  return (
    <div className="page-wrapper" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <PageHeader
        iconText="视"
        title="高级可视化"
        subtitle="少纳言中医知识图谱"
        description="探索知识图谱的多种可视化方式：3D视图、时间线图谱、动态演化展示"
      />

      {/* 控制面板 */}
      <Card className="mb-4 glass-panel">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* 根节点选择 */}
          <Space size="large" wrap>
            <div style={{ flex: 1, minWidth: 300 }}>
              <label className="mr-2">根节点:</label>
              <AutoComplete
                style={{ width: '100%' }}
                value={rootCode}
                onChange={setRootCode}
                onSearch={handleSearch}
                options={searchOptions}
                placeholder="搜索节点代码或名称"
                loading={searchLoading}
                notFoundContent={searchLoading ? '搜索中...' : '未找到节点，请尝试其他关键词'}
                filterOption={false}
                allowClear
              />
            </div>
            <div style={{ minWidth: 200 }}>
              <label className="mr-2">或从列表选择:</label>
              <Select
                showSearch
                allowClear
                loading={loadingRoots}
                placeholder="选择根节点"
                value={rootCode}
                onChange={setRootCode}
                style={{ width: '100%' }}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {rootNodes.map(node => (
                  <Option key={node.code} value={node.code}>
                    {node.name || node.code} 
                    <Tag color={node.category === '疾病类' ? 'blue' : 'green'} style={{ marginLeft: 8 }}>
                      {node.category}
                    </Tag>
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mr-2">深度:</label>
              <InputNumber
                min={1}
                max={5}
                value={depth}
                onChange={(val) => setDepth(val || 3)}
              />
            </div>
            <div>
              <label className="mr-2">节点限制:</label>
              <InputNumber
                min={10}
                max={500}
                value={limit}
                onChange={(val) => setLimit(val || 100)}
              />
            </div>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={loadGraphData}
              loading={loading}
            >
              加载图谱
            </Button>
          </Space>

          {/* 快速选择 */}
          <div>
            <label className="mr-2">快速选择:</label>
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

      {/* 数据统计卡片 */}
      {graphData && (
        <Card className="mb-4">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="节点总数"
                value={graphData.nodeCount || graphData.nodes?.length || 0}
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="边总数"
                value={graphData.edgeCount || graphData.edges?.length || 0}
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="疾病类节点"
                value={graphData.nodes?.filter((n: any) => n.category === '疾病类').length || 0}
                valueStyle={{ color: '#2196F3' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="证候类节点"
                value={graphData.nodes?.filter((n: any) => n.category === '证候类').length || 0}
                valueStyle={{ color: '#4CAF50' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 可视化标签页 */}
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
              ),
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
              ),
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
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
