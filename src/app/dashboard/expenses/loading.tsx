export default function Loading() {
  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e9eef4',
          }}>
            <Skeleton width={100} height={12} style={{ marginBottom: '12px' }} />
            <Skeleton width={80} height={28} />
          </div>
        ))}
      </div>

      {/* AI Banner Skeleton */}
      <div style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        opacity: 0.7,
      }}>
        <Skeleton width={200} height={20} style={{ marginBottom: '8px', background: 'rgba(255,255,255,0.2)' }} />
        <Skeleton width={300} height={14} style={{ background: 'rgba(255,255,255,0.15)' }} />
      </div>

      {/* Table */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e9eef4',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e9eef4', background: '#f8fafc' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px 80px', gap: '16px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} width={50} height={12} />
            ))}
          </div>
        </div>
        
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 100px 80px',
            gap: '16px',
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
            alignItems: 'center',
          }}>
            <Skeleton width={120} height={14} />
            <Skeleton width={70} height={14} />
            <Skeleton width={50} height={14} />
            <Skeleton width={70} height={14} />
            <Skeleton width={60} height={24} borderRadius={6} />
            <Skeleton width={60} height={32} borderRadius={6} />
          </div>
        ))}
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