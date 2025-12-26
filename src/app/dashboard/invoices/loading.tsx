export default function Loading() {
  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e9eef4',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Skeleton width={36} height={36} borderRadius={8} />
              <Skeleton width={80} height={12} />
            </div>
            <Skeleton width={100} height={28} />
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
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e9eef4', background: '#f8fafc' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 2fr 1fr 1fr 100px 100px', gap: '16px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} width={50} height={12} />
            ))}
          </div>
        </div>
        
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '80px 2fr 1fr 1fr 100px 100px',
            gap: '16px',
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
            alignItems: 'center',
          }}>
            <Skeleton width={50} height={14} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Skeleton width={40} height={40} borderRadius={10} />
              <Skeleton width={100} height={14} />
            </div>
            <Skeleton width={70} height={14} />
            <Skeleton width={70} height={14} />
            <Skeleton width={60} height={24} borderRadius={6} />
            <Skeleton width={70} height={32} borderRadius={8} />
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