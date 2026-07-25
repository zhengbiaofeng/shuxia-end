import { describe, expect, it } from 'vitest'
import { normalizeQuickAction } from '../dashboard'
import {
  normalizeNotifyChannel,
  normalizeNotifyDispatch,
  normalizeNotifyRule,
  normalizeNotifyTemplate,
  normalizeOperateLog,
  normalizeUserRow,
} from '../adminModules'

describe('dashboard quick action normalization', () => {
  it('keeps backend execution and permission metadata', () => {
    expect(normalizeQuickAction({
      key: 'SYSTEM_BACKUP',
      label: '运行快照',
      method: 'post',
      api: '/sx/book/dashboard/backup/run',
      permission: 'sxbook:dashboard:view',
      dangerous: true,
      confirmText: '确认执行',
    })).toMatchObject({
      key: 'SYSTEM_BACKUP',
      label: '运行快照',
      method: 'POST',
      api: '/sx/book/dashboard/backup/run',
      permission: 'sxbook:dashboard:view',
      dangerous: true,
      confirmText: '确认执行',
    })
  })
})

describe('management data normalization', () => {
  it('labels user activity with the fields the backend actually provides', () => {
    const row = normalizeUserRow({
      userId: 'u-1',
      username: 'reader',
      nickName: '读者',
      memberLevel: 'VIP',
      sourceType: 'local',
      status: 2,
      lastReadTime: '2026-07-25T08:30:00',
    })

    expect(row).toMatchObject({
      id: 'u-1',
      membership: 'VIP',
      source: 'local',
      status: '冻结',
      recentRead: '2026-07-25 08:30:00',
    })
    expect(row).not.toHaveProperty('lastLogin')
    expect(row).not.toHaveProperty('role')
  })

  it('does not invent operation status or IP fields', () => {
    const row = normalizeOperateLog({
      id: 'log-1',
      bizType: 'novel',
      operateType: 'UPDATE',
      operateDesc: '同步章节',
    })

    expect(row).toMatchObject({ module: '小说', action: 'UPDATE', content: '同步章节' })
    expect(row).not.toHaveProperty('status')
    expect(row).not.toHaveProperty('ip')
  })

  it('normalizes notification channel, rule and template status consistently', () => {
    expect(normalizeNotifyChannel({ channelCode: 'mail', channelName: '邮件', status: 1 })).toMatchObject({
      code: 'mail',
      status: '已启用',
    })
    expect(normalizeNotifyRule({
      ruleCode: 'task_failed',
      ruleName: '任务失败',
      channelNames: ['邮件', 'Webhook'],
      status: 0,
    })).toMatchObject({ channels: '邮件、Webhook', status: '已停用' })
    expect(normalizeNotifyTemplate({ templateCode: 'task_failed', useStatus: '0' })).toMatchObject({
      code: 'task_failed',
      status: '已停用',
    })
  })

  it('keeps notification dispatch failure details and retry state', () => {
    expect(normalizeNotifyDispatch({
      id: 'dispatch-1',
      bizEvent: 'task.failed',
      eventName: '任务失败',
      sourceType: 'SCRAPE',
      sourceId: 'task-1',
      receiver: 'admin',
      dispatchStatus: 'FAILED',
      attemptCount: 2,
      errorMessage: '邮件服务不可用',
    })).toMatchObject({
      id: 'dispatch-1',
      event: '任务失败',
      source: 'SCRAPE / task-1',
      receiver: 'admin',
      statusCode: 'FAILED',
      status: '发送失败',
      tone: 'red',
      attempts: 2,
      error: '邮件服务不可用',
    })
  })
})
