import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { createPost } from '../../../api/postApi.js'
import backButton from '../../../assets/images/back-button.png'
import AppLayout from '../../../components/layout/AppLayout.jsx'
import useHeaderControls from '../../../hooks/useHeaderControls.js'
import { getImageRequestError } from '../../../utils/imageFiles.js'
import '../../../styles/common.css'
import '../../../styles/post-create.css'
import useAuth from '../../auth/useAuth.js'
import PostForm from '../editor/components/PostForm.jsx'

const EMPTY_SERVER_ERRORS = {
  title: '',
  content: '',
  images: '',
}

function PostCreatePage() {
  const navigate = useNavigate()
  const { user, logout, isLoggingOut } = useAuth()
  const {
    isProfileMenuOpen,
    closeProfileMenu,
    toggleProfileMenu,
    handleLogout,
  } = useHeaderControls({ logout })
  const [serverErrors, setServerErrors] = useState(EMPTY_SERVER_ERRORS)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createPromiseRef = useRef(null)
  const isMountedRef = useRef(false)

  const clearServerError = useCallback((fieldName) => {
    setServerErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors
      }

      return {
        ...currentErrors,
        [fieldName]: '',
      }
    })
  }, [])

  const handleCreatePostError = useCallback(
    (error) => {
      const status = error?.status
      const message = error?.message

      setServerErrors(EMPTY_SERVER_ERRORS)

      if (status === 400 && message === 'blank_title') {
        setServerErrors({
          ...EMPTY_SERVER_ERRORS,
          title: '* 제목을 입력해주세요.',
        })
        return
      }

      if (status === 400 && message === 'blank_content') {
        setServerErrors({
          ...EMPTY_SERVER_ERRORS,
          content: '* 내용을 입력해주세요.',
        })
        return
      }

      if (status === 400 && message === 'invalid_post_title') {
        setServerErrors({
          ...EMPTY_SERVER_ERRORS,
          title: '* 제목은 최대 26자까지 작성 가능합니다.',
        })
        return
      }

      const imageError = getImageRequestError(error)
      if (imageError) {
        setServerErrors({
          ...EMPTY_SERVER_ERRORS,
          images: imageError,
        })
        return
      }

      if (status === 401 && message === 'unauthorized_request') {
        alert('로그인이 필요합니다.')
        navigate('/login', { replace: true })
        return
      }

      if (status === 429 && message === 'post_create_rate_limit_exceeded') {
        alert('게시글은 1분에 최대 3개까지 작성할 수 있습니다.')
        return
      }

      if (status === 500 && message === 'internal_server_error') {
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        return
      }

      alert('게시글 작성 중 오류가 발생했습니다. 다시 시도해주세요.')
    },
    [navigate],
  )

  const handleSubmit = useCallback(
    ({ title, content, imageFiles }) => {
      if (createPromiseRef.current) {
        return createPromiseRef.current
      }

      setServerErrors(EMPTY_SERVER_ERRORS)
      setIsSubmitting(true)

      const requestPromise = createPost({
        title: title.trim(),
        content: content.trim(),
        images: imageFiles,
      })
        .then((data) => {
          if (!isMountedRef.current) {
            return
          }

          const createdPostId = data?.postId ?? data

          if (createdPostId) {
            navigate(`/posts/${createdPostId}`)
            return
          }

          navigate('/posts')
        })
        .catch((error) => {
          if (isMountedRef.current) {
            console.error(error)
            handleCreatePostError(error)
          }
        })
        .finally(() => {
          createPromiseRef.current = null

          if (isMountedRef.current) {
            setIsSubmitting(false)
          }
        })

      createPromiseRef.current = requestPromise
      return requestPromise
    },
    [handleCreatePostError, navigate],
  )

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  return (
    <AppLayout
      pageClassName="make-post-page"
      headerClassName="make-post-header"
      mainClassName="make-post-main"
      headerProps={{
        logoClassName: 'make-post-logo',
        profileImagePath: user?.profileImageUrl,
        isProfileMenuOpen,
        onProfileMenuToggle: toggleProfileMenu,
        onProfileMenuClose: closeProfileMenu,
        onLogout: handleLogout,
        isLoggingOut,
        backTo: '/posts',
        backLabel: '게시글 목록으로 돌아가기',
        backIconSrc: backButton,
      }}
    >
      <section
        className="make-post-container"
        aria-labelledby="make-post-title"
      >
        <div className="make-post-heading">
          <h2 className="make-post-title" id="make-post-title">
            게시글 작성
          </h2>
        </div>

        <PostForm
          isSubmitting={isSubmitting}
          serverErrors={serverErrors}
          onClearServerError={clearServerError}
          onSubmit={handleSubmit}
        />
      </section>
    </AppLayout>
  )
}

export default PostCreatePage
