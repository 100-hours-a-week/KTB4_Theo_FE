import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import {
  login as requestLogin,
  logout as requestLogout,
} from '../../api/authApi.js'
import {
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
  subscribeAccessToken,
} from '../../api/client.js'
import { getCurrentUser } from '../../api/userApi.js'
import AuthContext from './authContext.js'

function AuthProvider({ children }) {
  const accessToken = useSyncExternalStore(
    subscribeAccessToken,
    getAccessToken,
    getAccessToken,
  )
  const [user, setUser] = useState(null)
  const [isAuthInitializing, setIsAuthInitializing] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const initializationPromiseRef = useRef(null)
  const logoutPromiseRef = useRef(null)

  useEffect(
    () =>
      subscribeAccessToken(() => {
        if (!getAccessToken()) {
          setUser(null)
        }
      }),
    [],
  )

  const clearAuth = useCallback(() => {
    clearAccessToken()
    setUser(null)
  }, [])

  const updateCurrentUser = useCallback((updatedUser) => {
    if (!updatedUser) {
      throw new Error('갱신할 사용자 정보가 없습니다.')
    }

    setUser(updatedUser)
  }, [])

  const login = useCallback(async (credentials) => {
    const { accessToken: newAccessToken } = await requestLogin(credentials)

    saveAccessToken(newAccessToken)
    setUser(null)
  }, [])

  const initializeAuth = useCallback(() => {
    if (!initializationPromiseRef.current) {
      setIsAuthInitializing(true)

      initializationPromiseRef.current = getCurrentUser()
        .then((currentUser) => {
          setUser(currentUser)
          return currentUser
        })
        .catch((error) => {
          setUser(null)

          const isUnauthorized = error?.status === 401
          const hasAccessToken = Boolean(getAccessToken())

          if (isUnauthorized || !hasAccessToken) {
            clearAuth()
          }

          throw error
        })
        .finally(() => {
          setIsAuthInitializing(false)
          initializationPromiseRef.current = null
        })
      }

    return initializationPromiseRef.current
  }, [clearAuth])

  const logout = useCallback(() => {
    if (!logoutPromiseRef.current) {
      setIsLoggingOut(true)

      logoutPromiseRef.current = requestLogout()
        .then(() => {
          clearAuth()
        })
        .finally(() => {
          setIsLoggingOut(false)
          logoutPromiseRef.current = null
        })
    }

    return logoutPromiseRef.current
  }, [clearAuth])

  const contextValue = useMemo(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken && user),
      isAuthInitializing,
      isLoggingOut,
      login,
      logout,
      initializeAuth,
      clearAuth,
      updateCurrentUser,
    }),
    [
      accessToken,
      user,
      isAuthInitializing,
      isLoggingOut,
      login,
      logout,
      initializeAuth,
      clearAuth,
      updateCurrentUser,
    ],
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
