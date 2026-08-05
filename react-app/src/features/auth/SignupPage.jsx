import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { signup } from '../../api/userApi.js'
import FormField from '../../components/form/FormField.jsx'
import ProfileImageField from '../../components/form/ProfileImageField.jsx'
import AuthLayout from '../../components/layout/AuthLayout.jsx'
import backButtonImage from '../../assets/images/back-button.png'
import basicProfileImage from '../../assets/images/basic-profile-icon.png'
import '../../styles/common.css'
import '../../styles/signup.css'
import {
  getImageRequestError,
  validateImageFiles,
} from '../../utils/imageFiles.js'
import {
  isPasswordConfirmed,
  isValidEmail,
  isValidNickname,
  isValidPassword,
  NICKNAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from './authValidation.js'

const EMAIL_FORMAT_ERROR =
  '* 올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)'
const PASSWORD_FORMAT_ERROR =
  `* 비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상, ${PASSWORD_MAX_LENGTH}자 이하이며, ` +
  '대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.'

const INITIAL_ERRORS = {
  profileImage: '',
  email: '',
  password: '',
  passwordConfirm: '',
  nickname: '',
}

function getEmailError(email) {
  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    return '* 이메일을 입력해주세요.'
  }

  if (!isValidEmail(trimmedEmail)) {
    return EMAIL_FORMAT_ERROR
  }

  return ''
}

function getPasswordError(password) {
  if (!password) {
    return '* 비밀번호를 입력해주세요.'
  }

  if (!isValidPassword(password)) {
    return PASSWORD_FORMAT_ERROR
  }

  return ''
}

function getPasswordConfirmError(password, passwordConfirm) {
  if (!passwordConfirm) {
    return '* 비밀번호를 한번 더 입력해주세요.'
  }

  if (!isPasswordConfirmed(password, passwordConfirm)) {
    return '* 비밀번호가 다릅니다.'
  }

  return ''
}

function getNicknameError(nickname) {
  const trimmedNickname = nickname.trim()

  if (!trimmedNickname) {
    return '* 닉네임을 입력해주세요.'
  }

  if (trimmedNickname.includes(' ')) {
    return '* 띄어쓰기를 없애주세요.'
  }

  if (trimmedNickname.length > NICKNAME_MAX_LENGTH) {
    return `* 닉네임은 최대 ${NICKNAME_MAX_LENGTH}자까지 작성 가능합니다.`
  }

  return ''
}

