import {
  Box,
  Collection,
  Headset,
  Opportunity,
  Tickets,
} from '@element-plus/icons-vue'
import request from '../utils/request'

export async function fetchComicPage(params = {}) {
  const page = await fetchDomainPage('/sx/comic/list', params, normalizeComicRow)

  return {
    ...page,
    metrics: buildComicMetrics(page),
    tabs: buildDomainTabs('漫画', page),
  }
}

export async function fetchAudioPage(params = {}) {
  const page = await fetchDomainPage('/sx/audio/list', params, normalizeAudioRow)

  return {
    ...page,
    metrics: buildAudioMetrics(page),
    tabs: buildDomainTabs('有声', page),
  }
}

async function fetchDomainPage(url, params, normalizer) {
  const response = await request.get(url, { params: cleanQuery(params) })

  if (!response?.success || !response?.result) {
    throw new Error(response?.message || '获取内容列表失败')
  }

  const result = response.result
  const records = Array.isArray(result.records) ? result.records.map(normalizer) : []

  return {
    records,
    total: Number(result.total || records.length),
    current: Number(result.current || params.pageNo || 1),
    pageSize: Number(result.size || params.pageSize || 10),
    pages: Number(result.pages || 0),
  }
}

function normalizeComicRow(item = {}) {
  const tags = Array.isArray(item.tagNames) ? item.tagNames.filter(Boolean) : []

  return {
    id: item.id,
    raw: item,
    title: item.bookName || '未命名漫画',
    author: item.authorName || '--',
    category: item.categoryName || '未分类',
    cover: normalizeCover(item.coverUrl),
    status: normalizeDomainStatus(item.domainStatus),
    latest: item.latestEpisodeTitle || '--',
    latestDate: formatDateTime(item.updateTime),
    chapters: formatCount(item.chapterCount, '章'),
    images: '--',
    size: '--',
    source: item.comicStudio || item.leadPainter || '--',
    path: item.pageLayout || '--',
    updatedAt: formatDateTime(item.updateTime),
    tags,
    badges: tags.slice(0, 2).map((label) => ({ label, tone: 'blue' })),
    publishStatusText: normalizePublishStatus(item.publishStatus),
  }
}

function normalizeAudioRow(item = {}) {
  const tags = Array.isArray(item.tagNames) ? item.tagNames.filter(Boolean) : []

  return {
    id: item.id,
    raw: item,
    title: item.bookName || '未命名有声专辑',
    subtitle: item.subtitle || item.authorName || '',
    category: item.categoryName || '未分类',
    anchor: item.narratorName || item.authorName || '--',
    episodes: formatCount(item.chapterCount, '集'),
    duration: formatDuration(item.totalDurationSeconds),
    size: '--',
    status: normalizeDomainStatus(item.domainStatus),
    source: item.albumLabel || item.voiceTeam || '--',
    updatedAt: formatDateTime(item.updateTime),
    cover: normalizeCover(item.coverUrl),
    tags,
    badges: tags.slice(0, 2).map((label) => ({ label, tone: 'green' })),
    publishStatusText: normalizePublishStatus(item.publishStatus),
  }
}

function buildComicMetrics(page) {
  const rows = page.records
  const chapterCount = rows.reduce((sum, row) => sum + Number(row.raw?.chapterCount || 0), 0)
  const publishedCount = rows.filter((row) => Number(row.raw?.publishStatus) === 1).length
  const updatedCount = rows.filter((row) => row.updatedAt !== '--').length

  return [
    { title: '漫画总数', value: formatNumber(page.total), unit: '本', footLabel: '接口总数', footValue: '', footTone: 'blue', icon: Opportunity, color: 'blue' },
    { title: '当前页章节', value: formatNumber(chapterCount), unit: '章', footLabel: '当前页统计', footValue: '', footTone: 'green', icon: Collection, color: 'green' },
    { title: '已上架', value: formatNumber(publishedCount), unit: '本', footLabel: '当前页统计', footValue: '', footTone: 'blue', icon: Tickets, color: 'purple' },
    { title: '有更新时间', value: formatNumber(updatedCount), unit: '本', footLabel: '当前页统计', footValue: '', footTone: 'blue', icon: Box, color: 'orange' },
  ]
}

function buildAudioMetrics(page) {
  const rows = page.records
  const trackCount = rows.reduce((sum, row) => sum + Number(row.raw?.chapterCount || 0), 0)
  const durationSeconds = rows.reduce((sum, row) => sum + Number(row.raw?.totalDurationSeconds || 0), 0)
  const publishedCount = rows.filter((row) => Number(row.raw?.publishStatus) === 1).length

  return [
    { title: '有声总数', value: formatNumber(page.total), unit: '专辑', footLabel: '接口总数', footValue: '', footTone: 'blue', icon: Headset, color: 'blue' },
    { title: '当前页单集', value: formatNumber(trackCount), unit: '集', footLabel: '当前页统计', footValue: '', footTone: 'green', icon: Collection, color: 'green' },
    { title: '当前页时长', value: formatDurationValue(durationSeconds), unit: '小时', footLabel: '按接口字段汇总', footValue: '', footTone: 'blue', icon: Box, color: 'purple' },
    { title: '已上架', value: formatNumber(publishedCount), unit: '专辑', footLabel: '当前页统计', footValue: '', footTone: 'blue', icon: Tickets, color: 'orange' },
  ]
}

function buildDomainTabs(label, page) {
  return [
    { key: 'all', label: `全部${label} (${formatNumber(page.total)})` },
    { key: 'serializing', label: '更新中' },
    { key: 'completed', label: '已完成' },
    { key: 'paused', label: '已暂停' },
  ]
}

function cleanQuery(query = {}) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== '' && value !== undefined && value !== null),
  )
}

function normalizeCover(url) {
  return url || ''
}

function normalizeDomainStatus(value) {
  const map = {
    serializing: '更新中',
    completed: '已完成',
    finished: '已完成',
    paused: '已暂停',
  }

  return map[String(value || '').toLowerCase()] || value || '--'
}

function normalizePublishStatus(value) {
  const map = {
    0: '未上架',
    1: '已上架',
    2: '已下架',
  }

  return map[value] || '--'
}

function formatDuration(seconds) {
  const totalSeconds = Number(seconds || 0)
  if (!totalSeconds) return '--'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.round((totalSeconds % 3600) / 60)
  if (!hours) return `${minutes} 分钟`
  return `${hours} 小时 ${minutes} 分钟`
}

function formatDurationValue(seconds) {
  const hours = Number(seconds || 0) / 3600
  return hours ? hours.toFixed(1) : '0'
}

function formatCount(value, unit) {
  const number = Number(value || 0)
  return number ? `${formatNumber(number)} ${unit}` : '--'
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('zh-CN')
}

function formatDateTime(value) {
  if (!value) return '--'
  return String(value).replace('T', ' ').slice(0, 16)
}
