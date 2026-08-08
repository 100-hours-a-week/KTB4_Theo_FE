import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import AuthInitializationError from '../feedback/AuthInitializationError.jsx'
import LoadingView from '../feedback/LoadingView.jsx'
import useAuth from '../../features/auth/useAuth.js'

function ProtectedRoute() {
  const location = useLocation()
  const { accessToken, user, initializeAuth } = useAuth()
  const [status, setStatus] = useState('initializing')
  const [isRetrying, setIsRetrying] = useState(false)
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (user) {
      return undefined
    }

    if (status !== 'initializing' && !accessToken) {
      return undefined
    }

    let isActive = true

    initializeAuth()
      .then(() => {
        if (isActive) {
          setStatus('authenticated')
        }
      })
      .catch((error) => {
        if (isActive) {
          console.error(error)
          setStatus('failed')
        }
      })

    return () => {
      isActive = false
    }
  }, [accessToken, initializeAuth, status, user])

  async function handleRetry() {
    if (isRetrying) {
      return
    }

    setIsRetrying(true)

    try {
      await initializeAuth()

      if (isMountedRef.current) {
        setStatus('authenticated')
      }
    } catch (error) {
      console.error(error)

      if (isMountedRef.current) {
        setStatus('failed')
      }
    } finally {
      if (isMountedRef.current) {
        setIsRetrying(false)
      }
    }
  }

  if (accessToken && user) {
    return <Outlet />
  }

  if (status === 'initializing') {
    return <LoadingView />
  }

  if (!accessToken) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  if (status === 'failed') {
    return (
      <AuthInitializationError
        onRetry={handleRetry}
        isRetrying={isRetrying}
      />
    )
  }

  return null
}

export default ProtectedRoute
