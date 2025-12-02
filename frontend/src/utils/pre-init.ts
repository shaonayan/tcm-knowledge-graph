/**
 * 预初始化脚本 - 必须在所有其他模块加载前执行
 * 这个文件会被 main.tsx 最先导入，确保 graphlib 和 lodash 在 dagre 加载前可用
 * 
 * 注意：这个文件使用同步导入，确保在模块加载时立即执行
 */

// 同步导入（必须在文件顶部）
// @ts-ignore - graphlib 是 CommonJS 模块
import graphlib from 'graphlib'
import lodash from 'lodash'

// 立即执行初始化（不等待其他代码）
// 必须在任何 dagre 模块加载之前执行
if (typeof window !== 'undefined') {
  // 立即设置 window.graphlib（必须在任何 require 调用之前）
  // dagre/lib/graphlib.js 在模块加载时会立即执行，所以必须在此之前设置
  (window as any).graphlib = graphlib
  // 预构建 dagre 需要的 lodash 对象
  const dagreLodash = {
    cloneDeep: lodash.cloneDeep,
    constant: lodash.constant,
    defaults: lodash.defaults,
    each: lodash.each,
    filter: lodash.filter,
    find: lodash.find,
    flatten: lodash.flatten,
    forEach: lodash.forEach,
    forIn: lodash.forIn,
    has: lodash.has,
    isUndefined: lodash.isUndefined,
    last: lodash.last,
    map: lodash.map,
    mapValues: lodash.mapValues,
    max: lodash.max,
    merge: lodash.merge,
    min: lodash.min,
    minBy: lodash.minBy,
    now: lodash.now,
    pick: lodash.pick,
    range: lodash.range,
    reduce: lodash.reduce,
    sortBy: lodash.sortBy,
    uniqueId: lodash.uniqueId,
    values: lodash.values,
    zipObject: lodash.zipObject,
  }
  
  // 继续设置其他全局变量
  (window as any)._ = dagreLodash  // dagre/lib/lodash.js 的回退位置
  (window as any).lodash = lodash
  
  // 创建 require 函数（dagre/lib/lodash.js 和 dagre/lib/graphlib.js 会使用）
  // 这个函数会在 dagre 尝试 require("lodash/constant") 或 require("graphlib") 时被调用
  // 注意：dagre 使用相对路径 require("./graphlib")，我们需要处理这种情况
  if (typeof (window as any).require === 'undefined') {
    (window as any).require = (id: string) => {
      // 处理绝对路径模块
      if (id === 'graphlib') return graphlib
      if (id === 'lodash') return dagreLodash
      
      // 处理相对路径（dagre/lib/graphlib.js 使用 require("./graphlib")）
      // 相对路径会被 Rollup 转换为绝对路径，但我们需要确保能处理
      if (id.includes('graphlib')) {
        return graphlib
      }
      
      // 处理 lodash 子模块
      if (id.startsWith('lodash/')) {
        const method = id.split('/')[1]
        const func = dagreLodash[method as keyof typeof dagreLodash]
        if (func) return func
        // 如果预构建对象中没有，尝试从完整 lodash 中获取
        const fallback = (lodash as any)[method]
        if (fallback) return fallback
        console.warn(`lodash method '${method}' not found for require('${id}')`)
        return undefined
      }
      
      // 如果无法解析，尝试从 window 对象获取
      // dagre/lib/graphlib.js 会回退到 window.graphlib
      if (id.includes('graphlib')) {
        return (window as any).graphlib || graphlib
      }
      
      throw new Error(`Cannot find module '${id}'`)
    }
  }
  
  // 标记已初始化
  (window as any).__graphlib_initialized__ = true
  
  // 调试日志（生产环境可以移除）
  if (process.env.NODE_ENV === 'development') {
    console.log('[pre-init] graphlib and lodash initialized for dagre', {
      graphlib: !!graphlib,
      lodash: !!lodash,
      dagreLodash: !!dagreLodash,
      constant: typeof dagreLodash.constant,
    })
  }
}

// 导出空对象，确保这是一个有效的模块
export {}

