import { describe, it, expect } from 'vitest'
import { AnomalyDetectorService } from './src/modules/anomaly-detector/anomaly-detector.service'

describe('debug sigma threshold', () => {
  it('sigma=4, value=200', () => {
    const svc = new AnomalyDetectorService()
    svc.configure({ sigmaThreshold: 4 })
    
    const history = [100, 101, 99, 100, 102, 98, 101, 99, 100, 101].map(v => ({
      timestamp: new Date().toISOString(), value: v,
    }))
    
    const r = svc.detect({ metricKey: 'tuned-cpu', value: 200, history })
    console.log('SCORE:', r.score)
    console.log('SEVERITY:', r.severity)
    console.log('ThreeSigma:', JSON.stringify(r.detectors.threeSigma))
    console.log('IQR:', JSON.stringify(r.detectors.iqr))
    console.log('EWMA:', JSON.stringify(r.detectors.ewma))
    
    const mean = history.reduce((s: number, v: any) => s + v.value, 0) / history.length
    const variance = history.reduce((s: number, v: any) => s + (v.value - mean) ** 2, 0) / history.length
    const stddev = Math.sqrt(variance)
    const zScore = (200 - mean) / stddev
    console.log('mean:', mean, 'stddev:', stddev, 'zScore:', zScore)
    
    expect(r.severity).toBe('CRITICAL')
  })
  
  it('store-a revenue NORMAL', () => {
    const svc = new AnomalyDetectorService()
    const history = [14000, 14200, 13800, 14500, 14100].map(v => ({
      timestamp: new Date().toISOString(), value: v,
    }))
    const r = svc.detect({ metricKey: 'store-a', value: 15000, history })
    console.log('Store-A:', JSON.stringify({score:r.score, severity:r.severity, threeSigma:r.detectors.threeSigma, iqr:r.detectors.iqr}))
    
    const mean = history.reduce((s: number, v: any) => s + v.value, 0) / history.length
    const variance = history.reduce((s: number, v: any) => s + (v.value - mean) ** 2, 0) / history.length
    const stddev = Math.sqrt(variance)
    const zScore = (15000 - mean) / stddev
    console.log('mean:', mean, 'stddev:', stddev, 'zScore:', zScore)
  })
  
  it('short history', () => {
    const svc = new AnomalyDetectorService()
    const history = [100, 101].map(v => ({timestamp: new Date().toISOString(), value: v}))
    const r = svc.detect({ metricKey: 'short', value: 999, history })
    console.log('Short:', JSON.stringify({score:r.score, severity:r.severity, threeSigma:r.detectors.threeSigma, iqr:r.detectors.iqr}))
  })
})
