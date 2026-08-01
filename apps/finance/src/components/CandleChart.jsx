import { useEffect, useRef } from 'react'
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts'

export default function CandleChart({ candles }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#7f92a6',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(29, 43, 58, 0.6)' },
        horzLines: { color: 'rgba(29, 43, 58, 0.6)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#2cc9ff', labelBackgroundColor: '#0b1119' },
        horzLine: { color: '#2cc9ff', labelBackgroundColor: '#0b1119' },
      },
      rightPriceScale: { borderColor: '#1d2b3a' },
      timeScale: { borderColor: '#1d2b3a' },
      autoSize: true,
    })

    const series = chart.addCandlestickSeries({
      upColor: '#00e599',
      downColor: '#ff4d6a',
      borderUpColor: '#00e599',
      borderDownColor: '#ff4d6a',
      wickUpColor: '#00e599',
      wickDownColor: '#ff4d6a',
    })

    chartRef.current = chart
    seriesRef.current = series

    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!seriesRef.current) return
    seriesRef.current.setData(candles)
    chartRef.current?.timeScale().fitContent()
  }, [candles])

  return <div ref={containerRef} style={{ height: 320, width: '100%' }} />
}
