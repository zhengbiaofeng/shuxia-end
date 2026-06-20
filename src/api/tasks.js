import request from '../utils/request';

const TRANSCODE_STATUS_MAP = {
  0: { label: '待处理', tone: 'blue' },
  1: { label: '处理中', tone: 'orange' },
  2: { label: '已完成', tone: 'green' },
  3: { label: '失败', tone: 'red' },
};

export async function fetchRecentTasks() {
  const response = await request.get('/sx/book/transcode/list', {
    params: {
      pageNo: 1,
      pageSize: 6,
    },
  });

  if (!response?.success || !Array.isArray(response?.result?.records)) {
    throw new Error(response?.message || '获取最近任务失败');
  }

  return response.result.records.map((item) => {
    const statusMeta = TRANSCODE_STATUS_MAP[item.transcodeStatus] || {
      label: '未知状态',
      tone: 'gray',
    };

    return {
      category: buildTaskCategory(item),
      title: `转码：${item.bookName || '未命名书籍'}`,
      progress: null,
      progressText: buildProgressText(item),
      status: statusMeta.label,
      statusTone: statusMeta.tone,
      time: formatTaskTime(item.finishedTime || item.createTime),
    };
  });
}

function buildTaskCategory(item) {
  const formatText = item?.targetFormat ? `目标格式：${String(item.targetFormat).toUpperCase()}` : '转码任务';

  if (item?.transcodeStatus === 3 && item?.errorMessage) {
    return `${formatText} · ${item.errorMessage}`;
  }

  return formatText;
}

function buildProgressText(item) {
  if (!item?.targetFormat) {
    return '转码任务';
  }

  return String(item.targetFormat).toUpperCase();
}

function formatTaskTime(value) {
  if (!value) {
    return '--:--';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}
