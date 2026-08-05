import { Link } from 'react-router'
import ProfileImage from '../../../components/media/ProfileImage.jsx'
import {
  formatPostCount,
  formatPostListDate,
  getPostNickname,
  getPostTitle,
} from '../utils/postFormatters.js'

function PostCard({ post }) {
  return (
    <article className="post-card">
      <Link
        className="post-card-link"
        to={`/posts/${post.postId}`}
        aria-label={`${getPostTitle(post)} 게시글 상세 보기`}
      >
        <div className="post-card-content">
          <div className="post-card-title-area">
            <h3 className="post-card-title">{getPostTitle(post)}</h3>
            {post.edited && <span className="post-edited-text">수정됨</span>}
          </div>

          <div className="post-card-information">
            <span className="post-like-count">
              {formatPostCount(post.likeCount)}
            </span>

            <div className="post-card-meta-row">
              <div className="post-count-area">
                <span>댓글 {formatPostCount(post.commentCount)}</span>
                <span>조회수 {formatPostCount(post.viewCount)}</span>
              </div>

              <time className="post-created-at" dateTime={post.createdAt}>
                {formatPostListDate(post.createdAt)}
              </time>
            </div>
          </div>
        </div>

        <div className="post-author-area">
          <div className="post-author-profile">
            <ProfileImage imagePath={post.profileImageUrl} alt="" />
          </div>
          <strong className="post-author-nickname">
            {getPostNickname(post)}
          </strong>
        </div>
      </Link>
    </article>
  )
}

export default PostCard
