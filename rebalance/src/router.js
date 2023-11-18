import { createRouter, createWebHistory } from 'vue-router';
import Home from './components/HomeComponent.vue';
import HV from './components/HVComponent.vue';
import Rebalance from './components/RebalanceComponent.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    props: true
  },
  {
    path: '/hv',
    name: 'hv',
    component: HV
  },
  {
    path: '/rebalance',
    name: 'Rebalance',
    component: Rebalance
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;