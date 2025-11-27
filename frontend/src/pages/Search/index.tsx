import React, { useState, useEffect, useCallback } from 'react'
import { Card, Input, Space, Table, Tag, Select, Alert, Empty, message, Button, Dropdown } from 'antd'
import { SearchOutlined, DownloadOutlined, FileExcelOutlined, FileTextOutlined, HistoryOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { searchNodes, type SearchResult } from '@/services/api'
import { LoadingSpinner } from '@/components/common/Loading'
import { PageHeader } from '@/components/common/PageHeader'

const { Search: InputSearch } = Input
const { Option } = Select

// 搜索历史管理
const SEARCH_HISTORY_KEY = 'tcm_search_history'
const MAX_HISTORY_ITEMS = 20

const getSearchHistory = (): string[] => {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

const saveSearchHistory = (query: string) => {
  if (!query.trim()) return
  try {
    const history = getSearchHistory()
    // 移除重复项
    const filtered = history.filter(h => h.toLowerCase() !== query.toLowerCase())
    // 添加到开头
    filtered.unshift(query.trim())
    // 限制数量
    const limited = filtered.slice(0, MAX_HISTORY_ITEMS)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limited))
  } catch (err) {
    console.error('保存搜索历史失败:', err)
  }
}

const clearSearchHistory = () => {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch (err) {
    console.error('清除搜索历史失败:', err)
  }
}

// 防抖Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

