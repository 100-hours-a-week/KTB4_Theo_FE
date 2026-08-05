import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { updatePassword } from '../../../api/userApi.js'
import StatusToast from '../../../components/feedback/StatusToast.jsx'
import AppLayout from '../../../components/layout/AppLayout.jsx'
import useHeaderControls from '../../../hooks/useHeaderControls.js'
import '../../../styles/common.css'
import '../../../styles/password-edit.css'
import useAuth from '../../auth/useAuth.js'
import PasswordEditForm from './components/PasswordEditForm.jsx'

const EMPTY_SERVER_ERRORS = {
  password: '',
  passwordConfirm: '',
}
const EDIT_PASSWORD_TOAST_DURATION_MS = 2000

function PasswordEditPage() {
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
  const [formRevision, setFormRevision] = useState(0)
  const [isToastVisible, setIsToastVisible] = useState(false)
  const updatePromiseRef = useRef(null)
  const toastTimerRef = useRef(null)
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

  const showEditPasswordToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }

    setIsToastVisible(true)
    toastTimerRef.current = setTimeout(() => {
      toastTimerRef.current = null

      if (isMountedRef.current) {
        setIsToastVisible(false)
      }
    }, EDIT_PASSWORD_TOAST_DURATION_MS)
  }, [])

  const handleUpdateError = useCallback(
    (error) => {
      const status = error?.status
      const message = error?.message

      setServerErrors(EMPTY_SERVER_ERRORS)

      if (status === 400 && message === 'blank_password') {
        setServerErrors({
          ...EMPTY_SERVER_ERRORS,
          password: '* 비밀번호를 입력해주세요.',
        })
        return
      }

      if (status === 400 && message === 'invalid_password_format') {
        setServerErrors({
          ...EMPTY_SERVER_ERRORS,
          password:
            '* 비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.',
        })
        return
      }

      if (status === 400 && message === 'password_mismatch') {
        setServerErrors({
          ...EMPTY_SERVER_ERRORS,
          passwordConfirm: '* 비밀번호 확인과 다릅니다.',
        })
        return
      }

      if (status === 401 && message === 'unauthorized_request') {
        alert('로그인이 필요합니다.')
        navigate('/login', { replace: true })
        return
      }

      if (status === 409 && message === 'same_password') {
        setServerErrors({
          ...EMPTY_SERVER_ERRORS,
          password: '* 기존 비밀번호와 다른 비밀번호를 입력해주세요.',
        })
        return
      }

      if (status === 500 && message === 'internal_server_error') {
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        return
      }

      alert('비밀번호 수정 중 오류가 발생했습니다.')
    },
    [navigate],
  )

  const handleSubmit = useCallback(
    ({ password, passwordConfirm }) => {
      if (updatePromiseRef.current) {
        return updatePromiseRef.current
      }

      setServerErrors(EMPTY_SERVER_ERRORS)
      setIsSubmitting(true)

      const requestPromise = updatePassword({ password, passwordConfirm })
        .then(() => {
          if (!isMountedRef.current) {
            return
          }

          setFormRevision((currentRevision) => currentRevision + 1)
          showEditPasswordToast()
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
            setIsSubmitting(false)
          }
        })

      updatePromiseRef.current = requestPromise
      return requestPromise
    },
    [handleUpdateError, showEditPasswordToast],
  )

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
      pageClassName="edit-password-page"
      headerClassName="edit-password-header"
      mainClassName="edit-password-main"
      headerProps={{
        logoClassName: 'edit-password-logo',
        profileImagePath: user?.profileImageUrl,
        isProfileMenuOpen,
        onProfileMenuToggle: toggleProfileMenu,
        onProfileMenuClose: closeProfileMenu,
        onLogout: handleLogout,
        isLoggingOut,
      }}
    >
      <section
        className="edit-password-container"
        aria-labelledby="edit-password-title"
      >
        <h2 className="edit-password-title" id="edit-password-title">
          비밀번호 수정
        </h2>
        <p className="edit-password-description">
          안전한 비밀번호로 계정을 보호해주세요.
        </p>

        <PasswordEditForm
          key={formRevision}
          isSubmitting={isSubmitting}
          serverErrors={serverErrors}
          onClearServerError={clearServerError}
          onSubmit={handleSubmit}
        />

        <StatusToast
          isVisible={isToastVisible}
          className="edit-password-toast"
        >
          수정완료
        </StatusToast>
      </section>
    </AppLayout>
  )
}

export default PasswordEditPage
