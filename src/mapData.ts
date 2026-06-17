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

const MAP_SOURCES = [
  'https://geo.datav.aliyun.com/areas_v3/bound/440000_full.json',
  'https://geo.datav.aliyun.com/areas_v3/bound/810000.json',
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
  try {
    const collections = await Promise.all(
      MAP_SOURCES.map(async (url) => {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`地图数据加载失败：${url}`)
        return response.json() as Promise<GeoJson>
      }),
    )

    const features = collections
      .flatMap(item => item.features || [])
      .map(normalizeFeature)
      .filter(feature => CITY_LIST.includes(feature.properties.name as CityName))

    if (features.length >= CITY_LIST.length - 2) {
      return { type: 'FeatureCollection', features }
    }

    throw new Error('地图数据不完整，已使用备用轮廓')
  }
  catch (error) {
    console.warn(error)
    return createFallbackMap()
  }
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

function createFallbackMap(): GeoJson {
  const boxes: Record<CityName, [number, number, number, number]> = {
    韶关市: [112.3, 24.6, 114.7, 25.6],
    清远市: [111.7, 23.4, 113.8, 24.7],
    梅州市: [115.0, 23.5, 116.8, 24.6],
    河源市: [114.0, 23.2, 115.7, 24.2],
    肇庆市: [111.3, 22.7, 112.8, 23.7],
    广州市: [112.8, 22.8, 114.0, 23.7],
    惠州市: [114.0, 22.6, 115.4, 23.5],
    潮州市: [116.3, 23.4, 117.2, 24.0],
    揭阳市: [115.6, 22.9, 116.7, 23.6],
    汕头市: [116.5, 23.1, 117.3, 23.6],
    云浮市: [111.0, 22.2, 112.4, 23.1],
    佛山市: [112.5, 22.6, 113.4, 23.1],
    东莞市: [113.5, 22.7, 114.2, 23.2],
    深圳市: [113.8, 22.4, 114.7, 22.9],
    香港特别行政区: [113.85, 22.15, 114.45, 22.55],
    澳门特别行政区: [113.45, 22.08, 113.65, 22.28],
    中山市: [113.1, 22.2, 113.7, 22.7],
    珠海市: [113.1, 21.9, 113.8, 22.4],
    江门市: [112.0, 21.8, 113.2, 22.7],
    阳江市: [111.4, 21.4, 112.6, 22.2],
    茂名市: [110.4, 21.4, 111.5, 22.4],
    湛江市: [109.4, 20.2, 111.0, 21.6],
    汕尾市: [114.6, 22.4, 115.8, 23.0],
  }

  return {
    type: 'FeatureCollection',
    features: CITY_LIST.map(name => ({
      type: 'Feature',
      properties: { name },
      geometry: {
        type: 'Polygon',
        coordinates: [boxToPolygon(boxes[name])],
      },
    })),
  }
}

function boxToPolygon([minLng, minLat, maxLng, maxLat]: [number, number, number, number]) {
  return [
    [minLng, minLat],
    [maxLng, minLat],
    [maxLng, maxLat],
    [minLng, maxLat],
    [minLng, minLat],
  ]
}
