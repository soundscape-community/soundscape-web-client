import { createWebHashHistory, createRouter } from 'vue-router';

import MainView from '../views/MainView.vue'
import GPXView from '../views/GPXView.vue'
import HelpView from '../views/HelpView.vue'

const routes = [
  { path: '/', component: MainView },
  { path: '/at/:lat/:lon', component: MainView, props: true },
  { path: '/gpx', component: GPXView },
  { path: '/help', component: HelpView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router;