import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

// 项目全局样式（加载顺序：tokens → breakpoints → reset）
import './styles/tokens.css';
import './styles/breakpoints.css';
import './styles/reset.css';

import App from './App.vue';
import router from './router';
import { pinia } from './stores';

createApp(App).use(pinia).use(ElementPlus).use(router).mount('#app');
