import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import cytoscape from 'cytoscape'
import dagre from 'cytoscape-dagre'
import { GraphNode, GraphEdge } from '@/services/api'

// 注册dagre布局
cytoscape.use(dagre)

export interface CytoscapeGraphRef {
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  fit: () => void
  exportPNG: (filename?: string) => void
  exportJSON: () => { nodes: any[], edges: any[] } | null
}

interface CytoscapeGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (node: GraphNode) => void
  onNodeDoubleClick?: (node: GraphNode) => void
  layout?: 'dagre' | 'breadthfirst' | 'grid' | 'circle'
  style?: React.CSSProperties
  searchQuery?: string
  categoryFilter?: string
  levelFilter?: number
  codePrefixFilter?: string
  onZoomChange?: (zoom: number) => void
}

const CytoscapeGraph = forwardRef<CytoscapeGraphRef, CytoscapeGraphProps>(({
  nodes,
  edges,
  onNodeClick,
  onNodeDoubleClick,
  layout = 'dagre',
  style = { width: '100%', height: '600px' },
  searchQuery = '',
  categoryFilter,
  levelFilter,
  codePrefixFilter = '',
  onZoomChange
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 初始化Cytoscape
  useEffect(() => {
    if (!containerRef.current) return

    // 如果已存在，先销毁
    if (cyRef.current) {
      cyRef.current.destroy()
    }

    // 初始化Cytoscape - 添加动画支持
    console.log('📦 创建Cytoscape实例')
    try {
      cyRef.current = cytoscape({
        container: containerRef.current,
        elements: [],
      // 启用动画（使用默认缓动）
      animationDuration: 800, // 动画时长
      animationEasing: 'ease-out', // 使用内置缓动函数，弹动效果在具体动画中实现
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': (ele: any) => {
              const level = ele.data('level') || 1
              return level === 1 ? 60 : level === 2 ? 50 : level === 3 ? 45 : 40
            },
            'height': (ele: any) => {
              const level = ele.data('level') || 1
              return level === 1 ? 60 : level === 2 ? 50 : level === 3 ? 45 : 40
            },
            'font-size': 12,
            'font-weight': 'normal',
            'color': '#FFFFFF',  // Neo4j使用白色文字
            'text-outline-color': '#000000',
            'text-outline-width': 1,
            'text-background-color': 'transparent',
            'text-background-opacity': 0,
            'text-background-padding': 0,
            'text-max-width': 100,
            'shape': 'ellipse',  // 圆形节点
            // Neo4j风格的鲜艳颜色
            'background-color': (ele: any) => {
              const category = ele.data('category')
              if (category === '疾病类') {
                return '#68BDF6'  // Neo4j蓝色
              } else if (category === '证候类') {
                return '#6DCE9E'  // Neo4j绿色
              } else {
                return '#FF756E'  // Neo4j红色
              }
            },
            'border-width': 0,
            'border-color': 'transparent',
            'opacity': (ele: any) => {
              if (searchQuery && ele.data('highlighted')) {
                return 1
              }
              if (categoryFilter && ele.data('category') !== categoryFilter) {
                return 0.3
              }
              return 1
            }
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#FFD700',  // Neo4j选中时的金色边框
            'background-color': (ele: any) => {
              const category = ele.data('category')
              if (category === '疾病类') {
                return '#68BDF6'
              } else if (category === '证候类') {
                return '#6DCE9E'
              } else {
                return '#FF756E'
              }
            }
          }
        },
        {
          selector: 'node:hover',
          style: {
            'border-width': 2,
            'border-color': '#FFD700',
            'opacity': 1,
            'cursor': 'pointer',
            'overlay-opacity': 0.1
          }
        },
        {
          selector: 'node:active',
          style: {
            'border-width': 3,
            'border-color': '#FFD700',
            'cursor': 'grabbing'
          }
        },
        {
          selector: 'node.dragging',
          style: {
            'opacity': 0.8,
            'cursor': 'grabbing',
            'border-width': 3,
            'border-color': '#FFD700'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#A5ABB6',  // Neo4j的淡灰色边
            'target-arrow-color': '#A5ABB6',
            'target-arrow-shape': 'triangle',
            'target-arrow-size': 4,
            'curve-style': 'bezier',
            'opacity': 0.6,
            'arrow-scale': 1
          }
        },
        {
          selector: 'edge:hover',
          style: {
            'line-color': '#FFD700',
            'target-arrow-color': '#FFD700',
            'width': 2,
            'opacity': 1
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#FFD700',
            'target-arrow-color': '#FFD700',
            'width': 2.5,
            'opacity': 1
          }
        },
        {
          selector: 'node.new-node',
          style: {
            'opacity': 0.1,
            'width': 10,
            'height': 10
          }
        }
      ],
      minZoom: 0.1,
      maxZoom: 2,
      wheelSensitivity: 0.15,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: true,
      autoungrabify: false,  // 允许节点可以被拖拽
      autolock: false,  // 不自动锁定节点位置
      grabbable: true  // 启用节点抓取功能
    })

    // 设置Neo4j风格的深色背景
    if (containerRef.current) {
      containerRef.current.style.backgroundColor = '#2B2B2B'  // Neo4j深色背景
    }
    
    console.log('✅ Cytoscape实例创建成功')
    console.log('实例状态:', cyRef.current ? '有效' : '无效')
    console.log('容器:', cyRef.current?.container() ? '已绑定' : '未绑定')
    
    } catch (err) {
      console.error('❌ Cytoscape实例创建失败:', err)
      return
    }

    // 缩放变化监听
    if (onZoomChange) {
      cyRef.current.on('zoom', () => {
        if (cyRef.current) {
          onZoomChange(cyRef.current.zoom())
        }
      })
    }

    // 节点点击事件（带弹动反馈）
    cyRef.current.on('tap', 'node', (evt: any) => {
      const node = evt.target
      const nodeData = node.data()
      
      // 点击弹动效果：先缩小，再弹回
      const currentWidth = node.width()
      const currentHeight = node.height()
      
      node.animate({
        style: {
          width: currentWidth * 0.8,
          height: currentHeight * 0.8
        }
      }, {
        duration: 150,
        easing: 'ease-out',
        complete: () => {
          if (cyRef.current && !cyRef.current.destroyed()) {
            try {
              // 检查节点是否仍然有效
              const nodeStyle = node.style('opacity')
              if (nodeStyle !== undefined) {
                node.animate({
                  style: {
                    width: currentWidth,
                    height: currentHeight
                  }
                }, {
                  duration: 350,
                  easing: 'ease-out' // 使用内置缓动，不支持自定义函数
                })
              }
            } catch (err) {
              // 节点已被删除，忽略错误
              console.log('节点已被删除，跳过动画:', node.id())
            }
          }
        }
      })
      
      const graphNode: GraphNode = {
        id: nodeData.id,
        code: nodeData.code,
        name: nodeData.name,
        label: nodeData.label,
        category: nodeData.category,
        level: nodeData.level
      }
      if (onNodeClick) {
        onNodeClick(graphNode)
      }
    })

    // 节点双击事件
    cyRef.current.on('dbltap', 'node', (evt: any) => {
      const nodeData = evt.target.data()
      const node: GraphNode = {
        id: nodeData.id,
        code: nodeData.code,
        name: nodeData.name,
        label: nodeData.label,
        category: nodeData.category,
        level: nodeData.level
      }
      if (onNodeDoubleClick) {
        onNodeDoubleClick(node)
      }
    })

    // 节点拖拽开始事件
    cyRef.current.on('grab', 'node', (evt: any) => {
      evt.target.addClass('dragging')
      // 高亮被拖拽的节点
      evt.target.style('border-width', 5)
      evt.target.style('border-color', '#FF9800')
    })

    // 节点拖拽结束事件
    cyRef.current.on('free', 'node', (evt: any) => {
      evt.target.removeClass('dragging')
      // 恢复节点样式
      const category = evt.target.data('category')
      const borderColor = category === '疾病类' ? '#2196F3' : category === '证候类' ? '#4CAF50' : '#9C27B0'
      evt.target.style('border-width', 2)
      evt.target.style('border-color', borderColor)
    })

    // 清理函数
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy()
        cyRef.current = null
      }
    }
  }, [])

    // 更新图谱数据 - 添加 Neo4j 风格的动画
  useEffect(() => {
    console.log('=== 图谱数据更新 ===')
    console.log('Cytoscape实例状态:', cyRef.current ? '已初始化' : '未初始化')
    console.log('传入的节点数:', nodes.length)
    console.log('传入的边数:', edges.length)
    console.log('布局:', layout)
    console.log('搜索查询:', searchQuery)
    console.log('筛选条件:', { categoryFilter, levelFilter, codePrefixFilter })
    
    if (!cyRef.current) {
      console.error('❌ Cytoscape实例未准备好')
      return
    }

    if (nodes.length === 0 && edges.length === 0) {
      console.log('⚠️ 没有数据，清空图谱')
      cyRef.current.elements().remove()
      return
    }

    // 应用所有筛选条件
    let filteredNodes = nodes
    
    // 类别筛选
    if (categoryFilter) {
      filteredNodes = filteredNodes.filter(n => n.category === categoryFilter)
    }
    
    // 层级筛选
    if (levelFilter !== undefined) {
      filteredNodes = filteredNodes.filter(n => n.level === levelFilter)
    }
    
    // 代码前缀筛选
    if (codePrefixFilter && codePrefixFilter.trim()) {
      const prefix = codePrefixFilter.trim().toUpperCase()
      filteredNodes = filteredNodes.filter(n => 
        n.code && n.code.toUpperCase().startsWith(prefix)
      )
    }

    // 筛选边：只保留两端节点都存在的边
    const filteredEdges = edges.filter(e => {
      const sourceNode = filteredNodes.find(n => n.id === e.source)
      const targetNode = filteredNodes.find(n => n.id === e.target)
      return sourceNode && targetNode
    })

    console.log('✅ 数据过滤完成:', {
      过滤后节点数: filteredNodes.length,
      过滤后边数: filteredEdges.length,
      原始节点数: nodes.length,
      原始边数: edges.length,
      筛选条件: {
        类别: categoryFilter,
        层级: levelFilter,
        代码前缀: codePrefixFilter
      }
    })
    
    if (filteredNodes.length === 0) {
      console.warn('⚠️ 过滤后没有节点！')
      console.log('原始节点数:', nodes.length)
      console.log('筛选条件:', { categoryFilter, levelFilter, codePrefixFilter })
    }

    const elements = [
      ...filteredNodes.map(node => ({
        data: {
          id: node.id,
          label: node.name || node.code,
          code: node.code,
          name: node.name,
          category: node.category,
          level: node.level,
          highlighted: searchQuery && (
            node.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (node.name && node.name.toLowerCase().includes(searchQuery.toLowerCase()))
          ) ? true : false
        }
      })),
      ...filteredEdges.map(edge => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type
        }
      }))
    ]

    console.log('构建的元素数组:', elements.length, '个元素')

    // 获取现有元素ID，用于判断新增/删除
    const existingNodeIds = new Set(cyRef.current.nodes().map((n: any) => n.id()))
    const existingEdgeIds = new Set(cyRef.current.edges().map((e: any) => e.id()))
    const newElementIds = new Set(elements.map(el => el.data.id))
    
    console.log('现有元素:', {
      nodes: existingNodeIds.size,
      edges: existingEdgeIds.size,
      newElements: newElementIds.size
    })

    // 动画移除已删除的节点和边（弹动缩小消失）
    cyRef.current.nodes().forEach((node: any) => {
      if (!newElementIds.has(node.id())) {
        const currentSize = node.width()
        node.animate({
          style: { 
            opacity: 0,
            width: currentSize * 0.3,
            height: currentSize * 0.3
          }
        }, {
          duration: 400,
          easing: 'ease-in', // 使用内置缓动，不支持自定义函数
          complete: () => node.remove()
        })
      }
    })

    cyRef.current.edges().forEach((edge: any) => {
      if (!newElementIds.has(edge.id())) {
        edge.animate({
          style: { 
            opacity: 0,
            width: 0
          }
        }, {
          duration: 300,
          easing: 'ease-in',
          complete: () => edge.remove()
        })
      }
    })

    // 如果是首次加载（没有现有节点），直接替换所有元素
    if (existingNodeIds.size === 0 && existingEdgeIds.size === 0) {
      console.log('首次加载，直接替换所有元素，节点数:', elements.filter(el => !el.data.source).length, '边数:', elements.filter(el => el.data.source).length)
      cyRef.current.elements().remove()
      
      // 添加所有元素
      const nodes = elements.filter(el => !el.data.source)
      const edges = elements.filter(el => el.data.source)
      
      console.log('准备添加节点:', nodes.length, '准备添加边:', edges.length)
      
      // 直接添加元素，先不设置样式
      cyRef.current.add([...nodes, ...edges])
      
      console.log('已添加元素，当前节点数:', cyRef.current.nodes().length, '当前边数:', cyRef.current.edges().length)
      
      // 直接设置可见样式（不标记为new-node，确保立即可见）
      cyRef.current.nodes().forEach((node: any) => {
        const level = node.data('level') || 1
        const size = level === 1 ? 120 : level === 2 ? 100 : level === 3 ? 90 : 80
        const opacity = node.data('highlighted') ? 1 : (categoryFilter && node.data('category') !== categoryFilter ? 0.3 : 1)
        
        // 先移除new-node类（如果存在），确保节点可见
        node.removeClass('new-node')
        
        // 启用节点抓取功能（允许拖拽）
        node.grabbable(true)
        
        // 设置节点样式
        node.style({
          opacity: opacity,
          width: size,
          height: size
        })
        
        // 如果没有位置，先设置一个临时位置（网格分布）
        const pos = node.position()
        if (pos.x === undefined || pos.y === undefined || 
            (pos.x === 0 && pos.y === 0) || 
            !isFinite(pos.x) || !isFinite(pos.y)) {
          const index = cyRef.current.nodes().indexOf(node)
          node.position({
            x: (index % 10) * 100 + 300,
            y: Math.floor(index / 10) * 100 + 300
          })
          console.log(`设置节点 ${node.id()} 临时位置:`, node.position())
        }
      })
      
      // 设置边样式
      cyRef.current.edges().forEach((edge: any) => {
        edge.style({ opacity: 0.8, width: 2 })
      })
      
      console.log('已设置初始样式，节点数:', cyRef.current.nodes().length, '边数:', cyRef.current.edges().length)
      
      // 立即更新视图，确保可见
      setTimeout(() => {
        if (cyRef.current && !cyRef.current.destroyed()) {
          const nodes = cyRef.current.nodes()
          const edges = cyRef.current.edges()
          console.log('更新视图前 - 节点数:', nodes.length, '边数:', edges.length)
          
          // 强制刷新容器尺寸
          cyRef.current.resize()
          
          // 确保所有节点都在可见区域
          if (nodes.length > 0) {
            // 获取所有节点的边界
            const extent = nodes.boundingBox()
            console.log('节点边界:', extent)
            
            // 确保所有节点都移除了new-node类
            nodes.forEach((node: any) => {
              node.removeClass('new-node')
            })
            
            // 适应整个图谱
            cyRef.current.fit(nodes, 50)
            
            // 获取适应后的缩放
            let zoom = cyRef.current.zoom()
            console.log('适应后的缩放:', zoom, '节点边界:', extent)
            
            // 如果缩放不合理，手动计算合适的缩放
            if (zoom < 0.2 || zoom > 5 || !isFinite(zoom) || extent.w === 0 || extent.h === 0) {
              const containerWidth = containerRef.current?.offsetWidth || 800
              const containerHeight = containerRef.current?.offsetHeight || 600
              
              if (extent.w > 0 && extent.h > 0) {
                const idealZoom = Math.min(
                  (containerWidth - 100) / extent.w,
                  (containerHeight - 100) / extent.h
                )
                zoom = Math.max(0.3, Math.min(idealZoom || 0.5, 1.5))
              } else {
                zoom = 0.5 // 默认缩放
              }
              
              cyRef.current.zoom(zoom)
              cyRef.current.center()
              console.log('手动设置缩放:', zoom)
            }
            
            // 再次确保所有节点可见
            nodes.forEach((node: any) => {
              node.removeClass('new-node')
              const pos = node.position()
              if (pos.x !== undefined && pos.y !== undefined && isFinite(pos.x) && isFinite(pos.y)) {
                // 节点有有效位置
              } else {
                console.warn(`节点 ${node.id()} 位置无效:`, pos)
              }
            })
            
            console.log('✅ 视图已更新和适应，最终缩放:', cyRef.current.zoom(), '中心:', cyRef.current.pan(), '容器尺寸:', {
              width: containerRef.current?.offsetWidth,
              height: containerRef.current?.offsetHeight
            }, '可见节点数:', nodes.filter((n: any) => !n.hasClass('new-node')).length)
            
            // 再次确保视图正确（延迟一点）
            setTimeout(() => {
              if (cyRef.current && !cyRef.current.destroyed()) {
                cyRef.current.resize()
              }
            }, 100)
          }
        }
      }, 200)
    } else {
      // 增量更新：添加新元素并应用动画
      const newElements = elements.filter(el => {
        const isNode = !el.data.source
        const id = el.data.id
        return isNode ? !existingNodeIds.has(id) : !existingEdgeIds.has(id)
      })

      if (newElements.length > 0) {
        console.log('添加新元素:', newElements.length)
        // 新节点先设置为透明和小尺寸
        const nodesToAdd = newElements.filter(el => !el.data.source).map(el => ({
          ...el,
          classes: 'new-node'
        }))
        const edgesToAdd = newElements.filter(el => el.data.source)

        cyRef.current.add([...nodesToAdd, ...edgesToAdd])

        // 为新节点添加初始样式
        cyRef.current.nodes('.new-node').forEach((node: any) => {
          node.style({
            opacity: 0,
            width: 0,
            height: 0
          })
          // 启用节点抓取功能（允许拖拽）
          node.grabbable(true)
        })

        // 新边初始样式
        cyRef.current.edges().filter((edge: any) => !existingEdgeIds.has(edge.id())).forEach((edge: any) => {
          edge.style({ opacity: 0, width: 0 })
        })
      }
    }

    // 更新现有元素的样式（带动画）
    cyRef.current.nodes().forEach((node: any) => {
      const nodeData = elements.find(el => !el.data.source && el.data.id === node.id())?.data
      if (nodeData) {
        const opacity = nodeData.highlighted ? 1 : (categoryFilter && nodeData.category !== categoryFilter ? 0.3 : 1)
        node.animate({
          style: { opacity }
        }, { 
          duration: 500,
          easing: 'ease-out' // 使用内置缓动，不支持自定义函数
        })
      }
    })

    // 运行布局 - 带动画
    const layoutInstance = cyRef.current.layout({
      name: layout,
      rankDir: 'TB',
      nodeSep: 50,
      edgeSep: 50,
      rankSep: 100,
      spacingFactor: 1.2,
      padding: 30,
      animate: true, // 启用布局动画（使用默认缓动）
      animationDuration: 800,
      animationEasing: 'ease-out' // 布局动画使用内置缓动，弹动效果在节点动画中实现
    })

    // 添加备用显示逻辑：如果布局超时，确保节点能显示
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
    }
    timeoutIdRef.current = setTimeout(() => {
      if (cyRef.current && !cyRef.current.destroyed()) {
        const newNodes = cyRef.current.nodes('.new-node')
        if (newNodes.length > 0) {
          console.warn('布局超时，强制显示节点:', newNodes.length)
          newNodes.forEach((node: any) => {
            const level = node.data('level') || 1
            const size = level === 1 ? 120 : level === 2 ? 100 : level === 3 ? 90 : 80
            const opacity = node.data('highlighted') ? 1 : (categoryFilter && node.data('category') !== categoryFilter ? 0.3 : 1)
            node.style({
              opacity: opacity,
              width: size,
              height: size
            })
            
            // 设置临时位置（网格布局）
            const allNodes = cyRef.current.nodes()
            const nodeIndex = allNodes.indexOf(node)
            node.position({
              x: (nodeIndex % 10) * 100 + 200,
              y: Math.floor(nodeIndex / 10) * 100 + 200
            })
            
            node.removeClass('new-node')
          })
          
          cyRef.current.edges().forEach((edge: any) => {
            edge.style({ opacity: 0.8, width: 2 })
          })
          
          // 确保视图更新和适应
          cyRef.current.resize()
          
          const allNodes = cyRef.current.nodes()
          if (allNodes.length > 0) {
            // 适应所有节点
            cyRef.current.fit(allNodes, 50)
            
            // 确保缩放合理（不要太小）
            const zoom = cyRef.current.zoom()
            if (zoom < 0.2 || !isFinite(zoom)) {
              // 如果缩放太小，设置为合适的值
              const extent = allNodes.boundingBox()
              const containerWidth = containerRef.current?.offsetWidth || 800
              const containerHeight = containerRef.current?.offsetHeight || 600
              const idealZoom = Math.min(
                (containerWidth - 100) / extent.w,
                (containerHeight - 100) / extent.h
              )
              const finalZoom = Math.max(0.3, Math.min(idealZoom || 0.5, 1.5))
              cyRef.current.zoom(finalZoom)
              cyRef.current.center()
            }
            
            console.log('✅ 超时显示完成，视图已更新，节点数:', allNodes.length, '最终缩放:', cyRef.current.zoom(), '容器尺寸:', {
              width: containerRef.current?.offsetWidth,
              height: containerRef.current?.offsetHeight
            })
          }
        }
      }
    }, 2000) // 2秒后强制显示（缩短超时时间）
    
    layoutInstance.one('layoutstop', () => {
      console.log('布局完成，开始显示节点动画')
      // 清除超时器（布局成功完成）
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
      
      // 布局完成后，动画显示新节点（弹动效果：从中心弹入）
      const newNodes = cyRef.current.nodes('.new-node')
      console.log('新节点数量:', newNodes.length, '总节点数:', cyRef.current.nodes().length)
      if (newNodes.length > 0) {
        newNodes.forEach((node: any, index: number) => {
          const level = node.data('level') || 1
          const size = level === 1 ? 120 : level === 2 ? 100 : level === 3 ? 90 : 80
          const opacity = node.data('highlighted') ? 1 : (categoryFilter && node.data('category') !== categoryFilter ? 0.3 : 1)
          
          // 延迟显示，创建依次出现的效果
          setTimeout(() => {
            if (cyRef.current && !cyRef.current.destroyed()) {
              try {
                // 检查节点是否仍然有效
                const nodeStyle = node.style('opacity')
                if (nodeStyle !== undefined) {
                  // 先设置稍大的尺寸，然后弹回正常尺寸（弹动效果）
                  node.style({
                    opacity: opacity,
                    width: size * 1.3, // 先放大1.3倍
                    height: size * 1.3
                  })
                  
                  // 弹回正常尺寸（弹动效果）
                  node.animate({
                    style: {
                      opacity: opacity,
                      width: size,
                      height: size
                    }
                  }, {
                    duration: 800,
                    easing: 'ease-out' // 使用内置缓动，不支持自定义函数
                  })
                }
              } catch (err) {
                // 节点已被删除，忽略错误
                console.log('节点已被删除，跳过动画:', node.id())
              }
            }
          }, index * 60) // 每个节点延迟60ms
        })
      }

      // 动画显示新边（延迟一点，让节点先出现，也有轻微弹动）
      setTimeout(() => {
        if (cyRef.current && !cyRef.current.destroyed()) {
          // 获取所有边（首次加载时显示所有边）
          const currentEdgeCount = cyRef.current.edges().length
          const allEdges = cyRef.current.edges()
          
          console.log('显示新边:', allEdges.length, '当前边总数:', currentEdgeCount)
          allEdges.forEach((edge: any, index: number) => {
            setTimeout(() => {
              // 检查 cytoscape 实例和边是否仍然有效
              if (cyRef.current && !cyRef.current.destroyed()) {
                try {
                  // 尝试访问边的样式，如果边已被删除会抛出错误
                  const currentOpacity = edge.style('opacity')
                  if (currentOpacity !== undefined) {
                    // 先设置稍粗的线，然后弹回正常粗细
                    edge.style({ opacity: 0.8, width: 3 })
                    
                    edge.animate({
                      style: {
                        opacity: 0.8,
                        width: 2
                      }
                    }, {
                      duration: 500,
                      easing: 'ease-out' // 使用内置缓动，不支持自定义函数
                    })
                  }
                } catch (err) {
                  // 边已被删除，忽略错误
                  console.log('边已被删除，跳过动画:', edge.id())
                }
              }
            }, index * 40)
          })
        }
      }, 300)
      
      // 移除临时类
      setTimeout(() => {
        if (cyRef.current && !cyRef.current.destroyed()) {
          const remainingNewNodes = cyRef.current.nodes('.new-node')
          console.log('移除临时类，剩余新节点:', remainingNewNodes.length)
          remainingNewNodes.removeClass('new-node')
        }
      }, 1500)
    })
    
    // 添加备用显示逻辑：如果布局超时，确保节点能显示
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
    }
    timeoutIdRef.current = setTimeout(() => {
      if (cyRef.current && !cyRef.current.destroyed()) {
        const newNodes = cyRef.current.nodes('.new-node')
        if (newNodes.length > 0) {
          console.warn('布局超时，强制显示节点:', newNodes.length)
          newNodes.forEach((node: any, index: number) => {
            const level = node.data('level') || 1
            const size = level === 1 ? 120 : level === 2 ? 100 : level === 3 ? 90 : 80
            const opacity = node.data('highlighted') ? 1 : (categoryFilter && node.data('category') !== categoryFilter ? 0.3 : 1)
            node.style({
              opacity: opacity,
              width: size,
              height: size
            })
            
            // 设置临时位置（网格布局）
            const allNodes = cyRef.current.nodes()
            const nodeIndex = allNodes.indexOf(node)
            node.position({
              x: (nodeIndex % 10) * 100 + 200,
              y: Math.floor(nodeIndex / 10) * 100 + 200
            })
            
            node.removeClass('new-node')
          })
          
          cyRef.current.edges().forEach((edge: any) => {
            edge.style({ opacity: 0.8, width: 2 })
          })
          
          // 确保视图更新和适应
          cyRef.current.resize()
          
          const allNodes = cyRef.current.nodes()
          if (allNodes.length > 0) {
            // 适应所有节点
            cyRef.current.fit(allNodes, 50)
            
            // 确保缩放合理（不要太小）
            const zoom = cyRef.current.zoom()
            if (zoom < 0.2 || !isFinite(zoom)) {
              // 如果缩放太小，设置为合适的值
              const extent = allNodes.boundingBox()
              const containerWidth = containerRef.current?.offsetWidth || 800
              const containerHeight = containerRef.current?.offsetHeight || 600
              const idealZoom = Math.min(
                (containerWidth - 100) / extent.w,
                (containerHeight - 100) / extent.h
              )
              const finalZoom = Math.max(0.3, Math.min(idealZoom || 0.5, 1.5))
              cyRef.current.zoom(finalZoom)
              cyRef.current.center()
            }
            
            console.log('✅ 超时显示完成，视图已更新，节点数:', allNodes.length, '最终缩放:', cyRef.current.zoom(), '容器尺寸:', {
              width: containerRef.current?.offsetWidth,
              height: containerRef.current?.offsetHeight
            })
          }
        }
      }
    }, 3000) // 3秒后强制显示
    
    // 确保布局运行
    try {
      console.log('启动布局:', layout, '节点数:', cyRef.current.nodes().length, '边数:', cyRef.current.edges().length)
      layoutInstance.run()
      console.log('布局已启动')
    } catch (err) {
      console.error('布局运行失败:', err)
      // 如果布局失败，至少显示节点
      if (cyRef.current && !cyRef.current.destroyed()) {
        const allNodes = cyRef.current.nodes()
        console.log('布局失败，强制显示所有节点:', allNodes.length)
        allNodes.forEach((node: any) => {
          const level = node.data('level') || 1
          const size = level === 1 ? 120 : level === 2 ? 100 : level === 3 ? 90 : 80
          const opacity = node.data('highlighted') ? 1 : (categoryFilter && node.data('category') !== categoryFilter ? 0.3 : 1)
          node.style({
            opacity: opacity,
            width: size,
            height: size
          })
          node.removeClass('new-node')
        })
        cyRef.current.edges().forEach((edge: any) => {
          edge.style({ opacity: 0.8, width: 2 })
        })
      }
    }
    
    // 清理超时器
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
    }
  }, [nodes, edges, layout, searchQuery, categoryFilter, levelFilter, codePrefixFilter])

  // 暴露方法给父组件 - 带动画
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      const cy = cyRef.current
      if (cy && !cy.destroyed()) {
        const currentZoom = cy.zoom()
        const newZoom = Math.min(currentZoom * 1.25, 2)
        // 先放大一点，再弹回（弹动效果）
        cy.animate({
          zoom: newZoom * 1.1
        }, {
          duration: 200,
          easing: 'ease-out',
          complete: () => {
            if (cy && !cy.destroyed()) {
              cy.animate({
                zoom: newZoom
              }, {
                duration: 400,
                easing: 'ease-out' // 使用内置缓动，不支持自定义函数
              })
            }
          }
        })
        if (onZoomChange) {
          onZoomChange(newZoom)
        }
      }
    },
    zoomOut: () => {
      const cy = cyRef.current
      if (cy && !cy.destroyed()) {
        const currentZoom = cy.zoom()
        const newZoom = Math.max(currentZoom * 0.8, 0.1)
        // 先缩小一点，再弹回（弹动效果）
        cy.animate({
          zoom: newZoom * 0.9
        }, {
          duration: 200,
          easing: 'ease-out',
          complete: () => {
            if (cy && !cy.destroyed()) {
              cy.animate({
                zoom: newZoom
              }, {
                duration: 400,
                easing: 'ease-out' // 使用内置缓动，不支持自定义函数
              })
            }
          }
        })
        if (onZoomChange) {
          onZoomChange(newZoom)
        }
      }
    },
    resetZoom: () => {
      const cy = cyRef.current
      if (cy && !cy.destroyed()) {
        // 弹动回中心
        cy.animate({
          zoom: 1.2
        }, {
          duration: 300,
          easing: 'ease-out',
          complete: () => {
            if (cy && !cy.destroyed()) {
              cy.animate({
                zoom: 1
              }, {
                duration: 500,
                easing: 'ease-out', // 使用内置缓动，不支持自定义函数
                complete: () => {
                  if (cy && !cy.destroyed()) {
                    cy.center()
                  }
                }
              })
            }
          }
        })
        if (onZoomChange) {
          onZoomChange(1)
        }
      }
    },
    fit: () => {
      const cy = cyRef.current
      if (cy && !cy.destroyed()) {
        cy.fit(undefined, 50)
        const targetZoom = cy.zoom()
        // 先放大一点，再弹回（弹动效果）
        cy.animate({
          zoom: targetZoom * 1.15
        }, {
          duration: 300,
          easing: 'ease-out',
          complete: () => {
            if (cy && !cy.destroyed()) {
              cy.animate({
                zoom: targetZoom
              }, {
                duration: 600,
                easing: 'ease-out' // 使用内置缓动，不支持自定义函数
              })
            }
          }
        })
        if (onZoomChange) {
          onZoomChange(targetZoom)
        }
      }
    },
    exportPNG: (filename?: string) => {
      const cy = cyRef.current
      if (!cy || cy.destroyed()) {
        console.error('Cytoscape实例未初始化')
        return
      }
      try {
        const png = cy.png({
          output: 'blob',
          bg: '#2B2B2B',  // Neo4j深色背景
          full: true,
          scale: 2
        })
        
        const url = URL.createObjectURL(png)
        const link = document.createElement('a')
        link.download = filename || `graph-export-${Date.now()}.png`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
      } catch (err) {
        console.error('导出PNG失败:', err)
      }
    },
    exportJSON: () => {
      const cy = cyRef.current
      if (!cy || cy.destroyed()) {
        return null
      }
      try {
        const elements = cy.json().elements
        return {
          nodes: elements.nodes || [],
          edges: elements.edges || []
        }
      } catch (err) {
        console.error('导出JSON失败:', err)
        return null
      }
    }
  }))

  return (
    <div 
      ref={containerRef} 
      style={{
        ...style,
        width: style?.width || '100%',
        height: style?.height || '600px',
        minHeight: '400px',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        backgroundColor: '#2B2B2B',  // Neo4j深色背景
        position: 'relative',
        overflow: 'visible' // 确保内容不被裁剪
      }} 
    />
  )
})

CytoscapeGraph.displayName = 'CytoscapeGraph'

export default CytoscapeGraph
