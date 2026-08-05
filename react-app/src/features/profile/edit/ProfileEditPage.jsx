import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  deleteCurrentUser,
  updateCurrentUser as requestUpdateCurrentUser,
} from '../../../api/userApi.js'
import ConfirmModal from '../../../components/feedback/ConfirmModal.jsx'
import StatusToast from '../../../components/feedback/StatusToast.jsx'
import AppLayout from '../../../components/layout/AppLayout.jsx'
import useHeaderControls from '../../../hooks/useHeaderControls.js'
import { getImageRequestError } from '../../../utils/imageFiles.js'
import '../../../styles/common.css'
import '../../../styles/profile-edit.css'
import useAuth from '../../auth/useAuth.js'
import ProfileEditForm from './components/ProfileEditForm.jsx'

const EDIT_PROFILE_TOAST_DURATION_MS = 2000

function ProfileEditPage() {
  const navigate = useNavigate()
  const {
    user,
    logout,
    isLoggingOut,
    updateCurrentUser,
    clearAuth,
  } = useAuth()
  const {
    isProfileMenuOpen,
    closeProfileMenu,
    toggleProfileMenu,
    handleLogout,
  } = useHeaderControls({ logout })
  const [serverNicknameError, setServerNicknameError] = useState('')
  const [serverProfileImageError, setServerProfileImageError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [formRevision, setFormRevision] = useState(0)
  const [isToastVisible, setIsToastVisible] = useState(false)
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const updatePromiseRef = useRef(null)
  const deletePromiseRef = useRef(null)
  const toastTimerRef = useRef(null)
  const isMountedRef = useRef(false)

  const clearServerNicknameError = useCallback(() => {
    setServerNicknameError('')
  }, [])

  const clearServerProfileImageError = useCallback(() => {
    setServerProfileImageError('')
  }, [])

  const showEditProfileToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }

    setIsToastVisible(true)
    toastTimerRef.current = setTimeout(() => {
      toastTimerRef.current = null

      if (isMountedRef.current) {
        setIsToastVisible(false)
      }
    }, EDIT_PROFILE_TOAST_DURATION_MS)
  }, [])

  const handleUpdateError = useCallback(
    (error) => {
      const status = error?.status
      const message = error?.message

      setServerNicknameError('')
      setServerProfileImageError('')

      const imageError = getImageRequestError(error)
      if (imageError) {
        setServerProfileImageError(imageError)
        return
      }

      if (status === 400 && message === 'blank_nickname') {
        setServerNicknameError('* 닉네임을 입력해주세요.')
        return
      }

      if (status === 400 && message === 'invalid_nickname_format') {
        setServerNicknameError(
          '* 닉네임은 띄어쓰기 없이 최대 10자까지 작성 가능합니다.',
        )
        return
      }

      if (status === 401 && message === 'unauthorized_request') {
        alert('로그인이 필요합니다.')
        navigate('/login', { replace: true })
        return
      }

      if (status === 409 && message === 'same_nickname') {
        setServerNicknameError('* 현재 사용 중인 닉네임과 같습니다.')
        return
      }

      if (status === 409 && message === 'nickname_already_exist') {
        setServerNicknameError('* 중복된 닉네임입니다.')
        return
      }

      if (status === 500 && message === 'internal_server_error') {
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        return
      }

      alert('회원정보 수정 중 오류가 발생했습니다.')
    },
    [navigate],
  )

  const handleSubmit = useCallback(
    ({ nickname, profileFile }) => {
      if (!user || updatePromiseRef.current) {
        return updatePromiseRef.current
      }

      const trimmedNickname = nickname.trim()
      const originalProfileImage = user.profileImageUrl || ''
      setServerNicknameError('')
      setServerProfileImageError('')
      setIsUpdating(true)

      const requestPromise = requestUpdateCurrentUser({
        nickname: trimmedNickname,
        profileImage: profileFile,
      })
        .then((updatedUser) => {
          if (!isMountedRef.current) {
            return
          }

          const normalizedUser = {
            ...user,
            ...updatedUser,
            email: updatedUser?.email || user.email || '',
            nickname: updatedUser?.nickname || trimmedNickname,
            profileImageUrl:
              updatedUser?.profileImageUrl || originalProfileImage,
          }

          updateCurrentUser(normalizedUser)
          setFormRevision((currentRevision) => currentRevision + 1)
          showEditProfileToast()
        })
        .catch((error) => {
          if (isMountedRef.current) {
            console.error(error)
            handleUpdateError(error)
          }
        })
        .finally(() => {
          updatePromiseRef.current = null

          if (isMountedRef.current) {
            setIsUpdating(false)
          }
        })

      updatePromiseRef.current = requestPromise
      return requestPromise
    },
    [handleUpdateError, showEditProfileToast, updateCurrentUser, user],
  )

  const handleWithdrawalRequest = useCallback(() => {
    setIsWithdrawalOpen(true)
  }, [])

  const handleWithdrawalCancel = useCallback(() => {
    if (!deletePromiseRef.current) {
      setIsWithdrawalOpen(false)
    }
  }, [])

  const handleWithdrawalError = useCallback(
    (error) => {
      const status = error?.status
      const message = error?.message

      if (status === 401 && message === 'unauthorized_request') {
        alert('로그인이 필요합니다.')
        navigate('/login', { replace: true })
        return
      }

      if (status === 500 && message === 'internal_server_error') {
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        return
      }

      alert('회원 탈퇴 중 오류가 발생했습니다.')
    },
    [navigate],
  )

  const handleWithdrawalConfirm = useCallback(() => {
    if (deletePromiseRef.current) {
      return deletePromiseRef.current
    }

    setIsDeleting(true)

    const requestPromise = deleteCurrentUser()
      .then(() => {
        clearAuth()
        navigate('/login', { replace: true })
      })
      .catch((error) => {
        if (isMountedRef.current) {
          console.error(error)
          handleWithdrawalError(error)
        }
      })
      .finally(() => {
        deletePromiseRef.current = null

        if (isMountedRef.current) {
          setIsDeleting(false)
        }
      })

    deletePromiseRef.current = requestPromise
    return requestPromise
  }, [clearAuth, handleWithdrawalError, navigate])

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false

      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
        toastTimerRef.current = null
      }
    }
  }, [])

  return (
    <AppLayout
      pageClassName="edit-profile-page"
      headerClassName="edit-profile-header"
      mainClassName="edit-profile-main"
      headerProps={{
        logoClassName: 'edit-profile-logo',
        profileImagePath: user?.profileImageUrl,
        isProfileMenuOpen,
        onProfileMenuToggle: toggleProfileMenu,
        onProfileMenuClose: closeProfileMenu,
        onLogout: handleLogout,
        isLoggingOut,
      }}
    >
      <section
        className="edit-profile-container"
        aria-labelledby="edit-profile-title"
      >
        <h2 className="edit-profile-title" id="edit-profile-title">
          회원정보 수정
        </h2>
        <p className="edit-profile-description">
          프로필과 닉네임을 관리해보세요.
        </p>

        {user && (
          <ProfileEditForm
            key={formRevision}
            user={user}
            isSubmitting={isUpdating}
            serverNicknameError={serverNicknameError}
            serverProfileImageError={serverProfileImageError}
            onClearServerError={clearServerNicknameError}
            onClearProfileImageError={clearServerProfileImageError}
            onSubmit={handleSubmit}
            onWithdrawalRequest={handleWithdrawalRequest}
          />
        )}

        <StatusToast
          isVisible={isToastVisible}
          className="edit-profile-toast"
        >
          수정완료
        </StatusToast>
      </section>

      <ConfirmModal
        isOpen={isWithdrawalOpen}
        title="회원탈퇴 하시겠습니까?"
        description="작성된 게시글과 댓글은 삭제됩니다."
        isSubmitting={isDeleting}
        onConfirm={handleWithdrawalConfirm}
        onCancel={handleWithdrawalCancel}
        backdropClassName="withdrawal-modal-backdrop"
        className="withdrawal-modal"
      />
    </AppLayout>
  )
}

export default ProfileEditPage
