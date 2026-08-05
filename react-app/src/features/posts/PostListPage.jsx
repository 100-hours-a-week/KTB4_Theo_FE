import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { getPosts } from '../../api/postApi.js'
import AppLayout from '../../components/layout/AppLayout.jsx'
import useHeaderControls from '../../hooks/useHeaderControls.js'
import '../../styles/common.css'
import '../../styles/posts.css'
import useAuth from '../auth/useAuth.js'
import PostList from './components/PostList.jsx'
import useInfiniteScroll from './hooks/useInfiniteScroll.js'

function PostListPage() {
  const navigate = useNavigate()
  const { user, logout, isLoggingOut } = useAuth()
  const {
    isProfileMenuOpen,
    closeProfileMenu,
    toggleProfileMenu,
    handleLogout,
  } = useHeaderControls({ logout })
  const [posts, setPosts] = useState([])
  const [hasNext, setHasNext] = useState(true)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const lastPostIdRef = useRef(null)
  const requestPromiseRef = useRef(null)
  const hasRequestedInitialPageRef = useRef(false)
  const isMountedRef = useRef(false)

  const handlePostListError = useCallback(
    (error) => {
      const status = error?.status
      const message = error?.message

      if (status === 400 && message === 'invalid_request') {
        alert('게시글 목록 요청값을 다시 확인해주세요.')
        return
      }

      if (status === 401 && message === 'unauthorized_request') {
        alert('로그인이 필요합니다.')
        navigate('/login', { replace: true })
        return
      }

      if (status === 500 && message === 'internal_server_error') {
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        return
      }

      alert('게시글 목록을 불러오는 중 오류가 발생했습니다.')
    },
    [navigate],
  )

  const readPostList = useCallback(
    ({ initial = false } = {}) => {
      if (requestPromiseRef.current) {
        return requestPromiseRef.current
      }

      if (!initial && !hasNext) {
        return Promise.resolve()
      }

      if (initial) {
        setIsInitialLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const requestPromise = getPosts({
        lastPostId: initial ? null : lastPostIdRef.current,
      })
        .then((data) => {
          if (!isMountedRef.current) {
            return
          }

          const nextPosts = Array.isArray(data?.posts) ? data.posts : []

          setPosts((currentPosts) =>
            initial ? nextPosts : [...currentPosts, ...nextPosts],
          )
          setHasNext(Boolean(data?.hasNext))
          lastPostIdRef.current = data?.lastPostId ?? null
        })
        .catch((error) => {
          if (isMountedRef.current) {
            console.error(error)
            handlePostListError(error)
          }
        })
        .finally(() => {
          if (isMountedRef.current) {
            setIsInitialLoading(false)
            setIsLoadingMore(false)
          }

          requestPromiseRef.current = null
        })

      requestPromiseRef.current = requestPromise
      return requestPromise
    },
    [handlePostListError, hasNext],
  )

  const loadMorePosts = useCallback(() => {
    readPostList()
  }, [readPostList])

  const sentinelRef = useInfiniteScroll({
    hasNext,
    isLoading: isInitialLoading || isLoadingMore,
    onLoadMore: loadMorePosts,
    refreshKey: posts.length,
  })

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!hasRequestedInitialPageRef.current) {
      hasRequestedInitialPageRef.current = true
      readPostList({ initial: true })
    }
  }, [readPostList])

  return (
    <AppLayout
      pageClassName="posts-page"
      headerClassName="posts-header"
      mainClassName="posts-main"
      headerProps={{
        profileImagePath: user?.profileImageUrl,
        isProfileMenuOpen,
        onProfileMenuToggle: toggleProfileMenu,
        onProfileMenuClose: closeProfileMenu,
        onLogout: handleLogout,
        isLoggingOut,
      }}
    >
      <section className="posts-container" aria-labelledby="posts-greeting">
        <h2 className="posts-greeting" id="posts-greeting">
          전체 피드
          <span>개발자들의 지식과 경험을 한입에</span>
        </h2>

        <div className="write-button-area">
          <Link className="write-button" to="/posts/new">
            게시글 작성
          </Link>
        </div>

        <PostList posts={posts} />
        <div
          className="post-list-sentinel"
          ref={sentinelRef}
          aria-hidden="true"
        />
      </section>
    </AppLayout>
  )
}

export default PostListPage
