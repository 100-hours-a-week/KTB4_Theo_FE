import { Navigate, Route, Routes } from 'react-router'
import ProtectedRoute from '../components/routing/ProtectedRoute.jsx'
import LoginPage from '../features/auth/LoginPage.jsx'
import NotificationListPage from '../features/notifications/NotificationListPage.jsx'
import SignupPage from '../features/auth/SignupPage.jsx'
import PasswordEditPage from '../features/password/edit/PasswordEditPage.jsx'
import PostListPage from '../features/posts/PostListPage.jsx'
import PostCreatePage from '../features/posts/create/PostCreatePage.jsx'
import PostDetailPage from '../features/posts/detail/PostDetailPage.jsx'
import PostEditPage from '../features/posts/edit/PostEditPage.jsx'
import ProfileEditPage from '../features/profile/edit/ProfileEditPage.jsx'

function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/posts" element={<PostListPage />} />
        <Route path="/posts/new" element={<PostCreatePage />} />
        <Route path="/posts/:postId/edit" element={<PostEditPage />} />
        <Route path="/posts/:postId" element={<PostDetailPage />} />
        <Route path="/notifications" element={<NotificationListPage />} />
        <Route path="/profile/edit" element={<ProfileEditPage />} />
        <Route path="/password/edit" element={<PasswordEditPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRouter
