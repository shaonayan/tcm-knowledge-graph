// 用户偏好设置管理工具

export interface UserPreferences {
  // 图谱探索器设置
  explorer: {
    layout: 'dagre' | 'breadthfirst' | 'grid' | 'circle'
    depth: number
    limit: number
    defaultRootCode?: string
  }
  // 搜索设置
  search: {
    defaultCategory?: string
    defaultLevel?: number
    showHistory: boolean
    historyLimit: number
  }
  // 可视化设置
  visualization: {
    theme: 'light' | 'dark'
    nodeSize: 'small' | 'medium' | 'large'
    showLabels: boolean
  }
  // 3D视图设置
  graph3d: {
    layout: 'force' | 'spherical' | 'grid'
    cameraDistance: number
    showLabels: boolean
    showEdges: boolean
  }
}

const DEFAULT_PREFERENCES: UserPreferences = {
  explorer: {
    layout: 'dagre',
    depth: 2,
    limit: 100,
    defaultRootCode: undefined
  },
  search: {
    defaultCategory: undefined,
    defaultLevel: undefined,
    showHistory: true,
    historyLimit: 10
  },
  visualization: {
    theme: 'light',
    nodeSize: 'medium',
    showLabels: true
  },
  graph3d: {
    layout: 'force',
    cameraDistance: 10,
    showLabels: true,
    showEdges: true
  }
}

const STORAGE_KEY = 'tcm-knowledge-graph-preferences'

/**
 * 获取用户偏好设置
 */
export function getPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // 合并默认设置，确保所有字段都存在
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
        explorer: {
          ...DEFAULT_PREFERENCES.explorer,
          ...parsed.explorer
        },
        search: {
          ...DEFAULT_PREFERENCES.search,
          ...parsed.search
        },
        visualization: {
          ...DEFAULT_PREFERENCES.visualization,
          ...parsed.visualization
        },
        graph3d: {
          ...DEFAULT_PREFERENCES.graph3d,
          ...parsed.graph3d
        }
      }
    }
  } catch (err) {
    console.error('读取用户偏好设置失败:', err)
  }
  return DEFAULT_PREFERENCES
}

/**
 * 保存用户偏好设置
 */
export function savePreferences(preferences: Partial<UserPreferences>): void {
  try {
    const current = getPreferences()
    const updated = {
      ...current,
      ...preferences,
      explorer: {
        ...current.explorer,
        ...preferences.explorer
      },
      search: {
        ...current.search,
        ...preferences.search
      },
      visualization: {
        ...current.visualization,
        ...preferences.visualization
      },
      graph3d: {
        ...current.graph3d,
        ...preferences.graph3d
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('保存用户偏好设置失败:', err)
  }
}

/**
 * 重置用户偏好设置
 */
export function resetPreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('重置用户偏好设置失败:', err)
  }
}

/**
 * 获取特定模块的偏好设置
 */
export function getModulePreferences<K extends keyof UserPreferences>(
  module: K
): UserPreferences[K] {
  const prefs = getPreferences()
  return prefs[module]
}

/**
 * 保存特定模块的偏好设置
 */
export function saveModulePreferences<K extends keyof UserPreferences>(
  module: K,
  preferences: Partial<UserPreferences[K]>
): void {
  const current = getPreferences()
  savePreferences({
    [module]: {
      ...current[module],
      ...preferences
    }
  } as Partial<UserPreferences>)
}

