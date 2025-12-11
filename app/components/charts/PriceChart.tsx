import dynamic from 'next/dynamic'

export const PriceChart = dynamic(
  () => import('./PriceChartClient').then(mod => ({ default: mod.PriceChartClient })),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Loading chart...
          </div>
        </div>
        <div style={{ height: '450px', background: '#0a0a0a' }} />
      </div>
    )
  }
)
