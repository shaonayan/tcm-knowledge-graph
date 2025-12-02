/**
 * 初始化 graphlib 和 lodash，供 dagre 使用
 * dagre 使用 CommonJS 的 require，需要这些模块在全局可用
 */

// 同步导入 graphlib（CommonJS 模块）
// @ts-ignore - graphlib 是 CommonJS 模块
import graphlib from 'graphlib'

// 同步导入 lodash（dagre 内部需要）
import lodash from 'lodash'

if (typeof window !== 'undefined') {
  // 预构建 dagre 需要的 lodash 对象（包含所有需要的方法）
  // 必须在所有其他操作之前设置，因为 dagre/lib/lodash.js 在模块加载时就会执行
  // 同时使其可以作为函数调用（因为 dagre 会调用 _()）
  const dagreLodash = function(value: any) {
    if (value === undefined) return dagreLodash;
    return lodash(value);
  };
  
  // 添加所有必需的方法到 dagreLodash
  Object.assign(dagreLodash, {
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
  });
  
  // 第一步：立即设置 window._（dagre/lib/lodash.js 的回退位置）
  // 必须在 require 函数之前设置！
  (window as any)._ = dagreLodash
  
  // 第二步：挂载 graphlib 到全局，使其也可以作为函数调用
  // 创建一个包装函数，保留原有属性
  const graphlibWrapper = function(...args: any[]) {
    // 如果调用时没有参数或第一个参数是对象，可能是在尝试创建新图
    if (args.length === 0 || typeof args[0] === 'object') {
      return new (graphlib as any).Graph(...args);
    }
    return graphlib;
  };
  
  // 复制所有原始 graphlib 的属性到包装函数
  Object.assign(graphlibWrapper, graphlib);
  
  // 挂载包装后的 graphlib
  (window as any).graphlib = graphlibWrapper;
  
  // 第三步：挂载 lodash 到全局（作为后备）
  (window as any).lodash = lodash
  
  // 第四步：创建或更新 require 函数供 dagre 使用
  // dagre/lib/lodash.js 会尝试 require("lodash/constant") 等子模块
  // dagre/lib/graphlib.js 会尝试 require("graphlib") 或 require("./graphlib")
  if (typeof (window as any).require === 'undefined') {
    (window as any).require = (id: string) => {
      // 处理绝对路径模块
      if (id === 'graphlib') return graphlib
      if (id === 'lodash') return dagreLodash
      
      // 处理相对路径（dagre/lib/graphlib.js 使用 require("./graphlib")）
      if (id.includes('graphlib')) {
        return graphlib
      }
      
      // 处理 lodash 的子模块
      if (id.startsWith('lodash/')) {
        const method = id.split('/')[1]
        const methodFunc = dagreLodash[method as keyof typeof dagreLodash]
        if (typeof methodFunc === 'function') {
          return methodFunc
        }
        // 如果方法不存在，尝试从完整 lodash 中获取
        const fallbackFunc = (lodash as any)[method]
        if (typeof fallbackFunc === 'function') {
          return fallbackFunc
        }
        console.warn(`lodash method '${method}' not found`)
        return undefined
      }
      
      // 如果无法解析，尝试从 window 对象获取
      if (id.includes('graphlib')) {
        return (window as any).graphlib || graphlib
      }
      
      throw new Error(`Cannot find module '${id}'`)
    }
  }
  
  // 验证初始化
  if (!graphlib || !graphlib.Graph || !graphlib.alg) {
    console.error('graphlib 初始化失败:', graphlib)
  }
  if (!lodash) {
    console.error('lodash 初始化失败')
  }
}

export {}

