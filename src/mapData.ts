import { CITY_LIST, type CityName } from './constants'

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

const GUANGDONG_SOURCES = [
  'https://cdn.jsdelivr.net/gh/d3cn/data@master/json/geo/china/province-city/guangdong.geojson',
  'https://raw.githubusercontent.com/d3cn/data/master/json/geo/china/province-city/guangdong.geojson',
  'https://geo.datav.aliyun.com/areas_v3/bound/440000_full.json',
]

const HONG_KONG_SOURCES = [
  'https://cdn.jsdelivr.net/gh/mouday/echarts-map@master/echarts-4.2.1-rc1-map/json/province/xianggang.json',
  'https://raw.githubusercontent.com/mouday/echarts-map/master/echarts-4.2.1-rc1-map/json/province/xianggang.json',
  'https://geo.datav.aliyun.com/areas_v3/bound/810000.json',
]

const MACAU_SOURCES = [
  'https://cdn.jsdelivr.net/gh/mouday/echarts-map@master/echarts-4.2.1-rc1-map/json/province/aomen.json',
  'https://raw.githubusercontent.com/mouday/echarts-map/master/echarts-4.2.1-rc1-map/json/province/aomen.json',
  'https://geo.datav.aliyun.com/areas_v3/bound/820000.json',
]

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

export async function loadGuangdongMap(): Promise<GeoJson> {
  const [guangdong, hongKong, macau] = await Promise.all([
    fetchFirst(GUANGDONG_SOURCES),
    fetchFirst(HONG_KONG_SOURCES),
    fetchFirst(MACAU_SOURCES),
  ])

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

async function fetchFirst(urls: string[]): Promise<GeoJson> {
  const errors: string[] = []

  for (const url of urls) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
      const geoJson = await response.json() as GeoJson
      if (!geoJson.features?.length) throw new Error('GeoJSON 没有 features')
      return geoJson
    }
    catch (error) {
      errors.push(`${url}：${String(error)}`)
    }
  }

  throw new Error(`真实地图数据加载失败。\n${errors.join('\n')}`)
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
