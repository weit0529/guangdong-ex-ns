export const CITY_LIST = [
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
] as const

export type CityName = (typeof CITY_LIST)[number]

export const LEVEL_LIST = [
  { value: 0, text: '没去过', color: '#ffffff' },
  { value: 1, text: '路过 1', color: '#88aeff' },
  { value: 2, text: '出差 2', color: '#a8ffbe' },
  { value: 3, text: '游玩 3', color: '#ffe57e' },
  { value: 4, text: '短居 4', color: '#ffb57e' },
  { value: 5, text: '居住 5', color: '#ff7e7e' },
] as const

export const CACHE_KEY = 'guangdong-hk-macau-ex-levels'
