import request from '../utils/request';

export async function loginWithPassword(payload) {
  return request.post('/sys/mLogin', payload);
}

export async function fetchCurrentUser() {
  return request.get('/sx/book/user/ext/me');
}

export async function logoutRequest() {
  return request.get('/sys/logout');
}
