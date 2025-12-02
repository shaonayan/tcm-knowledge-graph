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
  (window as any).lodash = lodash
  
  // 创建 require 函数供 dagre 使用
  if (typeof (window as any).require === 'undefined') {
    (window as any).require = (id: string) => {
      if (id === 'graphlib') {
        return graphlib
      }
      if (id === 'lodash') {
        return lodash
      }
      // 处理 lodash 的子模块
      if (id.startsWith('lodash/')) {
        const method = id.split('/')[1]
        return (lodash as any)[method]
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

