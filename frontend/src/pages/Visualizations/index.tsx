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

  // 鍔犺浇鏍硅妭鐐瑰垪琛?
  useEffect(() => {
    const loadRootNodes = async () => {
      setLoadingRoots(true)
      try {
        const roots = await getRootNodes()
        setRootNodes(roots)
        // 璁剧疆榛樿鏍硅妭鐐癸紙濡傛灉鏈夌殑璇濓級
        if (roots.length > 0 && !rootCode) {
          setRootCode(roots[0].code)
          message.info(`宸茶嚜鍔ㄩ€夋嫨鏍硅妭鐐? ${roots[0].name || roots[0].code}`)
        }
      } catch (error: any) {
        console.error('鍔犺浇鏍硅妭鐐瑰け璐?', error)
        message.warning('鍔犺浇鏍硅妭鐐瑰垪琛ㄥけ璐ワ紝璇锋墜鍔ㄨ緭鍏ヨ妭鐐逛唬鐮?)
      } finally {
        setLoadingRoots(false)
      }
    }
    loadRootNodes()
  }, [])

  // 褰撳垏鎹㈡爣绛鹃〉鏃讹紝濡傛灉宸叉湁鏁版嵁锛岃嚜鍔ㄥ姞杞?
  useEffect(() => {
    if (graphData && activeTab) {
      // 鏍囩椤靛垏鎹㈡椂涓嶉渶瑕侀噸鏂板姞杞芥暟鎹?
    }
  }, [activeTab])

  // 鎼滅储鑺傜偣
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
            <Tag color={node.category === '鐤剧梾绫? ? 'blue' : 'green'} style={{ marginLeft: 8 }}>
              {node.category}
            </Tag>
          </div>
        )
      }))
      setSearchOptions(options)
    } catch (error: any) {
      console.error('鎼滅储澶辫触:', error)
      setSearchOptions([])
    } finally {
      setSearchLoading(false)
    }
  }

  const loadGraphData = async () => {
    if (!rootCode || rootCode.trim() === '') {
      message.warning('璇烽€夋嫨鎴栬緭鍏ユ牴鑺傜偣浠ｇ爜')
      return
    }

    setLoading(true)
    try {
      const data = await getGraphData(rootCode.trim(), depth, limit)
      if (!data || !data.nodes || data.nodes.length === 0) {
        message.warning('鏈壘鍒版暟鎹紝璇峰皾璇曞叾浠栨牴鑺傜偣鎴栬皟鏁存繁搴?闄愬埗鍙傛暟')
        setGraphData(null)
        return
      }
      setGraphData(data)
      message.success(`鍥捐氨鏁版嵁鍔犺浇鎴愬姛锛?{data.nodeCount || data.nodes.length} 涓妭鐐癸紝${data.edgeCount || data.edges.length} 鏉¤竟`)
    } catch (error: any) {
      console.error('鍔犺浇鍥捐氨鏁版嵁澶辫触:', error)
      const errorMsg = error.message || '鏈煡閿欒'
      message.error(`鍔犺浇鍥捐氨鏁版嵁澶辫触: ${errorMsg}`)
      setGraphData(null)
    } finally {
      setLoading(false)
    }
  }

  // 蹇€熼€夋嫨甯哥敤鑺傜偣
  const quickSelectNodes = [
    { code: 'A01', name: 'A01 - 澶栨劅鐥呰瘉' },
    { code: 'B04', name: 'B04 - 姘旇娲ユ恫鐥呰瘉' },
    { code: 'B04.03.01.03.', name: 'B04.03.01.03. - 鑴捐櫄' },
  ]

  return (
    <div className="page-wrapper" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <PageHeader
        title="楂樼骇鍙鍖?
        subtitle="灏戠撼瑷€涓尰鐭ヨ瘑鍥捐氨"
        description="鎺㈢储鐭ヨ瘑鍥捐氨鐨勫绉嶅彲瑙嗗寲鏂瑰紡锛?D瑙嗗浘銆佹椂闂寸嚎鍥捐氨銆佸姩鎬佹紨鍖栧睍绀?
      />

      {/* 鎺у埗闈㈡澘 */}
      <Card className="mb-4 glass-panel">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* 鏍硅妭鐐归€夋嫨 */}
          <Space size="large" wrap>
            <div style={{ flex: 1, minWidth: 300 }}>
              <label className="mr-2">鏍硅妭鐐?</label>
              <AutoComplete
                style={{ width: '100%' }}
                value={rootCode}
                onChange={setRootCode}
                onSearch={handleSearch}
                options={searchOptions}
                placeholder="鎼滅储鑺傜偣浠ｇ爜鎴栧悕绉?
                loading={searchLoading}
                notFoundContent={searchLoading ? '鎼滅储涓?..' : '鏈壘鍒拌妭鐐癸紝璇峰皾璇曞叾浠栧叧閿瘝'}
                filterOption={false}
                allowClear
              />
            </div>
            <div style={{ minWidth: 200 }}>
              <label className="mr-2">鎴栦粠鍒楄〃閫夋嫨:</label>
              <Select
                showSearch
                allowClear
                loading={loadingRoots}
                placeholder="閫夋嫨鏍硅妭鐐?
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
                    <Tag color={node.category === '鐤剧梾绫? ? 'blue' : 'green'} style={{ marginLeft: 8 }}>
                      {node.category}
                    </Tag>
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mr-2">娣卞害:</label>
              <InputNumber
                min={1}
                max={5}
                value={depth}
                onChange={(val) => setDepth(val || 3)}
              />
            </div>
            <div>
              <label className="mr-2">鑺傜偣闄愬埗:</label>
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
              鍔犺浇鍥捐氨
            </Button>
          </Space>

          {/* 蹇€熼€夋嫨 */}
          <div>
            <label className="mr-2">蹇€熼€夋嫨:</label>
            <Space wrap>
              {quickSelectNodes.map(node => (
                <Button
                  key={node.code}
                  size="small"
                  type={rootCode === node.code ? 'primary' : 'default'}
                  onClick={() => {
                    setRootCode(node.code)
                    message.info(`宸查€夋嫨: ${node.name}`)
                  }}
                >
                  {node.name}
                </Button>
              ))}
            </Space>
          </div>
        </Space>
      </Card>

      {/* 鏁版嵁缁熻鍗＄墖 */}
      {graphData && (
        <Card className="mb-4 stats-card">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <div className="visualization-stat">
                <Statistic
                  title="閼哄倻鍋ｉ幀缁樻殶"
                  value={graphData.nodeCount || graphData.nodes?.length || 0}
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: '#ffffff' }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="visualization-stat">
                <Statistic
                  title="鏉堣鈧粯鏆?
                  value={graphData.edgeCount || graphData.edges?.length || 0}
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: '#ffffff' }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="visualization-stat">
                <Statistic
                  title="閻ゅ墽姊剧猾鏄忓Ν閻?
                  value={graphData.nodes?.filter((n: any) => n.category === '閻ゅ墽姊剧猾?).length || 0}
                  valueStyle={{ color: '#ffffff' }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="visualization-stat">
                <Statistic
                  title="鐠囦礁鈧瑧琚懞鍌滃仯"
                  value={graphData.nodes?.filter((n: any) => n.category === '鐠囦礁鈧瑧琚?).length || 0}
                  valueStyle={{ color: '#ffffff' }}
                />
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 鍙鍖栨爣绛鹃〉 */}
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
                  <ExperimentOutlined /> 3D 鍥捐氨瑙嗗浘
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
                        <p className="text-gray-500 mb-4">璇峰厛鍔犺浇鍥捐氨鏁版嵁</p>
                        <Button type="primary" onClick={loadGraphData} disabled={!rootCode}>
                          鍔犺浇鍥捐氨
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
                  <ClockCircleOutlined /> 鏃堕棿绾垮浘璋?
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
                        <p className="text-gray-500 mb-4">璇峰厛鍔犺浇鍥捐氨鏁版嵁</p>
                        <Button type="primary" onClick={loadGraphData} disabled={!rootCode}>
                          鍔犺浇鍥捐氨
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
                  <RocketOutlined /> 鍔ㄦ€佹紨鍖栧睍绀?
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
                        <p className="text-gray-500 mb-4">璇峰厛鍔犺浇鍥捐氨鏁版嵁</p>
                        <Button type="primary" onClick={loadGraphData} disabled={!rootCode}>
                          鍔犺浇鍥捐氨
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

