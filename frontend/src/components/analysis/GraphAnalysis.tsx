import React, { useState } from 'react'
import { Card, Input, Button, Space, message, Tabs } from 'antd'
import { NodeIndexOutlined, SearchOutlined } from '@ant-design/icons'
import { analyzePath, analyzeCentrality, analyzeNeighbors, type PathAnalysis, type CentralityAnalysis, type NeighborAnalysis } from '@/services/api'

interface GraphAnalysisProps {
  selectedNodeCode?: string
}

export const GraphAnalysis: React.FC<GraphAnalysisProps> = ({ selectedNodeCode }) => {
  const [pathFrom, setPathFrom] = useState<string>('')
  const [pathTo, setPathTo] = useState<string>('')
  const [pathResults, setPathResults] = useState<PathAnalysis[]>([])
  const [centralityResults, setCentralityResults] = useState<CentralityAnalysis[]>([])
  const [neighborResults, setNeighborResults] = useState<NeighborAnalysis[]>([])
  const [analyzing, setAnalyzing] = useState<boolean>(false)

  // 路径分析
  const handlePathAnalysis = async () => {
    if (!pathFrom || !pathTo) {
      message.warning('请提供起始节点和结束节点代码')
      return
    }
    setAnalyzing(true)
    try {
      const paths = await analyzePath(pathFrom, pathTo, 5)
      setPathResults(paths)
      if (paths.length === 0) {
        message.info('未找到路径')
      } else {
        message.success(`找到 ${paths.length} 条路径`)
      }
    } catch (err: any) {
      message.error(err.message || '路径分析失败')
    } finally {
      setAnalyzing(false)
    }
  }

  // 中心度分析
  const handleCentralityAnalysis = async () => {
    setAnalyzing(true)
    try {
      const results = await analyzeCentrality(undefined, 'degree')
      setCentralityResults(Array.isArray(results) ? results : [results])
      message.success('中心度分析完成')
    } catch (err: any) {
      message.error(err.message || '中心度分析失败')
    } finally {
      setAnalyzing(false)
    }
  }

  // 邻居分析
  const handleNeighborAnalysis = async (code: string) => {
    setAnalyzing(true)
    try {
      const neighbors = await analyzeNeighbors(code, 1)
      setNeighborResults(neighbors)
      message.success(`找到 ${neighbors.length} 个邻居节点`)
    } catch (err: any) {
      message.error(err.message || '邻居分析失败')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <Card className="mb-4">
      <Tabs
        defaultActiveKey="path"
        items={[
          {
            key: 'path',
            label: '路径分析',
            children: (
              <div className="space-y-4">
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder="起始节点代码"
                    value={pathFrom}
                    onChange={(e) => setPathFrom(e.target.value)}
                    style={{ width: '40%' }}
                  />
                  <Input
                    placeholder="结束节点代码"
                    value={pathTo}
                    onChange={(e) => setPathTo(e.target.value)}
                    style={{ width: '40%' }}
                  />
                  <Button
                    type="primary"
                    onClick={handlePathAnalysis}
                    loading={analyzing}
                  >
                    分析路径
                  </Button>
                </Space.Compact>
                {pathResults.length > 0 && (
                  <div className="mt-2 p-3 bg-gray-50 rounded">
                    <div className="text-sm font-medium mb-2">找到 {pathResults.length} 条路径：</div>
                    {pathResults.slice(0, 5).map((path, idx) => (
                      <div key={idx} className="text-xs mb-1 p-2 bg-white rounded">
                        路径 {idx + 1} (长度: {path.pathLength}): {path.nodes.map(n => n.name || n.code).join(' → ')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'centrality',
            label: '中心度分析',
            children: (
              <div className="space-y-4">
                <Button
                  onClick={handleCentralityAnalysis}
                  loading={analyzing}
                >
                  分析Top节点中心度
                </Button>
                {centralityResults.length > 0 && (
                  <div className="mt-2 p-3 bg-gray-50 rounded max-h-60 overflow-auto">
                    <div className="text-sm font-medium mb-2">Top {centralityResults.length} 节点：</div>
                    {centralityResults.slice(0, 20).map((node, idx) => (
                      <div key={idx} className="text-xs mb-1 p-2 bg-white rounded flex justify-between">
                        <span>{idx + 1}. {node.name || node.code}</span>
                        <span className="font-medium">度中心度: {node.degree}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'neighbors',
            label: '邻居分析',
            children: (
              <div className="space-y-4">
                {selectedNodeCode ? (
                  <>
                    <Button
                      onClick={() => handleNeighborAnalysis(selectedNodeCode)}
                      loading={analyzing}
                    >
                      分析节点 {selectedNodeCode} 的邻居
                    </Button>
                    {neighborResults.length > 0 && (
                      <div className="mt-2 p-3 bg-gray-50 rounded max-h-60 overflow-auto">
                        <div className="text-sm font-medium mb-2">找到 {neighborResults.length} 个邻居：</div>
                        {neighborResults.slice(0, 20).map((neighbor, idx) => (
                          <div key={idx} className="text-xs mb-1 p-2 bg-white rounded flex justify-between">
                            <span>{neighbor.name || neighbor.code}</span>
                            <span className="font-medium">连接数: {neighbor.connectionCount}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    请先在图谱中选择一个节点
                  </div>
                )}
              </div>
            )
          }
        ]}
      />
    </Card>
  )
}

