/**
 * Subscription tier configuration
 */

export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free版',
    price: 0,
    points: 500,
    storage: 5 * 1024 * 1024 * 1024, // 5GB in bytes
    features: [
      '500积分，永久有效',
      '5GB 云存储空间',
      '基础功能体验',
      '支持导出视频'
    ]
  },
  basic: {
    name: 'Basic版',
    price: 9.79,
    points: 1500,
    storage: 10 * 1024 * 1024 * 1024, // 10GB
    features: [
      '1500 credits/月，按月清零',
      '支持导出基础版PPT',
      '基础讲解风格(幽默课堂/严谨学术)',
      '10GB 云存储空间'
    ]
  },
  plus: {
    name: 'Plus版',
    price: 19.49,
    points: 5000,
    storage: 30 * 1024 * 1024 * 1024, // 30GB
    features: [
      '包含Basic版所有功能',
      '5000 credits/月，按月清零',
      '20+讲解风格解锁',
      '30GB 云存储空间'
    ]
  },
  pro: {
    name: 'Pro版',
    price: 49.99,
    points: 100000,
    storage: 100 * 1024 * 1024 * 1024, // 100GB
    features: [
      '包含Plus版所有功能',
      '100,000 credits/月，按月清零',
      '20+讲解风格解锁',
      '100GB 云存储空间',
      '优先支持'
    ]
  }
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Get storage limit for a subscription tier
 */
export function getStorageLimit(tier: string): number {
  return SUBSCRIPTION_TIERS[tier as SubscriptionTier]?.storage || SUBSCRIPTION_TIERS.free.storage
}

/**
 * Get points limit for a subscription tier
 */
export function getPointsLimit(tier: string): number {
  return SUBSCRIPTION_TIERS[tier as SubscriptionTier]?.points || SUBSCRIPTION_TIERS.free.points
}
