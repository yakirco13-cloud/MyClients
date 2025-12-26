export default function Loading() {
  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      {/* Stats Row Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e9eef4',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <Skeleton width={80} height={14} />
              <Skeleton width={44} height={44} borderRadius={12} />
            </div>
            <Skeleton width={100} height={32} />
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e9eef4',
        }}>
          <Skeleton width={120} height={20} style={{ marginBottom: '20px' }} />
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <Skeleton width={44} height={44} borderRadius={10} />
              <div style={{ flex: 1 }}>
                <Skeleton width="60%" height={14} style={{ marginBottom: '8px' }} />
                <Skeleton width="40%" height={12} />
              </div>
            </div>
          ))}
        </div>
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e9eef4',
        }}>
          <Skeleton width={100} height={16} style={{ marginBottom: '16px' }} />
          <Skeleton width="100%" height={80} borderRadius={8} />
        </div>
      </div>
    </div>
  )
}

function Skeleton({ width, height, borderRadius = 8, style = {} }: {
  width: number | string
  height: number
  borderRadius?: number
  style?: React.CSSProperties
}) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style,
    }} />
  )
}