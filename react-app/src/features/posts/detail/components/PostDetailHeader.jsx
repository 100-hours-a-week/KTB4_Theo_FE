import { Link } from 'react-router'
import ProfileImage from '../../../../components/media/ProfileImage.jsx'
import {
  formatPostCount,
  formatPostDate,
  getPostNickname,
} from '../../utils/postFormatters.js'

function PostDetailHeader({ post, onDelete }) {
  return (
    <div className="post-heading-area">
      <h2 className="post-detail-title">
        {post.blinded ? '숨김 처리된 게시글입니다.' : post.title}
      </h2>

      <div className="post-detail-meta-row">
        <div className="post-author-information">
          <div className="post-detail-profile">
            <ProfileImage imagePath={post.profileImageUrl} alt="" />
          </div>
          <strong id="post-author-nickname">{getPostNickname(post)}</strong>
          {post.createdAt && (
            <time className="post-detail-date" dateTime={post.createdAt}>
              {formatPostDate(post.createdAt)}
            </time>
          )}
          {post.edited && <span className="post-edited-label">(수정됨)</span>}
        </div>

        <div className="post-meta-counts" aria-label="게시글 통계">
          <span>
            조회수 <strong>{formatPostCount(post.viewCount)}</strong>
          </span>
          <span>
            댓글 <strong>{formatPostCount(post.commentCount)}</strong>
          </span>
        </div>
      </div>

      {post.author && (
        <div className="post-action-buttons">
          <Link
            className="outline-action-button"
            to={`/posts/${post.postId}/edit`}
          >
            수정
          </Link>
          <button
            type="button"
            className="outline-action-button"
            onClick={onDelete}
          >
            삭제
          </button>
        </div>
      )}
    </div>
  )
}

export default PostDetailHeader
