import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT, TOKEN_STORAGE_KEY } from '../config/app';

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'X-Version': 'v3',
  },
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (token) {
    config.headers['X-Access-Token'] = token;
  }

  return config;
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const fallbackMessage = '请求失败，请稍后重试';
    const serverMessage = error?.response?.data?.message;
    const networkMessage = error?.message;
    const rawMessage = serverMessage || networkMessage || fallbackMessage;
    const message = normalizeRequestErrorMessage(rawMessage, fallbackMessage, error?.response?.status);
    const normalizedError = new Error(message);
    normalizedError.rawMessage = rawMessage;
    normalizedError.status = error?.response?.status;

    return Promise.reject(normalizedError);
  },
);

function normalizeRequestErrorMessage(message, fallbackMessage, status) {
  const value = String(message || '').trim();
  if (!value) return fallbackMessage;
  if (/No static resource/i.test(value)) return '接口暂不可用，请确认后端服务已更新';
  if (/Clock moved backwards|Refusing to generate id/i.test(value)) return '系统时钟短暂回拨，请稍后重试';
  if (/Error updating database|nested exception|Cause:/i.test(value)) return '数据写入失败，请稍后重试';
  if (/timeout of \d+ms exceeded/i.test(value)) return '请求处理时间较长，请稍后刷新确认结果';
  if (status === 404) return '接口不存在，请确认后端服务已更新';
  return value;
}

export default request;
