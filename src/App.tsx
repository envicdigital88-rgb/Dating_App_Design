import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { PwaProvider } from './components/PwaProvider';
import { AppShell } from './components/AppShell';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Onboarding } from './pages/Onboarding';
import { Discover } from './pages/Discover';
import { Likes } from './pages/Likes';
import { Requests } from './pages/Requests';
import { Connections } from './pages/Connections';
import { Messages } from './pages/Messages';
import { Chat } from './pages/Chat';
import { Photos } from './pages/Photos';
import { Notifications } from './pages/Notifications';
import { MyProfile } from './pages/MyProfile';
import { ProfileDetail } from './pages/ProfileDetail';
import { Packages } from './pages/Packages';
import { Checkout } from './pages/Checkout';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { Settings } from './pages/Settings';
import { AdminShell } from './pages/admin/AdminShell';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminModeration } from './pages/admin/AdminModeration';
import { AdminActivity } from './pages/admin/AdminActivity';
import { AdminPackages } from './pages/admin/AdminPackages';
import { AdminPayments } from './pages/admin/AdminPayments';

function RequireAuth({ children }: {children: React.ReactNode;}) {
  const { currentUser } = useStore();
  const location = useLocation();
  if (!currentUser) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  if (!currentUser.onboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: {children: React.ReactNode;}) {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/signin" replace />;
  if (currentUser.role !== 'admin') return <Navigate to="/app/discover" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <StoreProvider>
      <PwaProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/join" element={<Auth mode="register" />} />
            <Route path="/signin" element={<Auth mode="signin" />} />
            <Route path="/onboarding" element={<Onboarding />} />

            <Route
              path="/app"
              element={
              <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }>
              
              <Route index element={<Navigate to="/app/discover" replace />} />
              <Route path="discover" element={<Discover />} />
              <Route path="likes" element={<Likes />} />
              <Route path="requests" element={<Requests />} />
              <Route path="connections" element={<Connections />} />
              <Route path="messages" element={<Messages />} />
              <Route path="messages/:conversationId" element={<Chat />} />
              <Route path="photos" element={<Photos />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<MyProfile />} />
              <Route path="profile/:userId" element={<ProfileDetail />} />
              <Route path="packages" element={<Packages />} />
              <Route path="checkout/:packageId" element={<Checkout />} />
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route
              path="/admin"
              element={
              <RequireAdmin>
                  <AdminShell />
                </RequireAdmin>
              }>
              
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="moderation" element={<AdminModeration />} />
              <Route path="activity" element={<AdminActivity />} />
              <Route path="packages" element={<AdminPackages />} />
              <Route path="payments" element={<AdminPayments />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                borderRadius: '999px',
                border: '1px solid #e8ddd2',
                background: '#ffffff',
                color: '#1d1420',
                fontFamily: 'Inter, system-ui, sans-serif'
              }
            }} />
          
        </BrowserRouter>
      </PwaProvider>
    </StoreProvider>);

}