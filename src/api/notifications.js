import request from '../utils/request';

const NOTICE_TONE_MAP = {
  CREATE: 'green',
  EDIT: 'blue',
  SHELF: 'blue',
  DELETE: 'orange',
  PARSE_EXECUTE: 'blue',
  PARSE_STATUS: 'blue',
  TRANSCODE_CREATE: 'blue',
  TRANSCODE_STATUS: 'green',
  CHAPTER_SLICE_CREATE: 'blue',
  CHAPTER_SLICE_STATUS: 'green',
  NOVEL_CHAPTER_CREATE: 'green',
  NOVEL_CHAPTER_EDIT: 'blue',
  NOVEL_CHAPTER_REORDER: 'blue',
  NOVEL_CHAPTER_DELETE: 'orange',
};

export async function fetchSystemNotifications() {
  const response = await request.get('/sx/book/operateLog/list', {
    params: {
      pageNo: 1,
      pageSize: 5,
    },
  });

  if (!response?.success || !Array.isArray(response?.result?.records)) {
    throw new Error(response?.message || '获取系统通知失败');
  }

  return response.result.records.map((item) => ({
    title: item.operateDesc || '书籍操作更新',
    desc: buildNoticeDesc(item),
    time: formatNoticeTime(item.operateTime),
    tone: NOTICE_TONE_MAP[item.operateType] || 'blue',
  }));
}

function buildNoticeDesc(item) {
  const parts = [];

  if (item?.bookName) {
    parts.push(item.bookName);
  }

  if (item?.operateByName) {
    parts.push(`操作人：${item.operateByName}`);
  }

  return parts.length > 0 ? parts.join(' · ') : '系统操作日志';
}

function formatNoticeTime(value) {
  if (!value) {
    return '--';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${month}-${day} ${hours}:${minutes}`;
}
