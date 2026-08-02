import { useRef } from 'react'
import { Link } from 'react-router'
import ProfileImage from '../media/ProfileImage.jsx'
import NotificationButton from './NotificationButton.jsx'
import ProfileMenu from './ProfileMenu.jsx'

function Header({
  className = '',
  logoClassName = 'posts-logo',
  profileImagePath,
  isProfileMenuOpen,
  onProfileMenuToggle,
  onProfileMenuClose,
  onLogout,
  isLoggingOut,
  backTo,
  backLabel = '게시글 목록으로 돌아가기',
  backIconSrc,
}) {
  const profileMenuContainerRef = useRef(null)
  const profileButtonRef = useRef(null)
  const headerClassName = ['header', className].filter(Boolean).join(' ')

  function handleProfileButtonClick(event) {
    event.stopPropagation()
    onProfileMenuToggle()
  }

  return (
    <header className={headerClassName}>
      {backTo && (
        <Link className="header-back-link" to={backTo} aria-label={backLabel}>
          {backIconSrc ? (
            <img src={backIconSrc} alt="" aria-hidden="true" />
          ) : (
            '←'
          )}
        </Link>
      )}

      <h1 className={logoClassName}>
        <Link
          className="header-logo-link"
          to="/posts"
          aria-label="게시글 목록으로 이동"
        >
          <span aria-hidden="true">&lt;/&gt;</span>
          코드 한입
        </Link>
      </h1>

      <div
        className="profile-menu-container"
        ref={profileMenuContainerRef}
      >
        <NotificationButton />

        <button
          type="button"
          className="profile-button"
          ref={profileButtonRef}
          aria-label="회원 메뉴 열기"
          aria-expanded={isProfileMenuOpen}
          aria-controls="profile-menu"
          onClick={handleProfileButtonClick}
        >
          <ProfileImage
            className="profile-image"
            imagePath={profileImagePath}
            alt="내 프로필 사진"
          />
        </button>

        <ProfileMenu
          isOpen={isProfileMenuOpen}
          onClose={onProfileMenuClose}
          onLogout={onLogout}
          isLoggingOut={isLoggingOut}
          containerRef={profileMenuContainerRef}
          triggerRef={profileButtonRef}
        />
      </div>
    </header>
  )
}

export default Header
