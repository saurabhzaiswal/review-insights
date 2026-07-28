import { createApp } from 'vue'
import './css/main.css'
import 'vue-select/dist/vue-select.css'
import './css/app.scss'
import './css/theme.scss'
import App from './App.vue'
import pinia from './stores/index'
import router from './router'
import vSelect from 'vue-select'
import { applyRuntimeMetadata } from './seo/runtime-metadata.js'

const app = createApp(App)

applyRuntimeMetadata()
app.component('VSelect', vSelect)
app.use(pinia)
app.use(router)

app.mount('#app')
