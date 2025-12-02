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
  // 挂载 graphlib 到全局
  (window as any).graphlib = graphlib
  
  // 挂载 lodash 到全局（dagre/lib/lodash.js 需要）
  // dagre/lib/lodash.js 回退到 window._，所以我们需要挂载到两个位置
  (window as any).lodash = lodash
  (window as any)._ = lodash  // dagre 期望的位置
  
  // 创建 require 函数供 dagre 使用
  // dagre/lib/lodash.js 会尝试 require("lodash/constant") 等子模块
  if (typeof (window as any).require === 'undefined') {
    (window as any).require = (id: string) => {
      if (id === 'graphlib') {
        return graphlib
      }
      if (id === 'lodash') {
        return lodash
      }
      // 处理 lodash 的子模块，如 lodash/constant, lodash/cloneDeep 等
      if (id.startsWith('lodash/')) {
        const method = id.split('/')[1]
        const methodFunc = (lodash as any)[method]
        if (typeof methodFunc === 'function') {
          return methodFunc
        }
        // 如果方法不存在，尝试从 lodash 对象中获取
        console.warn(`lodash method '${method}' not found directly, checking lodash object`)
        return undefined
      }
      throw new Error(`Cannot find module '${id}'`)
    }
  }
  
  // 预构建 dagre 需要的 lodash 对象（包含所有需要的方法）
  // 这样即使 require 失败，dagre/lib/lodash.js 也能从 window._ 获取
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
  
  // 确保 window._ 包含所有 dagre 需要的方法
  (window as any)._ = dagreLodash
  
  // 验证初始化
  if (!graphlib || !graphlib.Graph || !graphlib.alg) {
    console.error('graphlib 初始化失败:', graphlib)
  }
  if (!lodash) {
    console.error('lodash 初始化失败')
  }
}

export {}