const Search: React.FC = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [levelFilter, setLevelFilter] = useState<number | undefined>(undefined)
  const [codePrefixFilter, setCodePrefixFilter] = useState<string>('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState<number>(0)
  const [hasSearched, setHasSearched] = useState<boolean>(false)
  const [searchHistory, setSearchHistory] = useState<string[]>(getSearchHistory())
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)

  // 使用防抖，延迟500ms执行搜索
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // 执行搜索
  const performSearch = useCallback(async (query: string, cat?: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setTotal(0)
      setHasSearched(false)
      return
    }

    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const result = await searchNodes(query, cat, 100) // 每次搜索最多返回100条，用于去重和排序
      
      // 去重处理（基于code）
      const uniqueResults = new Map<string, SearchResult>()
      
      result.data.forEach((item) => {
        const code = item.code
        // 如果code不存在，或者当前项的相关性更高，则更新
        if (!uniqueResults.has(code)) {
          uniqueResults.set(code, item)
        }
      })
      
      // 转换为数组并进行智能排序
      let sortedResults = Array.from(uniqueResults.values())
      
      // 智能排序：优先显示完全匹配的代码，然后是完全匹配的名称，再是包含匹配的
      const lowerQuery = query.toLowerCase()
      sortedResults = sortedResults.sort((a, b) => {
        // 1. 代码完全匹配优先
        const aCodeMatch = a.code.toLowerCase() === lowerQuery ? 100 : 
                          a.code.toLowerCase().startsWith(lowerQuery) ? 80 : 0
        const bCodeMatch = b.code.toLowerCase() === lowerQuery ? 100 : 
                          b.code.toLowerCase().startsWith(lowerQuery) ? 80 : 0
        if (aCodeMatch !== bCodeMatch) {
          return bCodeMatch - aCodeMatch
        }
        
        // 2. 名称完全匹配优先
        const aNameMatch = a.name?.toLowerCase() === lowerQuery ? 90 :
                          a.name?.toLowerCase().includes(lowerQuery) ? 70 : 0
        const bNameMatch = b.name?.toLowerCase() === lowerQuery ? 90 :
                          b.name?.toLowerCase().includes(lowerQuery) ? 70 : 0
        if (aNameMatch !== bNameMatch) {
          return bNameMatch - aNameMatch
        }
        
        // 3. 按层级排序（层级越小越靠前）
        if (a.level !== b.level) {
          return a.level - b.level
        }
        
        // 4. 按代码字母顺序排序
        return a.code.localeCompare(b.code, 'zh-CN')
      })
      
      // 限制结果数量
      const limitedResults = sortedResults.slice(0, 50)
      
      setSearchResults(limitedResults.map((item, index) => ({
        ...item,
        key: `${item.code}-${index}` // 生成唯一key
      })))
      setTotal(limitedResults.length)
      
      // 保存搜索历史
      saveSearchHistory(query)
      setSearchHistory(getSearchHistory())
      
      message.success(`找到 ${limitedResults.length} 条结果`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '搜索失败，请稍后重试'
      setError(errorMessage)
      setSearchResults([])
      setTotal(0)
      message.error(errorMessage)
      console.error('搜索失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 当搜索词改变时自动搜索
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery, category)
    } else if (debouncedSearchQuery === '') {
      setSearchResults([])
      setTotal(0)
      setHasSearched(false)
    }
  }, [debouncedSearchQuery, category, performSearch])

  // 手动搜索（点击搜索按钮或按回车）
  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  // 清除搜索
  const handleClear = () => {
    setSearchQuery('')
    setSearchResults([])
    setTotal(0)
    setHasSearched(false)
    setError(null)
  }

  // 高级筛选 - 类别筛选
  const handleCategoryChange = (value: string) => {
    const newCategory = value === 'all' ? undefined : value
    setCategory(newCategory)
    if (searchQuery.trim()) {
      performSearch(searchQuery, newCategory)
    }
  }

  // 高亮匹配文本的函数
  const highlightMatch = (text: string, query: string) => {
    if (!query || !text) return text
    
    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const index = lowerText.indexOf(lowerQuery)
    
    if (index === -1) return <span>{text}</span>
    
    const beforeMatch = text.substring(0, index)
    const match = text.substring(index, index + query.length)
    const afterMatch = text.substring(index + query.length)
    
    return (
      <span>
        {beforeMatch}
        <mark className="bg-yellow-200 px-1 rounded font-medium">{match}</mark>
        {afterMatch}
      </span>
    )
  }

  const columns = [
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (code: string) => {
        const highlighted = highlightMatch(code, searchQuery)
        return (
          <Link 
            to={`/nodes/${code}`} 
            className="font-mono text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
          >
            {highlighted}
          </Link>
        )
      }
    },
    {
      title: '术语',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: SearchResult) => {
        const highlighted = highlightMatch(name || '', searchQuery)
        return (
          <Link 
            to={`/nodes/${record.code}`} 
            className="font-medium text-gray-800 hover:text-primary-500 hover:underline cursor-pointer"
          >
            {highlighted}
          </Link>
        )
      }
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => {
        const color = category === '疾病类' ? 'blue' : category === '证候类' ? 'green' : 'default'
        return (
          <Tag color={color}>
            {category || '未知'}
          </Tag>
        )
      }
    },
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: number) => (
        <Tag color="geekblue">第 {level} 级</Tag>
      )
    }
  ]

  // 导出搜索结果
  const handleExport = (format: 'json' | 'csv') => {
    if (searchResults.length === 0) {
      message.warning('没有可导出的数据')
      return
    }

    if (format === 'json') {
      const exportData = {
        query: searchQuery,
        category: category,
        total: total,
        results: searchResults,
        exportTime: new Date().toISOString()
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `search-results-${Date.now()}.json`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      message.success('导出JSON成功')
    } else if (format === 'csv') {
      // CSV格式
      const headers = ['代码', '术语', '类别', '层级']
      const rows = searchResults.map(item => [
        item.code,
        item.name,
        item.category,
        item.level?.toString() || ''
      ])
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `search-results-${Date.now()}.csv`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      message.success('导出CSV成功')
    }
  }

  return (
    <div className="page-wrapper search-human-shell" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <PageHeader
        icon={<SearchOutlined />}
        title="智能搜索"
        subtitle="少纳言知识检索工作室"
        description="键入任意术语或编码，系统自动穿梭 Neo4j 语义网格，可叠加类目/层级筛选。"
        extra={
          searchResults.length > 0 && (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'json',
                    label: '导出 JSON',
                    icon: <FileTextOutlined />,
                    onClick: () => handleExport('json')
                  },
                  {
                    key: 'csv',
                    label: '导出 CSV',
                    icon: <FileExcelOutlined />,
                    onClick: () => handleExport('csv')
                  }
                ]
              }}
              placement="bottomRight"
            >
              <Button icon={<DownloadOutlined />} type="primary">
                导出结果
              </Button>
            </Dropdown>
          )
        }
      />

      <div className="search-meta-row">
        <span>即时响应 · {loading ? '同步中' : '就绪'}</span>
        <span>历史关键词 {searchHistory.length}</span>
        <span>当前筛选：{category || '全部'}</span>
        <span>命中节点 {total > 0 ? total : '--'}</span>
      </div>

      <section className="search-grid">
        <div className="search-panel search-panel--primary">
          <div className="search-panel__header">
            <div>
              <p className="eyebrow">关键词</p>
              <h3>语义匹配</h3>
            </div>
            <Button size="small" onClick={handleClear}>
              清空
            </Button>
          </div>
          <InputSearch
            placeholder="输入术语名称、代码或同义词"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            className="w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={handleSearch}
            onClear={handleClear}
            loading={loading}
            style={{ borderRadius: '10px' }}
          />
          <div className="search-controls-row">
            <Select
              placeholder="选择类别"
              size="large"
              value={category || 'all'}
              onChange={handleCategoryChange}
              allowClear
            >
              <Option value="all">全部类别</Option>
              <Option value="疾病类">疾病类</Option>
              <Option value="证候类">证候类</Option>
            </Select>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setShowAdvanced(!showAdvanced)}
              type={showAdvanced ? 'primary' : 'default'}
              size="large"
            >
              高级筛选
            </Button>
          </div>

          {showAdvanced && (
            <div className="advanced-panel">
              <div className="advanced-panel__row">
                <span>层级筛选</span>
                <Select
                  placeholder="选择层级"
                  value={levelFilter}
                  onChange={(value) => {
                    setLevelFilter(value)
                    if (searchQuery.trim()) {
                      performSearch(searchQuery, category)
                    }
                  }}
                  allowClear
                >
                  <Option value={1}>L1 - 一级</Option>
                  <Option value={2}>L2 - 二级</Option>
                  <Option value={3}>L3 - 三级</Option>
                  <Option value={4}>L4 - 四级</Option>
                  <Option value={5}>L5 - 五级</Option>
                </Select>
              </div>
              <div className="advanced-panel__row">
                <span>代码前缀</span>
                <Input
                  placeholder="例如: A01, B02"
                  value={codePrefixFilter}
                  onChange={(e) => {
                    setCodePrefixFilter(e.target.value)
                    if (searchQuery.trim()) {
                      performSearch(searchQuery, category)
                    }
                  }}
                  allowClear
                />
                <small>用于锁定更具体的分支</small>
              </div>
              <Button
                size="small"
                onClick={() => {
                  setLevelFilter(undefined)
                  setCodePrefixFilter('')
                  if (searchQuery.trim()) {
                    performSearch(searchQuery, category)
                  }
                }}
              >
                重置筛选
              </Button>
            </div>
          )}

          {searchQuery && (
            <div className="search-hint">
              {loading ? (
                <span>正在搜索...</span>
              ) : debouncedSearchQuery !== searchQuery ? (
                <span>输入完成后将自动搜索</span>
              ) : hasSearched && (
                <span>搜索关键词: <strong>{searchQuery}</strong></span>
              )}
            </div>
          )}
        </div>

        <div className="search-panel search-panel--secondary">
          <div className="search-panel__header">
            <div>
              <p className="eyebrow">历史</p>
              <h3>最近查找</h3>
            </div>
            {searchHistory.length > 0 && (
              <Button
                type="link"
                size="small"
                icon={<ClearOutlined />}
                onClick={() => {
                  clearSearchHistory()
                  setSearchHistory([])
                  message.success('搜索历史已清除')
                }}
              >
                清除
              </Button>
            )}
          </div>
          <div className="history-tags">
            {searchHistory.length === 0 ? (
              <p className="text-muted">暂无历史记录</p>
            ) : (
              searchHistory.slice(0, 10).map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setSearchQuery(item)
                    handleSearch(item)
                  }}
                >
                  {item}
                </button>
              ))
            )}
          </div>
          <div className="search-panel__notes">
            <p>提示</p>
            <ul>
              <li>支持模糊匹配、拼音与中英文混输</li>
              <li>输入编码可快速跳转节点详情</li>
              <li>建议先唤醒 Render 后端，避免冷启动</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="search-result-panel glass-panel">
        <div className="search-result-panel__header">
          <div>
            <p className="eyebrow">结果列表</p>
            <h4>找到 {total} 条可能的关联节点</h4>
          </div>
          <span>点击行可跳转至节点详情</span>
        </div>

        {error && (
          <Alert
            message="搜索失败"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            className="mb-4"
          />
        )}

        {loading && !hasSearched ? (
          <LoadingSpinner />
        ) : !hasSearched ? (
          <Empty
            description="请输入搜索关键词开始搜索"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : searchResults.length === 0 ? (
          <Empty
            description="未找到相关结果，请尝试其他关键词"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={searchResults}
            loading={loading}
            onRow={(record) => ({
              onClick: () => {
                navigate(`/nodes/${record.code}`)
              },
              style: { cursor: 'pointer' },
              className: 'hover:bg-gray-50'
            })}
            pagination={{
              total,
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
            scroll={{ x: 'max-content' }}
          />
        )}
      </div>
    </div>
  )
}

export default Search
