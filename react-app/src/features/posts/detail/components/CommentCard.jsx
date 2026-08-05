import ProfileImage from '../../../../components/media/ProfileImage.jsx'
import {
  formatPostDate,
  getPostNickname,
} from '../../utils/postFormatters.js'
import ReplyCard from './ReplyCard.jsx'
import ReplyForm from './ReplyForm.jsx'

function CommentCard({ comment, replyTarget, editingReply, isReplySubmitting, onEdit, onDelete, onReplyOpen, onReplyCancel, onReplyCreate, onReplyEdit, onReplyEditCancel, onReplyUpdate, onReplyDelete }) {
  const canModify =
    comment.author && !comment.commentDeleted && !comment.authorDeleted

  return (
    <article
      className="comment-card"
      id={`comment-${comment.commentId}`}
      tabIndex="-1"
    >
      <div className="comment-card-header">
        <div className="comment-author-information">
          <div className="comment-profile">
            <ProfileImage imagePath={comment.profileImageUrl} alt="" />
          </div>
          <strong>{getPostNickname(comment)}</strong>
          <time className="comment-date" dateTime={comment.createdAt || ''}>
            {formatPostDate(comment.createdAt)}
          </time>
        </div>

        {canModify && (
          <div className="comment-action-buttons">
            <button
              type="button"
              className="outline-action-button"
              onClick={onEdit}
            >
              수정
            </button>
            <button
              type="button"
              className="outline-action-button"
              onClick={onDelete}
            >
              삭제
            </button>
          </div>
        )}
        {!comment.commentDeleted && (
          <button type="button" className="reply-open-button" onClick={onReplyOpen}>답글</button>
        )}
      </div>

      <p className="comment-content">
        {comment.commentDeleted
          ? '삭제된 댓글입니다.'
          : comment.commentContent}
      </p>
      {replyTarget && (
        <ReplyForm isSubmitting={isReplySubmitting} onSubmit={onReplyCreate} onCancel={onReplyCancel} />
      )}
      {Array.isArray(comment.replies) && comment.replies.length > 0 && (
        <div className="reply-list">
          {comment.replies.map((reply) => (
            <ReplyCard
              key={reply.replyId}
              reply={reply}
              isEditing={editingReply?.replyId === reply.replyId}
              isSubmitting={isReplySubmitting}
              onEdit={() => onReplyEdit(reply.replyId)}
              onEditCancel={onReplyEditCancel}
              onUpdate={(content) => onReplyUpdate(reply.replyId, content)}
              onDelete={() => onReplyDelete(reply.replyId)}
            />
          ))}
        </div>
      )}
    </article>
  )
}

export default CommentCard
