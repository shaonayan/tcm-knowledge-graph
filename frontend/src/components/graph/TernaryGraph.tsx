import React, { useMemo, useState } from 'react'
import { Table, Tag, Input, Select, Empty, Card } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { TernaryGraphData, Triple } from '@/services/api'
import './TernaryGraph.css'

const { Option } = Select

interface TernaryGraphProps {
  data: TernaryGraphData
  onNodeClick?: (nodeId: string) => void
  style?: React.CSSProperties
}

const TernaryGraph: React.FC<TernaryGraphProps> = ({ data, onNodeClick, style }) => {
  const [searchText, setSearchText] = useState<string>('')
  const [predicateFilter, setPredicateFilter] = useState<string | undefined>(undefined)
  const [confidenceFilter, setConfidenceFilter] = useState<string | undefined>(undefined)

  // 获取所有唯一的谓词
  const predicates = useMemo(() => {
    const unique = new Set<string>()
    data.triples.forEach(triple => {
      unique.add(triple.predicate)
    })
    return Array.from(unique).sort()
  }, [data.triples])

  // 过滤三元组
  const filteredTriples = useMemo(() => {
    return data.triples.filter(triple => {
      // 搜索过滤
      if (searchText) {
        const searchLower = searchText.toLowerCase()
        const matches =
          triple.source.toLowerCase().includes(searchLower) ||
          triple.target.toLowerCase().includes(searchLower) ||
          triple.predicate.toLowerCase().includes(searchLower)
        if (!matches) return false
      }

      // 谓词过滤
      if (predicateFilter && triple.predicate !== predicateFilter) {
        return false
      }

      // 置信度过滤
      if (confidenceFilter) {
        const conf = triple.confidence || 1.0
        if (confidenceFilter === 'high' && conf < 0.7) return false
        if (confidenceFilter === 'medium' && (conf < 0.4 || conf >= 0.7)) return false
        if (confidenceFilter === 'low' && conf >= 0.4) return false
      }

      return true
    })
  }, [data.triples, searchText, predicateFilter, confidenceFilter])

  const columns = [
    {
      title: '主体',
      dataIndex: 'source',
      key: 'source',
      width: 150,
      render: (text: string) => (
        <span
          className="ternary-graph__entity-link"
          onClick={() => onNodeClick && onNodeClick(text)}
          style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
        >
          {text}
        </span>
      )
    },
    {
      title: '谓词',
      dataIndex: 'predicate',
      key: 'predicate',
      width: 120,
      render: (predicate: string) => (
        <Tag color="blue" style={{ margin: 0 }}>
          {predicate}
        </Tag>
      )
    },
    {
      title: '客体',
      dataIndex: 'target',
      key: 'target',
      width: 150,
      render: (text: string) => (
        <span
          className="ternary-graph__entity-link"
          onClick={() => onNodeClick && onNodeClick(text)}
          style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
        >
          {text}
        </span>
      )
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 100,
      render: (confidence: number | undefined) => {
        const conf = confidence || 1.0
        let color = 'green'
        if (conf < 0.4) color = 'red'
        else if (conf < 0.7) color = 'orange'
        return (
          <Tag color={color}>
            {(conf * 100).toFixed(0)}%
          </Tag>
        )
      },
      sorter: (a: Triple, b: Triple) => (a.confidence || 1.0) - (b.confidence || 1.0)
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string | undefined) => (
        <Tag color="default" style={{ fontSize: '11px' }}>
          {source || 'unknown'}
        </Tag>
      )
    },
    {
      title: '属性',
      key: 'properties',
      width: 200,
      render: (_: any, record: Triple) => {
        const props = record.properties || {}
        const propKeys = Object.keys(props)
        if (propKeys.length === 0) return <span style={{ color: '#9ca3af' }}>无</span>
        return (
          <div className="ternary-graph__properties">
            {propKeys.slice(0, 3).map(key => (
              <Tag key={key} style={{ fontSize: '10px', margin: '2px' }}>
                {key}: {String(props[key]).substring(0, 20)}
              </Tag>
            ))}
            {propKeys.length > 3 && (
              <Tag style={{ fontSize: '10px', margin: '2px' }}>
                +{propKeys.length - 3}
              </Tag>
            )}
          </div>
        )
      }
    }
  ]

  if (data.triples.length === 0) {
    return (
      <div style={style}>
        <Empty description="暂无三元组数据" />
      </div>
    )
  }

  return (
    <div className="ternary-graph" style={style}>
      <div className="ternary-graph__header">
        <div className="ternary-graph__stats">
          <div className="ternary-graph__stat-item">
            <span className="ternary-graph__stat-label">总三元组:</span>
            <span className="ternary-graph__stat-value">{data.tripleCount}</span>
          </div>
          <div className="ternary-graph__stat-item">
            <span className="ternary-graph__stat-label">显示:</span>
            <span className="ternary-graph__stat-value">{filteredTriples.length}</span>
          </div>
        </div>

        <div className="ternary-graph__filters">
          <Input
            placeholder="搜索主体、谓词或客体"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="筛选谓词"
            value={predicateFilter}
            onChange={setPredicateFilter}
            style={{ width: 150 }}
            allowClear
          >
            {predicates.map(pred => (
              <Option key={pred} value={pred}>
                {pred}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="筛选置信度"
            value={confidenceFilter}
            onChange={setConfidenceFilter}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="high">高 (≥70%)</Option>
            <Option value="medium">中 (40-70%)</Option>
            <Option value="low">低 (&lt;40%)</Option>
          </Select>
        </div>
      </div>

      <div className="ternary-graph__table-container">
        <Table
          columns={columns}
          dataSource={filteredTriples}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条三元组`
          }}
          scroll={{ y: 500 }}
          size="small"
        />
      </div>
    </div>
  )
}

export default TernaryGraph

