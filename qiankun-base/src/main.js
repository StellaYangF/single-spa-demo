import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

Vue.use(ElementUI);

import { registerMicroApps, start } from 'qiankun';

const apps = [
  {
    name: 'vueApp',
    entry: '//localhost:20000', // 默认加载这个 html，解析里面的 js，动态执行，子应用必须支持跨域 fetch
    container: '#vue',
    activeRule: '/vue'
  }, {
    name: 'reactApp',
    entry: '//localhost:20000', // 默认加载这个 html，解析里面的 js，动态执行，子应用必须支持跨域 fetch
    container: '#react',
    activeRule: '/react'
  }
];
registerMicroApps(apps);
start({
  prefetch: false, // 取消预抓取
});

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
