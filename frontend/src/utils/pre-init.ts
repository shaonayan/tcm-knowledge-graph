/**
 * 预初始化脚本 - 必须在所有其他模块加载前执行
 * 这个文件会被 main.tsx 最先导入，确保 graphlib 和 lodash 在 dagre 加载前可用
 * 
 * 注意：这个文件使用同步导入，确保在模块加载时立即执行
 */

// 同步导入（必须在文件顶部）
// @ts-ignore - graphlib 是 CommonJS 模块
import graphlib from 'graphlib'
// @ts-ignore - lodash 是 CommonJS 模块，使用默认导入
import lodash from 'lodash'

// 立即执行初始化（不等待其他代码）
// 必须在任何 dagre 模块加载之前执行
if (typeof window !== 'undefined') {
  // 第一步：立即设置 window.graphlib（必须在任何 require 调用之前）
  // dagre/lib/graphlib.js 在模块加载时会立即执行，所以必须在此之前设置
  // 这是最关键的一步：必须在 dagre/lib/graphlib.js 执行之前设置
  // 创建一个包装函数，保留原有属性，使其可以作为函数调用
  const graphlibWrapper = function(...args: any[]) {
    // 如果调用时没有参数或第一个参数是对象，可能是在尝试创建新图
    if (args.length === 0 || typeof args[0] === 'object') {
      return new (graphlib as any).Graph(...args);
    }
    return graphlib;
  };
  
  // 复制所有原始 graphlib 的属性到包装函数
  Object.assign(graphlibWrapper, graphlib);
  
  // 立即挂载包装后的 graphlib（必须在任何其他操作之前）
  (window as any).graphlib = graphlibWrapper;
  
  // 验证 graphlib 是否正确设置
  if (!(window as any).graphlib || !(window as any).graphlib.Graph) {
    console.error('[pre-init] graphlib 设置失败:', {
      graphlib: !!(window as any).graphlib,
      hasGraph: !!(window as any).graphlib?.Graph,
    })
  }
  
  // 验证 lodash 是否正确导入
  if (!lodash) {
    console.error('[pre-init] lodash 未正确导入')
    throw new Error('lodash 未正确导入')
  }
  
  // 第二步：预构建 dagre 需要的 lodash 对象（必须在设置 window.require 之前完成）
  // 确保所有方法都存在且是函数
  const dagreLodash: any = {}
  
  // 安全地获取 lodash 方法
  const getLodashMethod = (name: string) => {
    try {
      const method = (lodash as any)[name]
      if (typeof method === 'function') {
        return method
      }
      // 如果直接访问失败，尝试从 default 属性获取
      if (lodash && typeof (lodash as any).default === 'object') {
        const defaultMethod = (lodash as any).default[name]
        if (typeof defaultMethod === 'function') {
          return defaultMethod
        }
      }
      console.warn(`[pre-init] lodash.${name} 不是函数`)
      return undefined
    } catch (e) {
      console.warn(`[pre-init] 获取 lodash.${name} 时出错:`, e)
      return undefined
    }
  }
  
  // 构建 dagre 需要的 lodash 方法集合
  const methods = [
    'cloneDeep', 'constant', 'defaults', 'each', 'filter', 'find',
    'flatten', 'forEach', 'forIn', 'has', 'isUndefined', 'last',
    'map', 'mapValues', 'max', 'merge', 'min', 'minBy', 'now',
    'pick', 'range', 'reduce', 'sortBy', 'uniqueId', 'values', 'zipObject'
  ]
  
  methods.forEach(method => {
    const func = getLodashMethod(method)
    if (func) {
      dagreLodash[method] = func
    }
  })
  
  // 验证关键方法是否存在
  if (!dagreLodash.constant) {
    console.error('[pre-init] 关键方法 constant 缺失！')
  }
  if (!dagreLodash.zipObject) {
    console.error('[pre-init] 关键方法 zipObject 缺失！')
  }
  
  // 第三步：设置 window._（dagre/lib/lodash.js 的回退位置）
  // 必须在 require 函数设置之前设置，因为 dagre/lib/lodash.js 会立即访问
  // 确保 dagreLodash 是一个有效的对象
  if (!dagreLodash || typeof dagreLodash !== 'object') {
    console.error('[pre-init] dagreLodash 不是有效对象:', dagreLodash)
    throw new Error('dagreLodash 初始化失败')
  }
  (window as any)._ = dagreLodash
  (window as any).lodash = lodash
  
  // 第四步：设置 window.require（必须在 dagre 模块加载之前）
  // 这样 dagre/lib/graphlib.js 和 dagre/lib/lodash.js 中的 require 调用就能正确工作
  // dagre/lib/lodash.js 会先尝试 require("lodash/cloneDeep") 等，如果失败，会回退到 window._
  if (typeof (window as any).require === 'undefined') {
    (window as any).require = (id: string) => {
      try {
        // 处理绝对路径模块
        if (id === 'graphlib') return graphlib
        if (id === 'lodash') return dagreLodash
        
        // 处理相对路径（dagre/lib/graphlib.js 使用 require("./graphlib")）
        // 相对路径会被 Rollup 转换为绝对路径，但我们需要确保能处理
        if (id.includes('graphlib')) {
          return graphlib
        }
        
        // 处理 lodash 子模块（dagre/lib/lodash.js 会 require("lodash/constant") 等）
        if (id.startsWith('lodash/')) {
          const method = id.split('/')[1]
          if (!method) {
            console.warn(`[pre-init] Invalid lodash module path: '${id}'`)
            return undefined
          }
          const func = dagreLodash[method as keyof typeof dagreLodash]
          if (func && typeof func === 'function') return func
          // 如果预构建对象中没有，尝试从完整 lodash 中获取
          const fallback = (lodash as any)[method]
          if (fallback && typeof fallback === 'function') return fallback
          console.warn(`[pre-init] lodash method '${method}' not found for require('${id}')`)
          return undefined
        }
        
        // 如果无法解析，尝试从 window 对象获取
        // dagre/lib/graphlib.js 会回退到 window.graphlib
        if (id.includes('graphlib')) {
          return (window as any).graphlib || graphlib
        }
        
        throw new Error(`Cannot find module '${id}'`)
      } catch (e) {
        console.error(`[pre-init] require('${id}') failed:`, e)
        return undefined
      }
    }
  }
  
  // 标记已初始化
  (window as any).__graphlib_initialized__ = true
  
  // 调试日志（始终输出，帮助排查问题）
  console.log('[pre-init] graphlib and lodash initialized for dagre', {
    graphlib: !!graphlib,
    graphlibGraph: !!graphlib?.Graph,
    lodash: !!lodash,
    dagreLodash: !!dagreLodash,
    constant: typeof dagreLodash.constant,
    windowGraphlib: !!(window as any).graphlib,
    windowGraphlibGraph: !!(window as any).graphlib?.Graph,
  })
}

// 导出空对象，确保这是一个有效的模块
export {}

