import { mkdir, writeFile } from 'node:fs/promises'

const cityList = [
  '广州市',
  '深圳市',
  '珠海市',
  '汕头市',
  '佛山市',
  '韶关市',
  '河源市',
  '梅州市',
  '惠州市',
  '汕尾市',
  '东莞市',
  '中山市',
  '江门市',
  '阳江市',
  '湛江市',
  '茂名市',
  '肇庆市',
  '清远市',
  '潮州市',
  '揭阳市',
  '云浮市',
  '香港特别行政区',
  '澳门特别行政区',
]

const aliasMap = {
  440100: '广州市',
  440300: '深圳市',
  440400: '珠海市',
  440500: '汕头市',
  440600: '佛山市',
  440200: '韶关市',
  441600: '河源市',
  441400: '梅州市',
  441300: '惠州市',
  441500: '汕尾市',
  441900: '东莞市',
  442000: '中山市',
  440700: '江门市',
  441700: '阳江市',
  440800: '湛江市',
  440900: '茂名市',
  441200: '肇庆市',
  441800: '清远市',
  445100: '潮州市',
  445200: '揭阳市',
  445300: '云浮市',
  810000: '香港特别行政区',
  820000: '澳门特别行政区',
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

const sources = {
  guangdong: [
    'https://geo.datav.aliyun.com/areas_v3/bound/440000_full.json',
    'https://cdn.jsdelivr.net/gh/d3cn/data@master/json/geo/china/province-city/guangdong.geojson',
    'https://raw.githubusercontent.com/d3cn/data/master/json/geo/china/province-city/guangdong.geojson',
  ],
  hongKong: [
    'https://geo.datav.aliyun.com/areas_v3/bound/810000.json',
    'https://cdn.jsdelivr.net/gh/mouday/echarts-map@master/echarts-4.2.1-rc1-map/json/province/xianggang.json',
    'https://raw.githubusercontent.com/mouday/echarts-map/master/echarts-4.2.1-rc1-map/json/province/xianggang.json',
  ],
  macau: [
    'https://geo.datav.aliyun.com/areas_v3/bound/820000.json',
    'https://cdn.jsdelivr.net/gh/mouday/echarts-map@master/echarts-4.2.1-rc1-map/json/province/aomen.json',
    'https://raw.githubusercontent.com/mouday/echarts-map/master/echarts-4.2.1-rc1-map/json/province/aomen.json',
  ],
}

const [guangdong, hongKong, macau] = await Promise.all([
  fetchFirst(sources.guangdong),
  fetchFirst(sources.hongKong),
  fetchFirst(sources.macau),
])

const cityFeatures = guangdong.features
  .map(normalizeFeature)
  .filter(feature => cityList.includes(feature.properties.name))
  .filter(feature => feature.properties.name !== '香港特别行政区')
  .filter(feature => feature.properties.name !== '澳门特别行政区')

const features = [
  ...cityFeatures,
  mergeAsSingleFeature(hongKong, '香港特别行政区'),
  mergeAsSingleFeature(macau, '澳门特别行政区'),
]

const names = new Set(features.map(feature => feature.properties.name))
const missing = cityList.filter(name => !names.has(name))

if (missing.length) {
  throw new Error(`地图数据缺少：${missing.join('、')}`)
}

const result = {
  type: 'FeatureCollection',
  features,
}

await mkdir('src/assets/map', { recursive: true })
await writeFile('src/assets/map/guangdong-hk-macau.json', `${JSON.stringify(result)}\n`, 'utf8')

console.log(`Prepared real map data with ${features.length} regions.`)

async function fetchFirst(urls) {
  const errors = []

  for (const url of urls) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)

      const geoJson = await response.json()
      if (!geoJson.features?.length) throw new Error('GeoJSON has no features')

      console.log(`Loaded map data: ${url}`)
      return geoJson
    }
    catch (error) {
      errors.push(`${url}: ${error.message}`)
    }
  }

  throw new Error(`无法下载真实地图数据：\n${errors.join('\n')}`)
}

function normalizeFeature(feature) {
  const rawName = getFeatureName(feature)
  const normalizedName = aliasMap[rawName] || rawName

  return {
    ...feature,
    properties: {
      ...feature.properties,
      name: normalizedName,
    },
  }
}

function getFeatureName(feature) {
  const properties = feature.properties || {}
  const keys = [
    'name',
    'NAME',
    'Name',
    'fullname',
    'fullName',
    'FULLNAME',
    'NAME_1',
    'NAME_2',
    'NL_NAME_1',
    'NL_NAME_2',
    'adcode',
    'ADCODE',
    'code',
    'CODE',
    'id',
    'ID',
  ]

  for (const key of keys) {
    if (properties[key] !== undefined && properties[key] !== null && properties[key] !== '') {
      return String(properties[key])
    }
  }

  return ''
}

function mergeAsSingleFeature(collection, name) {
  const coordinates = collection.features.flatMap((feature) => {
    if (feature.geometry.type === 'Polygon') return [feature.geometry.coordinates]
    if (feature.geometry.type === 'MultiPolygon') return feature.geometry.coordinates
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
