import { CITY_LIST, type CityName } from './constants'
import * as ChinaMapGeojson from 'china-map-geojson'

type GeoJsonFeature = {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: unknown
  }
}

export type GeoJson = {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

const aliasMap: Record<string, CityName> = {
  广州: '广州市',
  深圳: '深圳市',
  珠海: '珠海市',
  汕头: '汕头市',
  佛山: '佛山市',
  韶关: '韶关市',
  河源: '河源市',
  梅州: '梅州市',
  惠州: '惠州市',
  汕尾: '汕尾市',
  东莞: '东莞市',
  中山: '中山市',
  江门: '江门市',
  阳江: '阳江市',
  湛江: '湛江市',
  茂名: '茂名市',
  肇庆: '肇庆市',
  清远: '清远市',
  潮州: '潮州市',
  揭阳: '揭阳市',
  云浮: '云浮市',
  香港: '香港特别行政区',
  香港特别行政区: '香港特别行政区',
  澳门: '澳门特别行政区',
  澳門: '澳门特别行政区',
  澳门特别行政区: '澳门特别行政区',
  澳門特別行政區: '澳门特别行政区',
}

export function loadGuangdongMap(): GeoJson {
  const packageData = normalizePackage(ChinaMapGeojson)
  const provinceData = packageData.ProvinceData || packageData.provinceData || packageData.province || packageData.default?.ProvinceData
  const chinaData = packageData.ChinaData || packageData.chinaData || packageData.china || packageData.default?.ChinaData

  const guangdong = findGeoJson(provinceData, ['广东省', '广东', 'guangdong', '440000'])
  const hongKong = findGeoJson(chinaData || provinceData, ['香港特别行政区', '香港', 'xianggang', '810000'])
  const macau = findGeoJson(chinaData || provinceData, ['澳门特别行政区', '澳门', '澳門', 'aomen', '820000'])

  if (!guangdong) throw new Error('地图包中没有找到广东省市级 GeoJSON')
  if (!hongKong) throw new Error('地图包中没有找到香港 GeoJSON')
  if (!macau) throw new Error('地图包中没有找到澳门 GeoJSON')

  const cityFeatures = guangdong.features
    .map(normalizeFeature)
    .filter(feature => CITY_LIST.includes(feature.properties.name as CityName))
    .filter(feature => feature.properties.name !== '香港特别行政区')
    .filter(feature => feature.properties.name !== '澳门特别行政区')

  const features = [
    ...cityFeatures,
    mergeAsSingleFeature(hongKong, '香港特别行政区'),
    mergeAsSingleFeature(macau, '澳门特别行政区'),
  ]

  const names = new Set(features.map(feature => feature.properties.name))
  const missing = CITY_LIST.filter(name => !names.has(name))
  if (missing.length) {
    throw new Error(`地图数据缺少：${missing.join('、')}`)
  }

  return { type: 'FeatureCollection', features }
}

function normalizePackage(value: unknown): Record<string, any> {
  return value && typeof value === 'object' ? value as Record<string, any> : {}
}

function normalizeFeature(feature: GeoJsonFeature): GeoJsonFeature {
  const rawName = String(feature.properties?.name || '')
  const normalizedName = aliasMap[rawName] || rawName
  return {
    ...feature,
    properties: {
      ...feature.properties,
      name: normalizedName,
    },
  }
}

function findGeoJson(source: unknown, candidates: string[]): GeoJson | null {
  const direct = unwrapGeoJson(source)
  if (direct) return direct

  if (Array.isArray(source)) {
    for (const item of source) {
      if (matchesCandidate(item, candidates)) {
        const geoJson = unwrapGeoJson(item)
        if (geoJson) return geoJson
      }
    }
    return null
  }

  if (!source || typeof source !== 'object') return null

  const objectSource = source as Record<string, unknown>
  for (const key of candidates) {
    const geoJson = unwrapGeoJson(objectSource[key])
    if (geoJson) return geoJson
  }

  for (const value of Object.values(objectSource)) {
    if (matchesCandidate(value, candidates)) {
      const geoJson = unwrapGeoJson(value)
      if (geoJson) return geoJson
    }
  }

  return null
}

function unwrapGeoJson(value: unknown): GeoJson | null {
  if (!value || typeof value !== 'object') return null

  const item = value as Record<string, any>
  if (item.type === 'FeatureCollection' && Array.isArray(item.features)) return item as GeoJson

  const nestedKeys = ['geoJson', 'geoJSON', 'geojson', 'json', 'data', 'map', 'value']
  for (const key of nestedKeys) {
    const nested = unwrapGeoJson(item[key])
    if (nested) return nested
  }

  return null
}

function matchesCandidate(value: unknown, candidates: string[]) {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  const fields = ['name', 'fullname', 'label', 'title', 'adcode', 'code', 'id', 'pinyin', 'key']
  return fields.some((field) => {
    const fieldValue = item[field]
    return typeof fieldValue === 'string' || typeof fieldValue === 'number'
      ? candidates.includes(String(fieldValue))
      : false
  })
}

function mergeAsSingleFeature(collection: GeoJson, name: CityName): GeoJsonFeature {
  const coordinates = collection.features.flatMap((feature) => {
    if (feature.geometry.type === 'Polygon') return [feature.geometry.coordinates]
    if (feature.geometry.type === 'MultiPolygon') return feature.geometry.coordinates as unknown[]
    return []
  })

  return {
    type: 'Feature',
    properties: { name },
    geometry: {
      type: 'MultiPolygon',
      coordinates,
    },
  }
}
