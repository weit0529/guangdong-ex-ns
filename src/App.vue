<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { CACHE_KEY, CITY_LIST, LEVEL_LIST, type CityName } from './constants'
import { loadGuangdongMap } from './mapData'

const MAP_NAME = 'guangdong-hk-macau'

const chartEl = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const selectedCity = ref<CityName>('广州市')
const isDark = ref(false)
const levels = reactive<Record<CityName, number>>(createInitialLevels())

let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const score = computed(() => CITY_LIST.reduce((total, city) => total + levels[city], 0))
const selectedLevel = computed(() => LEVEL_LIST.find(item => item.value === levels[selectedCity.value])!)

onMounted(async () => {
  await nextTick()
  if (!chartEl.value) return

  chart = echarts.init(chartEl.value)
  const mapData = await loadGuangdongMap()
  echarts.registerMap(MAP_NAME, mapData as any)

  chart.on('click', (params) => {
    const name = params.name as CityName
    if (CITY_LIST.includes(name)) selectedCity.value = name
  })

  resizeObserver = new ResizeObserver(() => chart?.resize())
  resizeObserver.observe(chartEl.value)

  loading.value = false
  renderChart()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
})

watch(levels, () => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(levels))
  renderChart()
}, { deep: true })

watch(isDark, () => {
  renderChart()
})

function createInitialLevels() {
  const result = Object.fromEntries(CITY_LIST.map(city => [city, 0])) as Record<CityName, number>
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as Partial<Record<CityName, number>>
    CITY_LIST.forEach((city) => {
      if (typeof saved[city] === 'number') result[city] = saved[city]!
    })
  }
  catch {
    localStorage.removeItem(CACHE_KEY)
  }
  return result
}

function setLevel(value: number) {
  levels[selectedCity.value] = value
}

function resetAll() {
  CITY_LIST.forEach((city) => {
    levels[city] = 0
  })
}

function downloadImage() {
  const dataUrl = chart?.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: isDark.value ? '#202020' : '#fff4f4',
  })
  if (!dataUrl) return

  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `广东含港澳制霸-${Date.now()}.png`
  link.click()
}

function renderChart() {
  if (!chart || loading.value) return

  const textColor = isDark.value ? '#f6f1ee' : '#3b2626'
  const borderColor = isDark.value ? '#77635e' : '#d09090'

  chart.setOption({
    backgroundColor: 'transparent',
    title: [
      {
        text: '广东（含港澳）制霸',
        left: '5%',
        top: '4%',
        textStyle: {
          color: textColor,
          fontFamily: 'Noto Serif SC, Microsoft YaHei, sans-serif',
          fontSize: 38,
          fontWeight: 700,
        },
      },
      {
        text: `分数：${score.value}`,
        left: '5%',
        bottom: '5%',
        textStyle: {
          color: textColor,
          fontFamily: 'Noto Serif SC, Microsoft YaHei, sans-serif',
          fontSize: 42,
          fontWeight: 700,
        },
      },
    ],
    tooltip: {
      trigger: 'item',
      formatter: ({ name, value }: { name: string, value: number }) => {
        const item = LEVEL_LIST.find(level => level.value === Number(value)) || LEVEL_LIST[0]
        return `${name}<br/>${item.text}`
      },
    },
    visualMap: {
      type: 'piecewise',
      right: '5%',
      bottom: '6%',
      itemGap: 4,
      pieces: LEVEL_LIST.map(item => ({
        value: item.value,
        label: item.text,
        color: item.color,
      })),
      textStyle: {
        color: textColor,
        fontSize: 14,
      },
    },
    series: [
      {
        type: 'map',
        map: MAP_NAME,
        roam: true,
        zoom: 1.08,
        selectedMode: false,
        label: {
          show: true,
          color: textColor,
          fontFamily: 'Microsoft YaHei, sans-serif',
          fontSize: 11,
        },
        itemStyle: {
          borderColor,
          borderWidth: 1.5,
          areaColor: '#ffffff',
        },
        emphasis: {
          label: {
            show: true,
            color: textColor,
            fontWeight: 700,
          },
          itemStyle: {
            areaColor: '#ffdada',
          },
        },
        data: CITY_LIST.map(city => ({
          name: city,
          value: levels[city],
        })),
      },
    ],
    media: [
      {
        query: { maxWidth: 700 },
        option: {
          title: [
            { textStyle: { fontSize: 24 }, left: '5%', top: '3%' },
            { textStyle: { fontSize: 28 }, left: '5%', bottom: '4%' },
          ],
          visualMap: {
            left: 'center',
            right: 'auto',
            bottom: 8,
            orient: 'horizontal',
            itemWidth: 34,
            itemHeight: 14,
            textStyle: { fontSize: 11 },
          },
          series: [
            {
              roam: false,
              label: { fontSize: 8 },
            },
          ],
        },
      },
    ],
  }, true)
}
</script>

<template>
  <main :class="['page', { dark: isDark }]">
    <header class="topbar">
      <div class="brand">广东（含港澳）制霸</div>
      <div class="actions">
        <button type="button" @click="downloadImage">下载图片</button>
        <button type="button" @click="isDark = !isDark">{{ isDark ? '浅色' : '深色' }}</button>
      </div>
    </header>

    <section class="workspace">
      <div class="map-card">
        <div v-if="loading" class="loading">地图加载中...</div>
        <div ref="chartEl" class="chart" />
      </div>

      <aside class="panel">
        <div>
          <p class="eyebrow">当前选择</p>
          <h1>{{ selectedCity }}</h1>
          <p class="level-tag" :style="{ backgroundColor: selectedLevel.color }">{{ selectedLevel.text }}</p>
        </div>

        <div class="level-list">
          <button
            v-for="item in LEVEL_LIST"
            :key="item.value"
            type="button"
            :class="{ active: levels[selectedCity] === item.value }"
            :style="{ '--level-color': item.color }"
            @click="setLevel(item.value)"
          >
            <span class="swatch" />
            {{ item.text }}
          </button>
        </div>

        <div class="score-box">
          <span>总分</span>
          <strong>{{ score }}</strong>
        </div>

        <button type="button" class="reset" @click="resetAll">清空记录</button>
      </aside>
    </section>
  </main>
</template>
