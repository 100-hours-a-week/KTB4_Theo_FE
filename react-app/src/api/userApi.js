import { request } from './client.js'

export async function signup(payload) {
  const { profileImage, ...requestPayload } = payload
  const formData = new FormData()
  formData.append(
    'request',
    new Blob([JSON.stringify(requestPayload)], { type: 'application/json' }),
  )
  formData.append('profileImage', profileImage)

  await request('/users/signup', {
    method: 'POST',
    body: formData,
    includeAccessToken: false,
    retryOnUnauthorized: false,
  })
}

export async function getCurrentUser() {
  const result = await request('/users/me', {
    method: 'GET',
  })

  return result?.data
}

export async function updateCurrentUser({ nickname, profileImage }) {
  const formData = new FormData()
  formData.append(
    'request',
    new Blob([JSON.stringify({ nickname })], { type: 'application/json' }),
  )

  if (profileImage) {
    formData.append('profileImage', profileImage)
  }

  const result = await request('/users/me', {
    method: 'PATCH',
    body: formData,
  })

  return result?.data
}

export async function deleteCurrentUser() {
  await request('/users/me', {
    method: 'DELETE',
  })
}

export async function updatePassword({ password, passwordConfirm }) {
  await request('/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ password, passwordConfirm }),
  })
}
