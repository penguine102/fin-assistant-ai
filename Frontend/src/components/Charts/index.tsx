import React, { useMemo } from 'react'
import { colors } from '../../design-system'

// Chart Types
export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }[]
}

// Line Chart Component
interface LineChartProps {
  data: ChartData
  width?: number
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  animated?: boolean
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 400,
  height = 200,
  showGrid = true,
  showLegend = true,
  animated = true,
}) => {
  const maxValue = useMemo(() => {
    return Math.max(...data.datasets.flatMap(d => d.data))
  }, [data])

  const minValue = useMemo(() => {
    return Math.min(...data.datasets.flatMap(d => d.data))
  }, [data])

  const getYPosition = (value: number) => {
    return height - ((value - minValue) / (maxValue - minValue)) * height
  }

  const getXPosition = (index: number) => {
    return (index / (data.labels.length - 1)) * width
  }

  return (
    <div style={{ width, height, position: 'relative' }}>
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {showGrid && (
          <g>
            {Array.from({ length: 5 }).map((_, i) => {
              const y = (i / 4) * height
              return (
                <line
                  key={i}
                  x1={0}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke="rgba(0, 0, 0, 0.1)"
                  strokeWidth={1}
                />
              )
            })}
          </g>
        )}

        {/* Chart lines */}
        {data.datasets.map((dataset, datasetIndex) => (
          <g key={datasetIndex}>
            <path
              d={dataset.data
                .map((value, index) => {
                  const x = getXPosition(index)
                  const y = getYPosition(value)
                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
                })
                .join(' ')}
              fill="none"
              // @ts-ignore
              stroke={dataset.borderColor || colors.primary[500]}
              strokeWidth={dataset.borderWidth || 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: animated ? 'all 0.3s ease' : 'none',
              }}
            />
            
            {/* Data points */}
            {dataset.data.map((value, index) => {
              const x = getXPosition(index)
              const y = getYPosition(value)
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={4}
                  // @ts-ignore
                  // @ts-ignore
                  fill={dataset.backgroundColor || colors.primary[500]}
                  stroke="#ffffff"
                  strokeWidth={2}
                  style={{
                    transition: animated ? 'all 0.3s ease' : 'none',
                  }}
                />
              )
            })}
          </g>
        ))}

        {/* X-axis labels */}
        {data.labels.map((label, index) => {
          const x = getXPosition(index)
          return (
            <text
              key={index}
              x={x}
              y={height + 20}
              textAnchor="middle"
              fontSize="12"
              fill="rgba(0, 0, 0, 0.6)"
            >
              {label}
            </text>
          )
        })}

        {/* Y-axis labels */}
        {Array.from({ length: 5 }).map((_, i) => {
          const value = minValue + (i / 4) * (maxValue - minValue)
          const y = height - (i / 4) * height
          return (
            <text
              key={i}
              x={-10}
              y={y + 4}
              textAnchor="end"
              fontSize="12"
              fill="rgba(0, 0, 0, 0.6)"
            >
              {Math.round(value)}
            </text>
          )
        })}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div style={{ marginTop: '16px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
          {data.datasets.map((dataset, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  // @ts-ignore
                  backgroundColor: dataset.backgroundColor || colors.primary[500],
                  borderRadius: '2px',
                }}
              />
              <span style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.6)' }}>
                {dataset.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Bar Chart Component
interface BarChartProps {
  data: ChartData
  width?: number
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  animated?: boolean
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  width = 400,
  height = 200,
  showGrid = true,
  showLegend = true,
  animated = true,
}) => {
  const maxValue = useMemo(() => {
    return Math.max(...data.datasets.flatMap(d => d.data))
  }, [data])

  const barWidth = width / data.labels.length * 0.8
  const barSpacing = width / data.labels.length * 0.2

  return (
    <div style={{ width, height, position: 'relative' }}>
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {showGrid && (
          <g>
            {Array.from({ length: 5 }).map((_, i) => {
              const y = (i / 4) * height
              return (
                <line
                  key={i}
                  x1={0}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke="rgba(0, 0, 0, 0.1)"
                  strokeWidth={1}
                />
              )
            })}
          </g>
        )}

        {/* Bars */}
        {data.datasets.map((dataset, datasetIndex) => (
          <g key={datasetIndex}>
            {dataset.data.map((value, index) => {
              const barHeight = (value / maxValue) * height
              const x = index * (barWidth + barSpacing) + barSpacing / 2
              const y = height - barHeight
              
              return (
                <rect
                  key={index}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  // @ts-ignore
                  fill={dataset.backgroundColor || colors.primary[500]}
                  rx={4}
                  style={{
                    transition: animated ? 'all 0.3s ease' : 'none',
                  }}
                />
              )
            })}
          </g>
        ))}

        {/* X-axis labels */}
        {data.labels.map((label, index) => {
          const x = index * (barWidth + barSpacing) + barSpacing / 2 + barWidth / 2
          return (
            <text
              key={index}
              x={x}
              y={height + 20}
              textAnchor="middle"
              fontSize="12"
              fill="rgba(0, 0, 0, 0.6)"
            >
              {label}
            </text>
          )
        })}

        {/* Y-axis labels */}
        {Array.from({ length: 5 }).map((_, i) => {
          const value = (i / 4) * maxValue
          const y = height - (i / 4) * height
          return (
            <text
              key={i}
              x={-10}
              y={y + 4}
              textAnchor="end"
              fontSize="12"
              fill="rgba(0, 0, 0, 0.6)"
            >
              {Math.round(value)}
            </text>
          )
        })}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div style={{ marginTop: '16px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
          {data.datasets.map((dataset, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  // @ts-ignore
                  backgroundColor: dataset.backgroundColor || colors.primary[500],
                  borderRadius: '2px',
                }}
              />
              <span style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.6)' }}>
                {dataset.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Pie Chart Component
interface PieChartProps {
  data: { label: string; value: number; color: string }[]
  width?: number
  height?: number
  showLegend?: boolean
  animated?: boolean
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  width = 300,
  height = 300,
  showLegend = true,
  animated = true,
}) => {
  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0)
  }, [data])

  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 2 - 20

  let currentAngle = 0

  const createArcPath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle)
    const end = polarToCartesian(centerX, centerY, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
    
    return [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ")
  }

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    }
  }

  return (
    <div style={{ width, height, position: 'relative' }}>
      <svg width={width} height={height}>
        {data.map((item, index) => {
          const percentage = item.value / total
          const angle = percentage * 360
          const startAngle = currentAngle
          const endAngle = currentAngle + angle
          
          currentAngle += angle

          return (
            <path
              key={index}
              d={createArcPath(startAngle, endAngle)}
              fill={item.color}
              stroke="#ffffff"
              strokeWidth={2}
              style={{
                transition: animated ? 'all 0.3s ease' : 'none',
              }}
            />
          )
        })}
      </svg>

      {/* Center text */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.8)' }}>
          {total}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.6)' }}>
          Total
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.map((item, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: item.color,
                  borderRadius: '2px',
                }}
              />
              <span style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.6)' }}>
                {item.label} ({Math.round((item.value / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Progress Ring Component
interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  animated?: boolean
  showPercentage?: boolean
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'var(--color-primary)',
  backgroundColor = 'rgba(0, 0, 0, 0.1)',
  animated = true,
  showPercentage = true,
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: animated ? 'stroke-dashoffset 0.5s ease-in-out' : 'none',
          }}
        />
      </svg>

      {/* Percentage text */}
      {showPercentage && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.8)' }}>
            {Math.round(progress)}%
          </div>
        </div>
      )}
    </div>
  )
}

// Stats Card Component
interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  icon?: React.ReactNode
  color?: string
  trend?: 'up' | 'down' | 'neutral'
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  color = 'var(--color-primary)',
  trend = 'neutral',
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return colors.success[500]
      case 'down':
        return colors.error[500]
      default:
        return colors.gray[500]
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗'
      case 'down':
        return '↘'
      default:
        return '→'
    }
  }

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'rgba(0, 0, 0, 0.6)' }}>
          {title}
        </h3>
        {icon && (
          <div style={{ color, fontSize: '20px' }}>
            {icon}
          </div>
        )}
      </div>
      
      <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.8)', marginBottom: '8px' }}>
        {value}
      </div>
      
      {change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: getTrendColor(), fontSize: '14px' }}>
            {getTrendIcon()} {Math.abs(change)}%
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.6)' }}>
            vs last month
          </span>
        </div>
      )}
    </div>
  )
}

export default {
  LineChart,
  BarChart,
  PieChart,
  ProgressRing,
  StatsCard,
}
