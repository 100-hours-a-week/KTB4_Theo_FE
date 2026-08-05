import LikeButton from './LikeButton.jsx'
import PostDetailHeader from './PostDetailHeader.jsx'
import PostImageGallery from './PostImageGallery.jsx'

function PostDetailArticle({
  post,
  onLike,
  isLikeSubmitting = false,
  onDeletePost,
  renderVersion,
}) {
  const isBlinded = Boolean(post.blinded)

  return (
    <article className="post-detail">
      <header className="post-detail-header">
        {!isBlinded && (
          <div className="post-side-statistics" aria-label="게시글 반응">
            <LikeButton
              liked={post.liked}
              likeCount={post.likeCount}
              disabled={isLikeSubmitting}
              onClick={onLike}
            />
          </div>
        )}

        <PostDetailHeader post={post} onDelete={onDeletePost} />
      </header>

      {!isBlinded && (
        <PostImageGallery
          key={renderVersion}
          images={post.images}
        />
      )}

      <p className="post-detail-content">
        {isBlinded ? '숨김 처리된 게시글입니다.' : post.content}
      </p>
    </article>
  )
}

export default PostDetailArticle
