import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import {
  createComment,
  createReply,
  deleteComment,
  deletePost,
  deleteReply,
  getPost,
  togglePostLike,
  updateComment,
  updateReply,
} from '../../../api/postApi.js'
import AppLayout from '../../../components/layout/AppLayout.jsx'
import ConfirmModal from '../../../components/feedback/ConfirmModal.jsx'
import useHeaderControls from '../../../hooks/useHeaderControls.js'
import backButton from '../../../assets/images/back-button.png'
import '../../../styles/common.css'
import '../../../styles/post-detail.css'
import useAuth from '../../auth/useAuth.js'
import CommentSection from './components/CommentSection.jsx'
import PostDetailArticle from './components/PostDetailArticle.jsx'

function parsePostId(postIdParam) {
  const postId = Number(postIdParam)

  if (!Number.isInteger(postId) || postId <= 0) {
    return null
  }

  return postId
}

function PostDetailPage() {
  const location = useLocation()
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
  const [isLikeSubmitting, setIsLikeSubmitting] = useState(false)
  const [editingCommentTarget, setEditingCommentTarget] = useState(null)
  const [isCommentCreating, setIsCommentCreating] = useState(false)
  const [isCommentUpdating, setIsCommentUpdating] = useState(false)
  const [replyTarget, setReplyTarget] = useState(null)
  const [editingReplyTarget, setEditingReplyTarget] = useState(null)
  const [isReplySubmitting, setIsReplySubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false)
  const requestPromisesRef = useRef(new Map())
  const renderVersionRef = useRef(0)
  const likePromiseRef = useRef(null)
  const commentPromiseRef = useRef(null)
  const deletePromiseRef = useRef(null)
  const replyPromiseRef = useRef(null)
  const isMountedRef = useRef(false)

  const handlePostDetailError = useCallback(
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

      alert('게시글을 불러오는 중 오류가 발생했습니다.')
    },
    [navigate],
  )

  const handleLikeError = useCallback(
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

      alert('좋아요 처리 중 오류가 발생했습니다.')
    },
    [navigate],
  )

  const getPostRequest = useCallback((targetPostId) => {
    let requestPromise = requestPromisesRef.current.get(targetPostId)

    if (!requestPromise) {
      requestPromise = getPost(targetPostId)
        .then((post) => {
          if (!post) {
            throw new Error('게시글 상세 응답에 data가 없습니다.')
          }

          return post
        })
        .finally(() => {
          requestPromisesRef.current.delete(targetPostId)
        })

      requestPromisesRef.current.set(targetPostId, requestPromise)
    }

    return requestPromise
  }, [])

  const applyPostResponse = useCallback((targetPostId, post) => {
    if (!isMountedRef.current) {
      return
    }

    renderVersionRef.current += 1
    setLoadedPost({
      postId: targetPostId,
      post,
      renderVersion: renderVersionRef.current,
    })
  }, [])

  const refreshPostDetail = useCallback(() => {
    if (postId === null) {
      return Promise.resolve()
    }

    return getPostRequest(postId)
      .then((post) => {
        applyPostResponse(postId, post)
      })
      .catch((error) => {
        if (isMountedRef.current) {
          console.error(error)
          handlePostDetailError(error)
        }
      })
  }, [applyPostResponse, getPostRequest, handlePostDetailError, postId])

  const handleCommentError = useCallback(
    (error, actionName) => {
      const status = error?.status
      const message = error?.message

      if (status === 400 && message === 'blank_comment_content') {
        return
      }

      if (status === 401 && message === 'unauthorized_request') {
        alert('로그인이 필요합니다.')
        navigate('/login', { replace: true })
        return
      }

      if (status === 403) {
        alert(`댓글을 ${actionName}할 권한이 없습니다.`)
        return
      }

      if (status === 404 && message === 'comment_not_found') {
        alert('존재하지 않는 댓글입니다.')
        refreshPostDetail()
        return
      }

      if (status === 500 && message === 'internal_server_error') {
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        return
      }

      alert(`댓글 ${actionName} 중 오류가 발생했습니다.`)
    },
    [navigate, refreshPostDetail],
  )

  const handlePostDeleteError = useCallback(
    (error) => {
      const status = error?.status
      const message = error?.message

      if (status === 401 && message === 'unauthorized_request') {
        alert('로그인이 필요합니다.')
        navigate('/login', { replace: true })
        return
      }

      if (status === 403 && message === 'post_delete_forbidden') {
        alert('게시글을 삭제할 권한이 없습니다.')
        return
      }

      if (status === 404 && message === 'post_not_found') {
        alert('존재하지 않는 게시글입니다.')
        navigate('/posts', { replace: true })
        return
      }

      alert('게시글 삭제 중 오류가 발생했습니다.')
    },
    [navigate],
  )

  const handleLike = useCallback(() => {
    const currentPost = loadedPost?.postId === postId ? loadedPost.post : null

    if (!currentPost || currentPost.blinded || likePromiseRef.current) {
      return likePromiseRef.current
    }

    setIsLikeSubmitting(true)

    const requestPromise = togglePostLike(postId)
      .then((likeResult) => {
        if (!likeResult) {
          throw new Error('좋아요 응답에 data가 없습니다.')
        }

        if (!isMountedRef.current) {
          return
        }

        setLoadedPost((currentLoadedPost) => {
          if (currentLoadedPost?.postId !== postId) {
            return currentLoadedPost
          }

          return {
            ...currentLoadedPost,
            post: {
              ...currentLoadedPost.post,
              liked: Boolean(likeResult.liked),
              likeCount: likeResult.likeCount,
            },
          }
        })
      })
      .catch((error) => {
        if (isMountedRef.current) {
          console.error(error)
          handleLikeError(error)
        }
      })
      .finally(() => {
        likePromiseRef.current = null

        if (isMountedRef.current) {
          setIsLikeSubmitting(false)
        }
      })

    likePromiseRef.current = requestPromise
    return requestPromise
  }, [handleLikeError, loadedPost, postId])

  const submitComment = useCallback(
    (action, content, commentId = null) => {
      if (commentPromiseRef.current) {
        return commentPromiseRef.current
      }

      if (postId === null) {
        return Promise.resolve()
      }

      if (action === '등록') {
        setIsCommentCreating(true)
      } else {
        setIsCommentUpdating(true)
      }

      const mutationPromise =
        action === '등록'
          ? createComment(postId, content)
          : updateComment(postId, commentId, content)

      const requestPromise = mutationPromise
        .then(async () => {
          if (isMountedRef.current) {
            setEditingCommentTarget(null)
          }

          await refreshPostDetail()
        })
        .catch((error) => {
          if (isMountedRef.current) {
            console.error(error)
            handleCommentError(error, action)
          }

          throw error
        })
        .finally(() => {
          commentPromiseRef.current = null

          if (isMountedRef.current) {
            setIsCommentCreating(false)
            setIsCommentUpdating(false)
          }
        })

      commentPromiseRef.current = requestPromise
      return requestPromise
    },
    [handleCommentError, postId, refreshPostDetail],
  )

  const handleCommentCreate = useCallback(
    (content) => submitComment('등록', content),
    [submitComment],
  )

  const handleCommentUpdate = useCallback(
    (commentId, content) => submitComment('수정', content, commentId),
    [submitComment],
  )

  const handleCommentEditStart = useCallback(
    (commentId) => {
      const comment = loadedPost?.post?.comments?.find(
        (currentComment) => currentComment.commentId === commentId,
      )

      if (comment) {
        setEditingCommentTarget({ postId, comment })
      }
    },
    [loadedPost, postId],
  )

  const handleCommentEditCancel = useCallback(() => {
    setEditingCommentTarget(null)
  }, [])

  const handleReplyOpen = useCallback((commentId) => {
    setEditingReplyTarget(null)
    setReplyTarget((current) =>
      current?.commentId === commentId ? null : { postId, commentId },
    )
  }, [postId])

  const handleReplyCancel = useCallback(() => setReplyTarget(null), [])

  const submitReply = useCallback((action, commentId, content, replyId = null) => {
    if (replyPromiseRef.current || postId === null) return replyPromiseRef.current

    setIsReplySubmitting(true)
    const mutation = action === '등록'
      ? createReply(postId, commentId, content)
      : updateReply(postId, commentId, replyId, content)

    const promise = mutation
      .then(async () => {
        if (isMountedRef.current) {
          setReplyTarget(null)
          setEditingReplyTarget(null)
        }
        await refreshPostDetail()
      })
      .catch((error) => {
        if (isMountedRef.current) {
          console.error(error)
          handleCommentError(error, `대댓글 ${action}`)
        }
        throw error
      })
      .finally(() => {
        replyPromiseRef.current = null
        if (isMountedRef.current) setIsReplySubmitting(false)
      })

    replyPromiseRef.current = promise
    return promise
  }, [handleCommentError, postId, refreshPostDetail])

  const handleReplyCreate = useCallback(
    (commentId, content) => submitReply('등록', commentId, content),
    [submitReply],
  )

  const handleReplyUpdate = useCallback(
    (commentId, replyId, content) => submitReply('수정', commentId, content, replyId),
    [submitReply],
  )

  const handleReplyEditStart = useCallback((commentId, replyId) => {
    const comment = loadedPost?.post?.comments?.find((item) => item.commentId === commentId)
    const reply = comment?.replies?.find((item) => item.replyId === replyId)
    if (reply) {
      setReplyTarget(null)
      setEditingReplyTarget({ postId, commentId, reply })
    }
  }, [loadedPost, postId])

  const handleReplyEditCancel = useCallback(() => setEditingReplyTarget(null), [])

  const handleReplyDeleteRequest = useCallback((commentId, replyId) => {
    if (postId !== null) setDeleteTarget({ type: 'reply', postId, commentId, replyId })
  }, [postId])

  const handlePostDeleteRequest = useCallback(() => {
    if (postId !== null) {
      setDeleteTarget({ type: 'post', postId })
    }
  }, [postId])

  const handleCommentDeleteRequest = useCallback(
    (commentId) => {
      if (postId !== null) {
        setDeleteTarget({ type: 'comment', postId, commentId })
      }
    },
    [postId],
  )

  const handleDeleteCancel = useCallback(() => {
    if (!deletePromiseRef.current) {
      setDeleteTarget(null)
    }
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (
      !deleteTarget ||
      deleteTarget.postId !== postId ||
      deletePromiseRef.current
    ) {
      return deletePromiseRef.current
    }

    setIsDeleteSubmitting(true)

    let mutationPromise
    if (deleteTarget.type === 'post') {
      mutationPromise = deletePost(deleteTarget.postId)
    } else if (deleteTarget.type === 'reply') {
      mutationPromise = deleteReply(deleteTarget.postId, deleteTarget.commentId, deleteTarget.replyId)
    } else {
      mutationPromise = deleteComment(deleteTarget.postId, deleteTarget.commentId)
    }

    const requestPromise = mutationPromise
      .then(async () => {
        if (deleteTarget.type === 'post') {
          navigate('/posts', { replace: true })
          return
        }

        if (isMountedRef.current) {
          setDeleteTarget(null)
        }
        await refreshPostDetail()
      })
      .catch((error) => {
        if (isMountedRef.current) {
          setDeleteTarget(null)
          console.error(error)

          if (deleteTarget.type === 'post') {
            handlePostDeleteError(error)
          } else {
            handleCommentError(error, deleteTarget.type === 'reply' ? '대댓글 삭제' : '삭제')
          }
        }
      })
      .finally(() => {
        deletePromiseRef.current = null

        if (isMountedRef.current) {
          setIsDeleteSubmitting(false)
        }
      })

    deletePromiseRef.current = requestPromise
    return requestPromise
  }, [
    deleteTarget,
    handleCommentError,
    handlePostDeleteError,
    navigate,
    postId,
    refreshPostDetail,
  ])

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
    const requestPromise = getPostRequest(postId)

    requestPromise
      .then((post) => {
        if (isActive) {
          applyPostResponse(postId, post)
        }
      })
      .catch((error) => {
        if (isActive) {
          console.error(error)
          handlePostDetailError(error)
        }
      })

    return () => {
      isActive = false
    }
  }, [applyPostResponse, getPostRequest, handlePostDetailError, navigate, postId])

  const post = loadedPost?.postId === postId ? loadedPost.post : null
  const isPostLoaded = Boolean(post)
  const comments = Array.isArray(post?.comments) ? post.comments : []
  const editingComment =
    editingCommentTarget?.postId === postId
      ? editingCommentTarget.comment
      : null
  const isCommentSubmitting = isCommentCreating || isCommentUpdating

  useEffect(() => {
    if (!isPostLoaded || !location.hash.startsWith('#comment-')) {
      return undefined
    }

    const target = document.getElementById(location.hash.slice(1))

    if (!target) {
      return undefined
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    target.focus({ preventScroll: true })

    target.classList.remove('is-highlighted')
    void target.offsetWidth
    target.classList.add('is-highlighted')

    const timeoutId = window.setTimeout(() => {
      target.classList.remove('is-highlighted')
    }, 2500)

    return () => {
      window.clearTimeout(timeoutId)
      target.classList.remove('is-highlighted')
    }
  }, [isPostLoaded, location.hash, location.key])

  return (
    <AppLayout
      pageClassName="post-page"
      headerClassName="post-header"
      mainClassName="post-main"
      headerProps={{
        logoClassName: 'post-logo',
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
      <div className="post-detail-container">
        {post && (
          <>
            <PostDetailArticle
              post={post}
              renderVersion={loadedPost.renderVersion}
              onLike={handleLike}
              isLikeSubmitting={isLikeSubmitting}
              onDeletePost={handlePostDeleteRequest}
            />
            {!post.blinded && (
              <CommentSection
                comments={comments}
                editingComment={editingComment}
                isSubmitting={isCommentSubmitting}
                onCreate={handleCommentCreate}
                onUpdate={handleCommentUpdate}
                onEditStart={handleCommentEditStart}
                onEditCancel={handleCommentEditCancel}
                onDelete={handleCommentDeleteRequest}
                replyTarget={replyTarget?.postId === postId ? replyTarget : null}
                editingReply={editingReplyTarget?.postId === postId ? editingReplyTarget : null}
                isReplySubmitting={isReplySubmitting}
                onReplyOpen={handleReplyOpen}
                onReplyCancel={handleReplyCancel}
                onReplyCreate={handleReplyCreate}
                onReplyEdit={handleReplyEditStart}
                onReplyEditCancel={handleReplyEditCancel}
                onReplyUpdate={handleReplyUpdate}
                onReplyDelete={handleReplyDeleteRequest}
              />
            )}
          </>
        )}
      </div>
      <ConfirmModal
        isOpen={Boolean(deleteTarget && deleteTarget.postId === postId)}
        title={
          deleteTarget?.type === 'post'
            ? '게시글을 삭제하시겠습니까?'
            : deleteTarget?.type === 'reply'
              ? '대댓글을 삭제하시겠습니까?'
              : '댓글을 삭제하시겠습니까?'
        }
        description="삭제한 내용은 복구할 수 없습니다."
        isSubmitting={isDeleteSubmitting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </AppLayout>
  )
}

export default PostDetailPage
