import { API_BASE_URL } from '../config/app'
import request from '../utils/request'

export const DEFAULT_SITE_SETTINGS = {
  siteKey: 'default',
  siteName: '书匣',
  siteLogo: '',
  siteLogoFileId: '',
  logoUrl: '',
  subtitle: '私有数字内容库',
  defaultSearchPlaceholder: '搜索书名/作者/分类',
  defaultClientType: 'pc',
  defaultBizType: 'ebook',
  defaultBookSortType: 'latest',
  copyrightCompany: '书匣',
  copyrightText: '© 2024 书匣 · 私有数字内容库系统',
  icpNo: '',
  policeNo: '',
  version: 'v2.0.0',
}

export async function fetchSiteSettingDetail() {
  const response = await request.get('/sx/book/site-setting/detail')
  return normalizeSiteSetting(readResultResponse(response, '获取站点设置失败'))
}

export async function fetchPublicSiteSetting() {
  const response = await request.get('/sx/book/site-setting/public')
  return normalizeSiteSetting(readResultResponse(response, '获取站点信息失败'))
}

export async function saveSiteSetting(payload) {
  const response = await request.post('/sx/book/site-setting/save', normalizeSavePayload(payload))
  readResultResponse(response, '保存站点设置失败')
  return true
}

export function normalizeSiteSetting(data = {}) {
  const merged = {
    ...DEFAULT_SITE_SETTINGS,
    ...data,
  }
  const logoUrl = normalizeLogoUrl(merged.siteLogo || merged.logoUrl || merged.siteLogoFileId)

  return {
    ...merged,
    siteName: merged.siteName || DEFAULT_SITE_SETTINGS.siteName,
    copyrightCompany: merged.copyrightCompany || merged.siteName || DEFAULT_SITE_SETTINGS.copyrightCompany,
    copyrightText: merged.copyrightText || DEFAULT_SITE_SETTINGS.copyrightText,
    defaultSearchPlaceholder: merged.defaultSearchPlaceholder || DEFAULT_SITE_SETTINGS.defaultSearchPlaceholder,
    defaultClientType: merged.defaultClientType || DEFAULT_SITE_SETTINGS.defaultClientType,
    defaultBizType: merged.defaultBizType || DEFAULT_SITE_SETTINGS.defaultBizType,
    defaultBookSortType: merged.defaultBookSortType || DEFAULT_SITE_SETTINGS.defaultBookSortType,
    logoUrl,
  }
}

export function normalizeLogoUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw
  if (raw.startsWith('/')) return `${API_BASE_URL}${raw}`
  return `${API_BASE_URL}/sx/book/preview?fileId=${encodeURIComponent(raw)}`
}

function normalizeSavePayload(payload = {}) {
  return {
    siteName: payload.siteName,
    siteLogo: payload.siteLogo,
    siteLogoFileId: payload.siteLogoFileId,
    copyrightText: payload.copyrightText,
    copyrightCompany: payload.copyrightCompany,
    icpNo: payload.icpNo,
    policeNo: payload.policeNo,
    defaultClientType: payload.defaultClientType,
    defaultBizType: payload.defaultBizType,
    defaultBookSortType: payload.defaultBookSortType,
    defaultSearchPlaceholder: payload.defaultSearchPlaceholder,
  }
}

function readResultResponse(response, fallbackMessage) {
  if (!response?.success) {
    throw new Error(response?.message || fallbackMessage)
  }

  return response.result || {}
}
