import { useState } from 'react'
import ProfileImage from '../../../../components/media/ProfileImage.jsx'
import { formatPostDate, getPostNickname } from '../../utils/postFormatters.js'
import ReplyForm from './ReplyForm.jsx'

function ReplyCard({ reply, isEditing, isSubmitting, onEdit, onEditCancel, onUpdate, onDelete }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const canModify = reply.author && !reply.replyDeleted && !reply.authorDeleted

  return (
    <article className="reply-card">
      <div className="comment-card-header">
        <div className="comment-author-information">
          <div className="comment-profile"><ProfileImage imagePath={reply.profileImageUrl} alt="" /></div>
          <strong>{getPostNickname(reply)}</strong>
          <time className="comment-date" dateTime={reply.createdAt || ''}>{formatPostDate(reply.createdAt)}</time>
        </div>
        {canModify && !isEditing && (
          <div className="reply-menu">
            <button type="button" className="reply-menu-button" aria-label="대댓글 더보기" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)}>•••</button>
            {isMenuOpen && (
              <div className="reply-menu-items">
                <button type="button" onClick={() => { setIsMenuOpen(false); onEdit() }}>수정</button>
                <button type="button" onClick={() => { setIsMenuOpen(false); onDelete() }}>삭제</button>
              </div>
            )}
          </div>
        )}
      </div>
      {isEditing ? (
        <ReplyForm initialContent={reply.replyContent} isEditing isSubmitting={isSubmitting} onSubmit={onUpdate} onCancel={onEditCancel} />
      ) : (
        <p className="comment-content">{reply.replyDeleted ? '삭제된 대댓글입니다.' : reply.replyContent}</p>
      )}
    </article>
  )
}

export default ReplyCard
