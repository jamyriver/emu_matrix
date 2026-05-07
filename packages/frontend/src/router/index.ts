import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        {
          path: '',
          name: 'lobby',
          component: () => import('@/views/game/LobbyView.vue'),
        },
        {
          path: 'game/:id',
          name: 'game-room',
          component: () => import('@/views/game/GameRoomView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/user/ProfileView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'saves',
          name: 'saves',
          component: () => import('@/views/user/SavesView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'screenshots',
          name: 'screenshots',
          component: () => import('@/views/user/ScreenshotsView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'recordings',
          name: 'recordings',
          component: () => import('@/views/user/RecordingsView.vue'),
          meta: { requiresAuth: true },
        },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next({ name: 'lobby' })
  } else {
    next()
  }
})

export default router
