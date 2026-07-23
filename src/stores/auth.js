import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { fetchCurrentUser, fetchCurrentUserPermissions, loginWithPassword, logoutRequest } from '../api/auth';
import { TOKEN_STORAGE_KEY, USER_INFO_STORAGE_KEY } from '../config/app';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_STORAGE_KEY) || '');
  const userInfo = ref(readStoredUserInfo());
  const permissionCodes = ref([]);
  const permissionsLoaded = ref(false);
  const isAuthenticated = computed(() => Boolean(token.value));
  const permissionCodeSet = computed(() => new Set(permissionCodes.value));
  const displayRole = computed(() => {
    const explicitRole = userInfo.value?.roleName || userInfo.value?.roleNames || userInfo.value?.roleCode;
    if (explicitRole) return Array.isArray(explicitRole) ? explicitRole.join('、') : explicitRole;
    if (hasPermission('system:permission:saveRole')) return '系统管理员';
    if (hasAnyPermission(['sxbook:book:add', 'sxbook:scrapeRule:add', 'sxbook:task:action'])) return '内容管理员';
    if (permissionCodes.value.length) return '只读审计';
    return '普通用户';
  });

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
    try {
      await ensureSession();
    } catch (error) {
      clearAuth();
      throw error;
    }
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

    const nextUserInfo = {
      ...(userInfo.value || {}),
      ...normalizeUserInfo(response.result),
    };
    persistUserInfo(nextUserInfo);
    return nextUserInfo;
  }

  async function refreshPermissions() {
    if (!token.value) {
      permissionCodes.value = [];
      permissionsLoaded.value = false;
      return [];
    }

    const response = await fetchCurrentUserPermissions();
    if (!response?.success) {
      throw new Error(response?.message || '获取用户权限失败');
    }

    const codes = Array.isArray(response?.result?.codeList) ? response.result.codeList : [];
    permissionCodes.value = [...new Set(codes.filter(Boolean).map(String))];
    permissionsLoaded.value = true;
    return permissionCodes.value;
  }

  async function ensureSession() {
    if (!token.value) return null;
    const tasks = [];
    if (!userInfo.value?.id || !userInfo.value?.username) tasks.push(refreshUserInfo());
    if (!permissionsLoaded.value) tasks.push(refreshPermissions());
    if (tasks.length) await Promise.all(tasks);
    return userInfo.value;
  }

  function hasPermission(code) {
    if (!code) return true;
    return permissionCodeSet.value.has(String(code));
  }

  function hasAnyPermission(codes = []) {
    const values = Array.isArray(codes) ? codes : [codes];
    return values.some((code) => hasPermission(code));
  }

  function hasAllPermissions(codes = []) {
    const values = Array.isArray(codes) ? codes : [codes];
    return values.every((code) => hasPermission(code));
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
    permissionCodes.value = [];
    permissionsLoaded.value = false;
  }

  return {
    token,
    userInfo,
    permissionCodes,
    permissionsLoaded,
    isAuthenticated,
    displayRole,
    login,
    refreshUserInfo,
    refreshPermissions,
    ensureSession,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
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
