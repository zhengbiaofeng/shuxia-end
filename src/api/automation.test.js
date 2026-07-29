import { describe, expect, it } from 'vitest'
import { buildTaskDetail, buildTaskMetrics, normalizeTaskRow } from './automation'

describe('task center presentation', () => {
  it('labels an up-to-date scheduled sync without pretending it added content', () => {
    const row = normalizeTaskRow({
      taskId: 'scheduled-1',
      taskType: 'SCRAPE',
      taskTypeName: '刮削任务',
      taskStatus: 2,
      taskResultStatus: 'SUCCESS',
      triggerType: 'SCHEDULED',
      executeMode: 'SYNC_CHAPTERS',
      chapterCount: 911,
      addedChapterCount: 0,
      skippedChapterCount: 911,
      failedChapterCount: 0,
      localChapterCountAfterSync: 911,
    })

    expect(row.trigger).toBe('定时追更')
    expect(row.progress).toBe(100)
    expect(row.progressLabel).toBe('已是最新')
    expect(row.outcomeLabel).toBe('无新增章节，已是最新')
  })

  it('keeps a bounded canary run visibly incomplete', () => {
    const row = normalizeTaskRow({
      taskId: 'canary-1',
      taskType: 'SCRAPE',
      taskStatus: 2,
      taskResultStatus: 'SUCCESS',
      triggerType: 'MANUAL',
      executeMode: 'SYNC_CHAPTERS',
      chapterCount: 7261,
      addedChapterCount: 1,
      skippedChapterCount: 7260,
      failedChapterCount: 0,
      localChapterCountAfterSync: 52,
    })

    expect(row.trigger).toBe('手动追更')
    expect(row.progress).toBe(1)
    expect(row.progressLabel).toBe('试跑 +1')
    expect(row.outcomeLabel).toContain('尚未完整入库')
  })

  it('shows trigger and chapter outcome fields in task detail', () => {
    const row = normalizeTaskRow({
      taskId: 'detail-1',
      taskType: 'SCRAPE',
      taskStatus: 2,
      taskResultStatus: 'SUCCESS',
      triggerType: 'SCHEDULED',
      executeMode: 'SYNC_CHAPTERS',
      chapterCount: 10,
      addedChapterCount: 2,
      skippedChapterCount: 8,
      failedChapterCount: 0,
      localChapterCountAfterSync: 10,
      startedTime: '2026-07-29 12:00:00',
    })
    const detail = buildTaskDetail(row)

    expect(detail.fields).toContainEqual(['触发方式', '定时追更'])
    expect(detail.fields).toContainEqual(['执行模式', '章节同步'])
    expect(detail.fields).toContainEqual(['章节结果', '新增 2 / 跳过 8 / 失败 0'])
  })

  it('uses the backend complete-book count instead of scrape task count', () => {
    const metrics = buildTaskMetrics({ completeImportedBookCount: 3, scrapeTaskCount: 99 })
    const metric = metrics.find((item) => item.label === '完整入库')

    expect(metric.value).toBe('3')
    expect(metric.unit).toBe('本')
  })
})
