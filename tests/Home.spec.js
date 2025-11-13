import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../src/views/Home.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
        path: '/song-select',
        name: 'SongSelect',
        component: { template: '<div></div>'}
    }
  ],
})

describe('Home.vue', () => {
  it('renders a welcome message', () => {
    const wrapper = mount(Home, {
      global: {
        plugins: [router]
      }
    })
    expect(wrapper.text()).toContain('Welcome to TheEnd')
  })
})
