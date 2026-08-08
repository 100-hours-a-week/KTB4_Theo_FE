export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL 환경변수가 필요합니다.')
}

let accessToken = null
let reissuePromise = null
const accessTokenListeners = new Set()

export function getAccessToken() {
  return accessToken
}

export function subscribeAccessToken(listener) {
  accessTokenListeners.add(listener)

  return () => {
    accessTokenListeners.delete(listener)
  }
}

function notifyAccessTokenChange() {
  accessTokenListeners.forEach((listener) => listener())
}

export function saveAccessToken(newAccessToken) {
  if (!newAccessToken) {
    throw new Error('로그인 응답에 액세스 토큰이 없습니다.')
  }

  if (accessToken !== newAccessToken) {
    accessToken = newAccessToken
    notifyAccessTokenChange()
  }
}

export function clearAccessToken() {
  if (accessToken !== null) {
    accessToken = null
    notifyAccessTokenChange()
  }
}

async function parseResponse(response) {
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

function createRequestError(response, result) {
  return {
    status: response.status,
    message: result?.message,
    data: result?.data,
  }
}

async function fetchApi(url, options = {}) {
  const fetchOptions = { ...options }
  const includeAccessToken = fetchOptions.includeAccessToken !== false
  const headers = fetchOptions.headers
  const isFormData =
    typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData

  delete fetchOptions.includeAccessToken
  delete fetchOptions.retryOnUnauthorized
  delete fetchOptions.headers

  return fetch(API_BASE_URL + url, {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(includeAccessToken &&
        getAccessToken() && {
          Authorization: `Bearer ${getAccessToken()}`,
        }),
      ...headers,
    },
  })
}

export async function reissueAccessToken() {
  if (!reissuePromise) {
    reissuePromise = fetch(API_BASE_URL + '/auth/reissue', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(async (response) => {
        const result = await parseResponse(response)

        if (!response.ok) {
          throw createRequestError(response, result)
        }

        saveAccessToken(result?.data?.accessToken)
      })
      .catch((error) => {
        clearAccessToken()
        throw error
      })
      .finally(() => {
        reissuePromise = null
      })
  }

  return reissuePromise
}

export async function request(url, options = {}) {
  const shouldUseAccessToken = options.includeAccessToken !== false
  const shouldRetryUnauthorized = options.retryOnUnauthorized !== false

  if (
    shouldUseAccessToken &&
    shouldRetryUnauthorized &&
    !getAccessToken()
  ) {
    await reissueAccessToken()
  }

  let response = await fetchApi(url, options)

  if (response.status === 401 && shouldRetryUnauthorized) {
    await reissueAccessToken()
    response = await fetchApi(url, options)
  }

  const result = await parseResponse(response)

  if (!response.ok) {
    throw createRequestError(response, result)
  }

  return result
}
