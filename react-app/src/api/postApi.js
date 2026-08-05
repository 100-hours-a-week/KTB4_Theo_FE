import { request } from './client.js'

export const DEFAULT_POST_PAGE_SIZE = 10

export function createPostListUrl({
  lastPostId = null,
  size = DEFAULT_POST_PAGE_SIZE,
} = {}) {
  if (lastPostId === null) {
    return `/posts?size=${size}`
  }

  return `/posts?lastPostId=${lastPostId}&size=${size}`
}

export async function getPosts(params = {}) {
  const result = await request(createPostListUrl(params), {
    method: 'GET',
  })

  return result?.data
}

export async function getPost(postId) {
  const result = await request(`/posts/${postId}`, {
    method: 'GET',
  })

  return result?.data
}

export async function createPost({ title, content, images = [] }) {
  const formData = createPostFormData({ title, content }, 'images', images)
  const result = await request('/posts', {
    method: 'POST',
    body: formData,
  })

  return result?.data
}

export async function updatePost(
  postId,
  { title, content, retainedImageIds = [], newImages = [] },
) {
  const formData = createPostFormData(
    { title, content, retainedImageIds },
    'newImages',
    newImages,
  )

  await request(`/posts/${postId}`, {
    method: 'PATCH',
    body: formData,
  })
}

function createPostFormData(requestPayload, imagePartName, images) {
  const formData = new FormData()
  formData.append(
    'request',
    new Blob([JSON.stringify(requestPayload)], { type: 'application/json' }),
  )
  images.forEach((image) => formData.append(imagePartName, image))
  return formData
}

export async function togglePostLike(postId) {
  const result = await request(`/posts/${postId}/likes`, {
    method: 'POST',
  })

  return result?.data
}

export async function createComment(postId, content) {
  await request(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export async function updateComment(postId, commentId, content) {
  await request(`/posts/${postId}/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  })
}

export async function deletePost(postId) {
  await request(`/posts/${postId}`, {
    method: 'DELETE',
  })
}

export async function deleteComment(postId, commentId) {
  await request(`/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
  })
}

export async function createReply(postId, commentId, content) {
  await request(`/posts/${postId}/comments/${commentId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export async function updateReply(postId, commentId, replyId, content) {
  await request(
    `/posts/${postId}/comments/${commentId}/replies/${replyId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    },
  )
}

export async function deleteReply(postId, commentId, replyId) {
  await request(
    `/posts/${postId}/comments/${commentId}/replies/${replyId}`,
    { method: 'DELETE' },
  )
}
