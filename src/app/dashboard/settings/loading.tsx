export default function Loading() {
  return (
    <div style={{ display: 'flex', gap: '28px', animation: 'fadeIn 0.2s ease' }}>
      {/* Sidebar */}
      <div style={{ width: '240px', flexShrink: 0 }}>
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          border: '1px solid #e9eef4',
          overflow: 'hidden',
        }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Skeleton width={18} height={18} borderRadius={4} />
              <Skeleton width={80} height={14} />
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          border: '1px solid #e9eef4',
          padding: '32px',
        }}>
          <Skeleton width={150} height={24} style={{ marginBottom: '8px' }} />
          <Skeleton width={250} height={14} style={{ marginBottom: '28px' }} />

          <div style={{ display: 'grid', gap: '20px', maxWidth: '600px' }}>
            <div>
              <Skeleton width={80} height={12} style={{ marginBottom: '8px' }} />
              <Skeleton width="100%" height={44} borderRadius={8} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <Skeleton width={80} height={12} style={{ marginBottom: '8px' }} />
                <Skeleton width="100%" height={44} borderRadius={8} />
              </div>
              <div>
                <Skeleton width={60} height={12} style={{ marginBottom: '8px' }} />
                <Skeleton width="100%" height={44} borderRadius={8} />
              </div>
            </div>
            <Skeleton width={120} height={44} borderRadius={10} />
          </div>
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