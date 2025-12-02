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
if (typeof window !== 'undefined') {
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
  
  // 立即设置到 window 对象（必须在 dagre 加载前）
  // 这是最关键的一步：必须在任何 dagre 模块加载前设置
  (window as any).graphlib = graphlib
  (window as any)._ = dagreLodash  // dagre/lib/lodash.js 的回退位置
  (window as any).lodash = lodash
  
  // 创建 require 函数（dagre/lib/lodash.js 会使用）
  if (typeof (window as any).require === 'undefined') {
    (window as any).require = (id: string) => {
      if (id === 'graphlib') return graphlib
      if (id === 'lodash') return dagreLodash
      if (id.startsWith('lodash/')) {
        const method = id.split('/')[1]
        return dagreLodash[method as keyof typeof dagreLodash] || (lodash as any)[method]
      }
      throw new Error(`Cannot find module '${id}'`)
    }
  }
  
  // 标记已初始化
  (window as any).__graphlib_initialized__ = true
}

// 导出空对象，确保这是一个有效的模块
export {}

