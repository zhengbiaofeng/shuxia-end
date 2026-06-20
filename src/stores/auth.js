import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { fetchCurrentUser, loginWithPassword, logoutRequest } from '../api/auth';
import { TOKEN_STORAGE_KEY, USER_INFO_STORAGE_KEY } from '../config/app';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_STORAGE_KEY) || '');
  const userInfo = ref(readStoredUserInfo());
  const isAuthenticated = computed(() => Boolean(token.value));

  function persistToken(nextToken) {
    token.value = nextToken || '';

    if (nextToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
      return;
    }

    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  function persistUserInfo(nextUserInfo) {
    userInfo.value = nextUserInfo || null;

    if (nextUserInfo) {
      localStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(nextUserInfo));
      return;
    }

    localStorage.removeItem(USER_INFO_STORAGE_KEY);
  }

  async function login(payload) {
    const response = await loginWithPassword(payload);
    const result = response?.result || {};
    const nextToken = readToken(result);

    if (!response?.success || !nextToken) {
      throw new Error(response?.message || '登录失败，请检查账号和密码');
    }

    persistToken(nextToken);
    persistUserInfo(readUserInfo(result) || createFallbackUserInfo(payload));
    return result;
  }

  async function refreshUserInfo() {
    if (!token.value) {
      return null;
    }

    const response = await fetchCurrentUser();

    if (!response?.success || !response?.result) {
      throw new Error(response?.message || '获取用户信息失败');
    }

    const nextUserInfo = normalizeUserInfo(response.result);
    persistUserInfo(nextUserInfo);
    return nextUserInfo;
  }

  async function logout() {
    try {
      if (token.value) {
        await logoutRequest();
      }
    } catch (error) {
      console.warn('退出登录请求失败：', error);
    } finally {
      clearAuth();
    }
  }

  function clearAuth() {
    persistToken('');
    persistUserInfo(null);
  }

  return {
    token,
    userInfo,
    isAuthenticated,
    login,
    refreshUserInfo,
    logout,
    clearAuth,
  };
});

function readToken(result = {}) {
  return result.token || result.accessToken || result.tokenValue || result['X-Access-Token'] || '';
}

function readUserInfo(result = {}) {
  return normalizeUserInfo(result.userInfo || result.userinfo || result.user || result.sysUser || null);
}

function normalizeUserInfo(info) {
  if (!info || typeof info !== 'object') return null;

  return {
    ...info,
    id: info.id || info.userId,
    username: info.username || info.userName || info.nickName,
    realname: info.realname || info.realName || info.nickName || info.username,
    avatar: info.avatar,
  };
}

function createFallbackUserInfo(payload = {}) {
  const username = payload.username || 'admin';

  return {
    id: username,
    username,
    realname: username,
  };
}

function readStoredUserInfo() {
  const raw = localStorage.getItem(USER_INFO_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(USER_INFO_STORAGE_KEY);
    return null;
  }
}
