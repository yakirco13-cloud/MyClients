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
            <Skeleton width={60} height={28} />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Skeleton width={300} height={44} borderRadius={10} />
        <Skeleton width={140} height={44} borderRadius={10} />
      </div>

      {/* Table */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e9eef4',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e9eef4', background: '#f8fafc' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px 60px', gap: '16px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} width={60} height={12} />
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 100px 60px',
            gap: '16px',
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Skeleton width={44} height={44} borderRadius={10} />
              <div>
                <Skeleton width={120} height={14} style={{ marginBottom: '6px' }} />
                <Skeleton width={80} height={11} />
              </div>
            </div>
            <Skeleton width={80} height={14} />
            <Skeleton width={70} height={14} />
            <Skeleton width={60} height={14} />
            <Skeleton width={60} height={24} borderRadius={6} />
            <Skeleton width={24} height={24} borderRadius={6} />
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