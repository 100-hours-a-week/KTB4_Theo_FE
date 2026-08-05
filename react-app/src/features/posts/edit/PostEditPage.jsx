import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getPost, updatePost } from '../../../api/postApi.js'
import backButton from '../../../assets/images/back-button.png'
import AppLayout from '../../../components/layout/AppLayout.jsx'
import useHeaderControls from '../../../hooks/useHeaderControls.js'
import { getImageRequestError } from '../../../utils/imageFiles.js'
import '../../../styles/common.css'
import '../../../styles/post-edit.css'
import useAuth from '../../auth/useAuth.js'
import PostEditForm from './components/PostEditForm.jsx'

const EMPTY_SERVER_ERRORS = {
  title: '',
  content: '',
  images: '',
}

function parsePostId(postIdParam) {
  const postId = Number(postIdParam)

  if (!Number.isInteger(postId) || postId <= 0) {
    return null
  }

  return postId
}

function createEditablePost(post) {
  return {
    title: post?.title || '',
    content: post?.content || '',
    images: Array.isArray(post?.images)
      ? post.images.filter(
          (image) => image?.imageId && image?.imageUrl,
        )
      : [],
  }
}

function PostEditPage() {
  const navigate = useNavigate()
  const { postId: postIdParam } = useParams()
  const postId = useMemo(() => parsePostId(postIdParam), [postIdParam])
  const { user, logout, isLoggingOut } = useAuth()
  const {
    isProfileMenuOpen,
    closeProfileMenu,
    toggleProfileMenu,
    handleLogout,
  } = useHeaderControls({ logout })
  const [loadedPost, setLoadedPost] = useState(null)
  const [serverErrorState, setServerErrorState] = useState(null)
  const [submittingPostId, setSubmittingPostId] = useState(null)
  const readPromisesRef = useRef(new Map())
  const updatePromiseRef = useRef(null)
  const isMountedRef = useRef(false)

  const handleReadPostError = useCallback(
    (error) => {
      const status = error?.status
      const message = error?.message

      if (status === 401 && message === 'unauthorized_request') {
        alert('로그인이 필요합니다.')
        navigate('/login', { replace: true })
        return
      }

      if (status === 404 && message === 'post_not_found') {
        alert('존재하지 않는 게시글입니다.')
        navigate('/posts', { replace: true })
        return
      }

      if (status === 500 && message === 'internal_server_error') {
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        return
      }

      alert('수정할 게시글을 불러오는 중 오류가 발생했습니다.')
    },
    [navigate],
  )

  const handleUpdatePostError = useCallback(
    (targetPostId, error) => {
      const status = error?.status
      const message = error?.message

      setServerErrorState({
        postId: targetPostId,
        errors: EMPTY_SERVER_ERRORS,
      })

      if (status === 400 && message === 'blank_title') {
        setServerErrorState({
          postId: targetPostId,
          errors: {
            ...EMPTY_SERVER_ERRORS,
            title: '* 제목을 입력해주세요.',
          },
        })
        return
      }

      if (status === 400 && message === 'blank_content') {
        setServerErrorState({
          postId: targetPostId,
          errors: {
            ...EMPTY_SERVER_ERRORS,
            content: '* 내용을 입력해주세요.',
          },
        })
        return
      }

      if (status === 400 && message === 'invalid_post_title') {
        setServerErrorState({
          postId: targetPostId,
          errors: {
            ...EMPTY_SERVER_ERRORS,
            title: '* 제목은 최대 26자까지 작성 가능합니다.',
          },
        })
        return
      }

      const imageError = getImageRequestError(error)
      if (imageError) {
        setServerErrorState({
          postId: targetPostId,
          errors: {
            ...EMPTY_SERVER_ERRORS,
            images: imageError,
          },
        })
        return
      }

      if (status === 401 && message === 'unauthorized_request') {
        alert('로그인이 필요합니다.')
        navigate('/login', { replace: true })
        return
      }

      if (status === 403 && message === 'post_modify_forbidden') {
        alert('게시글을 수정할 권한이 없습니다.')
        navigate(`/posts/${targetPostId}`, { replace: true })
        return
      }

      if (status === 404 && message === 'post_not_found') {
        alert('존재하지 않는 게시글입니다.')
        navigate('/posts', { replace: true })
        return
      }

      if (status === 500 && message === 'internal_server_error') {
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        return
      }

      alert('게시글 수정 중 오류가 발생했습니다.')
    },
    [navigate],
  )

  const getPostRequest = useCallback((targetPostId) => {
    let requestPromise = readPromisesRef.current.get(targetPostId)

    if (!requestPromise) {
      requestPromise = getPost(targetPostId)
        .then((post) => {
          if (!post) {
            throw new Error('게시글 상세 응답에 data가 없습니다.')
          }

          return createEditablePost(post)
        })
        .finally(() => {
          readPromisesRef.current.delete(targetPostId)
        })

      readPromisesRef.current.set(targetPostId, requestPromise)
    }

    return requestPromise
  }, [])

  const clearServerError = useCallback((fieldName) => {
    setServerErrorState((currentState) => {
      if (!currentState?.errors[fieldName]) {
        return currentState
      }

      return {
        ...currentState,
        errors: {
          ...currentState.errors,
          [fieldName]: '',
        },
      }
    })
  }, [])

  const handleSubmit = useCallback(
    ({ title, content, retainedImageIds, imageFiles }) => {
      const currentPost =
        loadedPost?.postId === postId ? loadedPost.post : null

      if (!currentPost || postId === null || updatePromiseRef.current) {
        return updatePromiseRef.current
      }

      const targetPostId = postId
      setServerErrorState({
        postId: targetPostId,
        errors: EMPTY_SERVER_ERRORS,
      })
      setSubmittingPostId(targetPostId)

      const requestPromise = updatePost(targetPostId, {
        title: title.trim(),
        content: content.trim(),
        retainedImageIds,
        newImages: imageFiles,
      })
        .then(() => {
          if (isMountedRef.current) {
            navigate(`/posts/${targetPostId}`)
          }
        })
        .catch((error) => {
          if (isMountedRef.current) {
            console.error(error)
            handleUpdatePostError(targetPostId, error)
          }
        })
        .finally(() => {
          updatePromiseRef.current = null

          if (isMountedRef.current) {
            setSubmittingPostId(null)
          }
        })

      updatePromiseRef.current = requestPromise
      return requestPromise
    },
    [handleUpdatePostError, loadedPost, navigate, postId],
  )

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (postId === null) {
      alert('잘못된 게시글 주소입니다.')
      navigate('/posts', { replace: true })
      return undefined
    }

    let isActive = true

    getPostRequest(postId)
      .then((post) => {
        if (isActive && isMountedRef.current) {
          setLoadedPost({ postId, post })
        }
      })
      .catch((error) => {
        if (isActive && isMountedRef.current) {
          console.error(error)
          handleReadPostError(error)
        }
      })

    return () => {
      isActive = false
    }
  }, [getPostRequest, handleReadPostError, navigate, postId])

  const post = loadedPost?.postId === postId ? loadedPost.post : null
  const serverErrors =
    serverErrorState?.postId === postId
      ? serverErrorState.errors
      : EMPTY_SERVER_ERRORS

  return (
    <AppLayout
      pageClassName="edit-post-page"
      headerClassName="edit-post-header"
      mainClassName="edit-post-main"
      headerProps={{
        logoClassName: 'edit-post-logo',
        profileImagePath: user?.profileImageUrl,
        isProfileMenuOpen,
        onProfileMenuToggle: toggleProfileMenu,
        onProfileMenuClose: closeProfileMenu,
        onLogout: handleLogout,
        isLoggingOut,
        backTo: postId === null ? '/posts' : `/posts/${postId}`,
        backLabel: '게시글로 돌아가기',
        backIconSrc: backButton,
      }}
    >
      <section
        className="edit-post-container"
        aria-labelledby="edit-post-title"
      >
        <div className="edit-post-heading">
          <p className="edit-post-eyebrow">Edit Post</p>
          <h2 className="edit-post-title" id="edit-post-title">
            게시글 수정
          </h2>
          <p className="edit-post-description">
            작성한 내용을 다듬고 이미지 구성을 다시 정리해보세요.
          </p>
        </div>

        {post && (
          <PostEditForm
            key={postId}
            initialValues={post}
            isSubmitting={submittingPostId === postId}
            serverErrors={serverErrors}
            onClearServerError={clearServerError}
            onSubmit={handleSubmit}
          />
        )}
      </section>
    </AppLayout>
  )
}

export default PostEditPage
