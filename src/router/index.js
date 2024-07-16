import { createWebHashHistory, createRouter } from 'vue-router';

import MainView from '../views/MainView.vue';
import DetailView from '../views/DetailView.vue';
import GPXView from '../views/GPXView.vue';
import HelpView from '../views/HelpView.vue';

const routes = [
  { name: "Home", path: '/', component: MainView },
  { path: '/fixed/:lat/:lon', component: MainView, props: true },
  {
    name: "Detail",
    path: '/detail/:lat/:lon/:name',
    component: DetailView,
    props: true
  },
  { name: "GPX", path: '/gpx', component: GPXView },
  { name: "Help", path: '/help', component: HelpView },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;