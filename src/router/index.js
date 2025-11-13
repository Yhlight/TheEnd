import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Game from '../views/Game.vue'
import SongSelect from '../views/SongSelect.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/game',
    name: 'Game',
    component: Game
  },
  {
    path: '/song-select',
    name: 'SongSelect',
    component: SongSelect
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
