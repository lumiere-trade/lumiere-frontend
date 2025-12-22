// Legacy single-panel charts
export { TradingChart } from './TradingChart'
export { EquityCurve } from './EquityCurve'
export { DrawdownChart } from './DrawdownChart'
export { PnLChart } from './PnLChart'

// Multi-panel chart system
export { MultiPanelChart } from './MultiPanelChart'
export { IndicatorTogglePanel } from './IndicatorTogglePanel'
export { SharedViewportProvider, useSharedViewport } from './SharedViewportContext'

// Types
export type { Candle, Trade, Indicator, Mode } from './types'
export type { PanelConfig, PanelType, IndicatorPlacement } from './panelTypes'
