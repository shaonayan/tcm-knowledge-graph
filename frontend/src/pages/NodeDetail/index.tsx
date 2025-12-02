import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  Card, 
  Descriptions, 
  Tag, 
  Table, 
  Space, 
  Button, 
  Breadcrumb,
  Spin,
  Alert,
  Empty
} from 'antd'
import { 
  ArrowLeftOutlined, 
  HomeOutlined,
  NodeIndexOutlined,
  BranchesOutlined
} from '@ant-design/icons'
import { getNodeDetails, type NodeDetail } from '@/services/api'
import { LoadingSpinner } from '@/components/common/Loading'

const NodeDetailPage: React.FC = () => {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [nodeDetail, setNodeDetail] = useState<NodeDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) {
      setError('节点代码不能为空')
      setLoading(false)
      return
    }

    const fetchNodeDetail = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await getNodeDetails(code)
        setNodeDetail(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '获取节点详情失败'
        setError(errorMessage)
        console.error('获取节点详情失败:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNodeDetail()
  }, [code])

  // 父节点表格列
  const parentColumns = [
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (code: string) => (
        <Link to={`/nodes/${code}`} className="text-blue-600 hover:underline font-mono" aria-label={`查看代码为${code}的节点`}>
          {code}
        </Link>
      )
    },
    {
      title: '术语',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: any) => (
        <Link to={`/nodes/${record.code}`} className="font-medium text-gray-800 hover:text-primary-500" aria-label={`查看术语${name}的详情`}>
          {name}
        </Link>
      )
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => {
        const color = category === '疾病类' ? 'blue' : category === '证候类' ? 'green' : 'default'
        return <Tag color={color}>{category}</Tag>
      }
    },
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: number) => <Tag color="geekblue">第 {level} 级</Tag>
    }
  ]

  // 子节点表格列
  const childrenColumns = [
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (code: string) => (
        <Link to={`/nodes/${code}`} className="text-blue-600 hover:underline font-mono" aria-label={`查看代码为${code}的子节点`}>
          {code}
        </Link>
      )
    },
    {
      title: '术语',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: any) => (
        <Link to={`/nodes/${record.code}`} className="font-medium text-gray-800 hover:text-primary-500" aria-label={`查看子节点术语${name}的详情`}>
          {name}
        </Link>
      )
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => {
        const color = category === '疾病类' ? 'blue' : category === '证候类' ? 'green' : 'default'
        return <Tag color={color}>{category}</Tag>
      }
    },
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: number) => <Tag color="geekblue">第 {level} 级</Tag>
    }
  ]

  if (loading) {
    return <LoadingSpinner />
  }

  if (error || !nodeDetail) {
    return (
      <div className="p-6">
        <Alert
          message="加载失败"
          description={error || '节点详情未找到'}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/search')}>
              返回搜索
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 面包屑导航 */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item>
          <Link to="/" aria-label="返回首页">
            <HomeOutlined /> 首页
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link to="/search" aria-label="前往智能搜索页面">智能搜索</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          {nodeDetail.code} - {nodeDetail.name}
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* 返回按钮 */}
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        返回
      </Button>

      {/* 基本信息卡片 */}
      <Card 
        title={
          <div className="flex items-center gap-2">
            <NodeIndexOutlined className="text-primary-500" />
            <span>节点详情</span>
          </div>
        }
        className="mb-6"
      >
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
          <Descriptions.Item label="代码" span={1}>
            <span className="font-mono text-blue-600 font-bold">{nodeDetail.code}</span>
          </Descriptions.Item>
          <Descriptions.Item label="术语" span={2}>
            <span className="text-lg font-bold text-gray-800">{nodeDetail.name}</span>
          </Descriptions.Item>
          <Descriptions.Item label="类别" span={1}>
            <Tag 
              color={nodeDetail.category === '疾病类' ? 'blue' : 'green'} 
              className="text-base px-3 py-1"
            >
              {nodeDetail.category}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="层级" span={1}>
            <Tag color="geekblue" className="text-base px-3 py-1">
              第 {nodeDetail.level} 级
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="子节点数量" span={1}>
            <Tag color="green" className="text-base px-3 py-1">
              {nodeDetail.childrenCount} 个
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        {/* 所有属性 */}
        {Object.keys(nodeDetail.properties).length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">所有属性</h3>
            <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
              {Object.entries(nodeDetail.properties).map(([key, value]) => (
                <Descriptions.Item 
                  key={key} 
                  label={key}
                  span={1}
                >
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </div>
        )}
      </Card>

      {/* 父节点 */}
      {nodeDetail.parents.length > 0 && (
        <Card 
          title={
            <div className="flex items-center gap-2">
              <BranchesOutlined className="text-blue-500" />
              <span>父节点 ({nodeDetail.parentCount})</span>
            </div>
          }
          className="mb-6"
        >
          <Table
            columns={parentColumns}
            dataSource={nodeDetail.parents.map((item, index) => ({
              ...item,
              key: `${item.code}-${index}`
            }))}
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* 子节点 */}
      <Card 
        title={
          <div className="flex items-center gap-2">
            <BranchesOutlined className="text-green-500" />
            <span>子节点 ({nodeDetail.childrenCount})</span>
          </div>
        }
      >
        {nodeDetail.children.length > 0 ? (
          <Table
            columns={childrenColumns}
            dataSource={nodeDetail.children.map((item, index) => ({
              ...item,
              key: `${item.code}-${index}`
            }))}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个子节点`
            }}
            size="small"
          />
        ) : (
          <Empty description="暂无子节点" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </div>
  )
}

export default NodeDetailPage