function SignupPage() {
  const navigate = useNavigate()
  const [profileFile, setProfileFile] = useState(null)
  const [profilePreviewUrl, setProfilePreviewUrl] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [errors, setErrors] = useState(INITIAL_ERRORS)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    return () => {
      if (profilePreviewUrl) {
        URL.revokeObjectURL(profilePreviewUrl)
      }
    }
  }, [profilePreviewUrl])

  const isFormValid =
    profileFile !== null &&
    isValidEmail(email.trim()) &&
    isValidPassword(password) &&
    isPasswordConfirmed(password, passwordConfirm) &&
    isValidNickname(nickname.trim())
  const canSubmit = isFormValid && !isSubmitting

  function validateProfileImage() {
    const error = validateImageFiles(
      profileFile ? [profileFile] : [],
      { required: true },
    )
    setErrors((currentErrors) => ({
      ...currentErrors,
      profileImage: error,
    }))
    return !error
  }

  function validateEmail() {
    const error = getEmailError(email)
    setErrors((currentErrors) => ({ ...currentErrors, email: error }))
    return !error
  }

  function validatePassword() {
    const error = getPasswordError(password)
    setErrors((currentErrors) => ({ ...currentErrors, password: error }))
    return !error
  }

  function validatePasswordConfirm() {
    const error = getPasswordConfirmError(password, passwordConfirm)
    setErrors((currentErrors) => ({
      ...currentErrors,
      passwordConfirm: error,
    }))
    return !error
  }

  function validateNickname() {
    const error = getNicknameError(nickname)
    setErrors((currentErrors) => ({ ...currentErrors, nickname: error }))
    return !error
  }

  function handleProfileImageChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      validateProfileImage()
      return
    }

    const error = validateImageFiles([file], { required: true })
    if (error) {
      setProfileFile(null)
      setProfilePreviewUrl(null)
      setErrors((currentErrors) => ({
        ...currentErrors,
        profileImage: error,
      }))
      event.target.value = ''
      return
    }

    setProfileFile(file)
    setProfilePreviewUrl(URL.createObjectURL(file))
    setErrors((currentErrors) => ({
      ...currentErrors,
      profileImage: '',
    }))
  }

  function handleProfileImageRemove() {
    setProfileFile(null)
    setProfilePreviewUrl(null)
    setErrors((currentErrors) => ({
      ...currentErrors,
      profileImage: '* 프로필 사진을 추가해주세요.',
    }))
  }

  function handlePasswordBlur() {
    const passwordError = getPasswordError(password)
    const passwordConfirmError = getPasswordConfirmError(
      password,
      passwordConfirm,
    )

    setErrors((currentErrors) => ({
      ...currentErrors,
      password: passwordError,
      passwordConfirm: passwordConfirmError,
    }))
  }

  function clearApiFieldErrors(fieldName, fieldError) {
    setErrors((currentErrors) => ({
      ...currentErrors,
      email: fieldName === 'email' ? fieldError : '',
      password: fieldName === 'password' ? fieldError : '',
      passwordConfirm: '',
      nickname: fieldName === 'nickname' ? fieldError : '',
    }))
  }

  function handleSignupError(error) {
    const status = error?.status
    const message = error?.message

    clearApiFieldErrors('', '')

    const imageError = getImageRequestError(error)
    if (imageError) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        profileImage: imageError,
      }))
      return
    }

    if (status === 400) {
      if (message === 'invalid_email_format') {
        clearApiFieldErrors(
          'email',
          '* 올바른 이메일 주소 형식을 입력해주세요.',
        )
        return
      }

      if (message === 'invalid_password_format') {
        clearApiFieldErrors('password', PASSWORD_FORMAT_ERROR)
        return
      }

      if (message === 'invalid_nickname_format') {
        clearApiFieldErrors(
          'nickname',
          `* 닉네임은 띄어쓰기 없이 최대 ${NICKNAME_MAX_LENGTH}자까지 작성 가능합니다.`,
        )
        return
      }

      alert('입력값을 다시 확인해주세요.')
      return
    }

    if (status === 409) {
      if (message === 'email_already_exist') {
        clearApiFieldErrors('email', '* 중복된 이메일입니다.')
        return
      }

      if (message === 'nickname_already_exist') {
        clearApiFieldErrors('nickname', '* 중복된 닉네임입니다.')
        return
      }

      alert('이미 사용 중인 정보가 있습니다.')
      return
    }

    if (status === 500) {
      alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    alert('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const isValid =
      validateProfileImage() &&
      validateEmail() &&
      validatePassword() &&
      validatePasswordConfirm() &&
      validateNickname()

    if (!isValid) {
      return
    }

    setIsSubmitting(true)

    try {
      await signup({
        email: email.trim(),
        password,
        passwordConfirm,
        nickname: nickname.trim(),
        profileImage: profileFile,
      })

      alert('회원가입이 완료되었습니다.')
      navigate('/login', { replace: true })
    } catch (error) {
      console.error(error)
      handleSignupError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="회원가입"
      description="코드 한입에서 지식을 나누고 성장 기록을 쌓아보세요."
      footerText="이미 계정이 있으신가요?"
      footerLinkLabel="로그인"
      footerTo="/login"
      backTo="/login"
      backLabel="로그인으로 돌아가기"
      backIconSrc={backButtonImage}
      mainClassName="signup-main"
      className="signup-shell"
      cardClassName="signup-container"
    >
      <form onSubmit={handleSubmit}>
        <ProfileImageField
          inputId="profile-image"
          label="프로필 사진*"
          guide="JPEG, PNG, WebP 형식의 이미지 1장을 최대 5MB까지 업로드할 수 있습니다."
          file={profileFile}
          previewUrl={profilePreviewUrl}
          error={errors.profileImage}
          defaultImageSrc={basicProfileImage}
          onChange={handleProfileImageChange}
          onRemove={handleProfileImageRemove}
          onEmptyClick={validateProfileImage}
        />

        <FormField
          id="email"
          name="email"
          type="email"
          label="이메일*"
          placeholder="이메일을 입력하세요"
          autoComplete="email"
          value={email}
          error={errors.email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={validateEmail}
        />

        <FormField
          id="password"
          name="password"
          type="password"
          label="비밀번호*"
          guide="8~20자, 대문자·소문자·숫자·특수문자를 각각 1개 이상 포함해주세요."
          guideClassName="signup-field-guide"
          placeholder="비밀번호를 입력하세요"
          autoComplete="new-password"
          value={password}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
          onBlur={handlePasswordBlur}
        />

        <FormField
          id="password-confirm"
          name="passwordConfirm"
          type="password"
          label="비밀번호 확인*"
          placeholder="비밀번호를 한번 더 입력하세요"
          autoComplete="new-password"
          value={passwordConfirm}
          error={errors.passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
          onBlur={validatePasswordConfirm}
        />

        <FormField
          id="nickname"
          name="nickname"
          label="닉네임*"
          guide="띄어쓰기 없이 10자 이내로 작성해주세요."
          guideClassName="signup-field-guide"
          placeholder="닉네임을 입력하세요"
          value={nickname}
          error={errors.nickname}
          onChange={(event) => setNickname(event.target.value)}
          onBlur={validateNickname}
        />

        <button
          type="submit"
          className={`primary-button signup-button${canSubmit ? ' active' : ''}`}
          disabled={!canSubmit}
        >
          회원가입
        </button>
      </form>
    </AuthLayout>
  )
}

export default SignupPage
