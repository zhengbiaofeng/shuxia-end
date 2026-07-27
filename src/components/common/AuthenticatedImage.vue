<template>
  <span
    class="authenticated-image"
    :class="{ 'is-loading': loading, 'is-fallback': !resolvedSrc }"
    :style="fallbackStyle"
    :aria-label="alt || undefined"
    role="img"
  >
    <img v-if="resolvedSrc" :src="resolvedSrc" :alt="alt" @error="handleImageError" />
    <span v-else-if="fallbackText" class="authenticated-image__fallback" aria-hidden="true">
      {{ fallbackText }}
    </span>
  </span>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { API_BASE_URL } from '../../config/app'
import request from '../../utils/request'

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  alt: {
    type: String,
    default: '',
  },
  fallbackStyle: {
    type: Object,
    default: () => ({}),
  },
})

const resolvedSrc = ref('')
const loading = ref(false)
let ownedObjectUrl = ''
let loadVersion = 0

const fallbackText = computed(() => String(props.alt || '').trim().slice(0, 1))

watch(() => props.src, loadImage, { immediate: true })

onBeforeUnmount(() => {
  loadVersion += 1
  releaseObjectUrl()
})

async function loadImage(value) {
  const version = ++loadVersion
  releaseObjectUrl()
  resolvedSrc.value = ''

  const source = String(value || '').trim()
  if (!source) return

  if (!isBackendResource(source)) {
    resolvedSrc.value = source
    return
  }

  loading.value = true
  try {
    const blob = await request.get(source, { responseType: 'blob' })
    if (version !== loadVersion) return
    if (!(blob instanceof Blob) || !blob.type.startsWith('image/') || blob.size === 0) {
      throw new Error('Invalid image response')
    }
    ownedObjectUrl = URL.createObjectURL(blob)
    resolvedSrc.value = ownedObjectUrl
  } catch (error) {
    if (version === loadVersion) {
      resolvedSrc.value = ''
      console.warn('Authenticated image failed to load.', source, error)
    }
  } finally {
    if (version === loadVersion) loading.value = false
  }
}

function isBackendResource(source) {
  if (source.startsWith('data:') || source.startsWith('blob:')) return false
  if (source.startsWith('/')) return true

  try {
    const apiUrl = new URL(API_BASE_URL, window.location.origin)
    const sourceUrl = new URL(source, window.location.origin)
    return apiUrl.origin === sourceUrl.origin
  } catch {
    return false
  }
}

function handleImageError() {
  resolvedSrc.value = ''
  releaseObjectUrl()
}

function releaseObjectUrl() {
  if (!ownedObjectUrl) return
  URL.revokeObjectURL(ownedObjectUrl)
  ownedObjectUrl = ''
}
</script>

<style scoped>
.authenticated-image {
  align-items: center;
  background: linear-gradient(145deg, #e9f1ff, #c9d9f6);
  color: #315b9d;
  display: inline-flex;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.authenticated-image img {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.authenticated-image__fallback {
  font-size: 16px;
  font-weight: 800;
}

.authenticated-image.is-loading::after {
  animation: authenticated-image-pulse 1.1s ease-in-out infinite;
  background: rgba(255, 255, 255, 0.42);
  content: '';
  inset: 0;
  position: absolute;
}

@keyframes authenticated-image-pulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.8; }
}
</style>
