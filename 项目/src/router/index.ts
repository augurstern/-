import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: () => import('../views/HomeView.vue') },
    { path: '/about', component: () => import('../views/AboutView.vue'), meta: { requiresAuth: true } },
    { path: '/login', component: () => import('../views/LoginView.vue') }
  ]
})

router.beforeEach((to, from, next) => {
  console.log('导航从', from.path, '到', to.path)
  console.log('路由元信息 requiresAuth:', to.meta.requiresAuth)
  console.log('当前token存在:', !!localStorage.getItem('token'))

  if (to.meta.requiresAuth && !localStorage.getItem('token')) {
    console.log('跳转登录页，原因: 需要认证且未登录')
    next('/login')
  } else {
    console.log('允许通行，原因:', to.meta.requiresAuth ? '已认证' : '无需认证')
    next()
  }
})

export default router