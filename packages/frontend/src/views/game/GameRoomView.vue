<template>
  <div class="h-screen flex flex-col bg-black">
    <div class="flex items-center justify-between px-4 py-2 bg-gray-800">
      <div class="flex items-center space-x-4">
        <button @click="goBack" class="text-gray-400 hover:text-white text-sm">← 返回大厅</button>
        <span v-if="game" class="text-white font-medium">{{ game.name }}</span>
        <span v-if="game" :class="platformBadgeClass(game.platform)">{{ platformLabel(game.platform) }}</span>
      </div>
      <div class="flex items-center space-x-2">
        <button @click="handleSaveState" class="btn-primary text-xs" :disabled="!emulatorReady">存档</button>
        <button @click="handleLoadState" class="btn-secondary text-xs" :disabled="!emulatorReady">读档</button>
        <button @click="handleScreenshot" class="btn-secondary text-xs" :disabled="!emulatorReady">截图</button>
        <button @click="toggleAspectRatio" class="btn-secondary text-xs">{{ aspectRatioLabel }}</button>
        <button @click="toggleFullscreen" class="btn-secondary text-xs">全屏</button>
      </div>
    </div>

    <div class="flex-1 relative flex items-center justify-center overflow-hidden">
      <div v-if="loading" class="text-center">
        <div class="text-primary-400 text-xl mb-2">加载游戏中...</div>
        <div class="w-64 bg-gray-700 rounded-full h-2">
          <div class="bg-primary-500 h-2 rounded-full transition-all" :style="{ width: `${loadProgress}%` }"></div>
        </div>
        <div class="text-gray-400 text-sm mt-2">{{ loadProgress }}%</div>
      </div>
      <div
        id="emulator-container"
        :class="{ hidden: loading }"
        :style="emulatorContainerStyle"
      ></div>
    </div>

    <div v-if="showMobileControls && emulatorReady" class="bg-gray-900/95 px-4 py-3 safe-area-bottom">
      <div class="flex items-center justify-between max-w-2xl mx-auto">
        <div class="grid grid-cols-3 grid-rows-3 gap-1 w-28">
          <div></div>
          <button @touchstart.prevent="pressButton('up')" @touchend.prevent="releaseButton('up')" class="bg-gray-700 rounded p-2 text-center text-xs text-white active:bg-gray-500">↑</button>
          <div></div>
          <button @touchstart.prevent="pressButton('left')" @touchend.prevent="releaseButton('left')" class="bg-gray-700 rounded p-2 text-center text-xs text-white active:bg-gray-500">←</button>
          <div class="bg-gray-800 rounded"></div>
          <button @touchstart.prevent="pressButton('right')" @touchend.prevent="releaseButton('right')" class="bg-gray-700 rounded p-2 text-center text-xs text-white active:bg-gray-500">→</button>
          <div></div>
          <button @touchstart.prevent="pressButton('down')" @touchend.prevent="releaseButton('down')" class="bg-gray-700 rounded p-2 text-center text-xs text-white active:bg-gray-500">↓</button>
          <div></div>
        </div>

        <div class="flex flex-col items-center space-y-1">
          <div class="flex space-x-1">
            <button v-if="currentControls.triggers" @touchstart.prevent="pressButton('l')" @touchend.prevent="releaseButton('l')" class="bg-gray-700 rounded px-3 py-1 text-xs text-white active:bg-gray-500">L</button>
            <button v-if="currentControls.triggers" @touchstart.prevent="pressButton('r')" @touchend.prevent="releaseButton('r')" class="bg-gray-700 rounded px-3 py-1 text-xs text-white active:bg-gray-500">R</button>
          </div>
          <div class="flex items-center space-x-2">
            <button @touchstart.prevent="pressButton('select')" @touchend.prevent="releaseButton('select')" class="bg-gray-700 rounded px-2 py-1 text-xs text-gray-400 active:bg-gray-500">SELECT</button>
            <button @touchstart.prevent="pressButton('start')" @touchend.prevent="releaseButton('start')" class="bg-gray-700 rounded px-2 py-1 text-xs text-gray-400 active:bg-gray-500">START</button>
          </div>
        </div>

        <div class="flex items-center space-x-3">
          <button @touchstart.prevent="pressButton('b')" @touchend.prevent="releaseButton('b')" class="w-12 h-12 rounded-full bg-red-700 text-white text-sm font-bold active:bg-red-500 flex items-center justify-center">B</button>
          <button @touchstart.prevent="pressButton('a')" @touchend.prevent="releaseButton('a')" class="w-12 h-12 rounded-full bg-red-700 text-white text-sm font-bold active:bg-red-500 flex items-center justify-center">A</button>
        </div>
      </div>
    </div>

    <div v-if="showSaveModal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div class="card p-6 w-full max-w-md">
        <h2 class="text-xl font-bold text-white mb-4">存档管理</h2>
        <div class="space-y-3">
          <div v-for="slot in 5" :key="slot" class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div>
              <span class="text-white">存档位 {{ slot }}</span>
              <span v-if="saves[slot]" class="text-gray-400 text-xs ml-2">
                {{ formatDate(saves[slot].updated_at) }}
              </span>
            </div>
            <div class="flex space-x-2">
              <button @click="saveToSlot(slot)" class="btn-primary text-xs">保存</button>
              <button v-if="saves[slot]" @click="loadFromSlot(slot)" class="btn-secondary text-xs">加载</button>
            </div>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div>
              <span class="text-yellow-400">自动存档</span>
              <span v-if="saves[0]" class="text-gray-400 text-xs ml-2">
                {{ formatDate(saves[0].updated_at) }}
              </span>
            </div>
            <button v-if="saves[0]" @click="loadFromSlot(0)" class="btn-secondary text-xs">加载</button>
          </div>
        </div>
        <button @click="showSaveModal = false" class="btn-secondary w-full mt-4">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'
import { savesApi } from '@/api/saves'
import { gamesApi } from '@/api/games'
import type { Game, Platform, CloudSave, PlatformControlMapping } from '@emu-matrix/shared'
import {
  PLATFORM_LABELS,
  PLATFORM_CORE_MAP,
  PLATFORM_SYSTEM_MAP,
  PLATFORM_NATIVE_RESOLUTION,
  PLATFORM_CONTROL_MAPPINGS,
  AUTO_SAVE_INTERVAL_MS,
} from '@emu-matrix/shared'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()
const authStore = useAuthStore()

const game = ref<Game | null>(null)
const loading = ref(true)
const loadProgress = ref(0)
const emulatorReady = ref(false)
const showSaveModal = ref(false)
const saves = ref<Record<number, CloudSave>>({})
const aspectMode = ref<'native' | 'stretch' | '4:3'>('native')
const showMobileControls = ref(false)

let autoSaveTimer: ReturnType<typeof setInterval> | null = null

const gameId = route.params.id as string

const currentControls = computed<PlatformControlMapping>(() => {
  const platform = game.value?.platform
  if (!platform) return PLATFORM_CONTROL_MAPPINGS.nes
  return PLATFORM_CONTROL_MAPPINGS[platform] || PLATFORM_CONTROL_MAPPINGS.nes
})

const aspectRatioLabel = computed(() => {
  const labels: Record<string, string> = {
    native: '原始比例',
    stretch: '拉伸填充',
    '4:3': '4:3',
  }
  return labels[aspectMode.value] || '原始比例'
})

const emulatorContainerStyle = computed(() => {
  const platform = game.value?.platform
  if (!platform || aspectMode.value === 'stretch') {
    return { width: '100%', height: '100%' }
  }

  const res = PLATFORM_NATIVE_RESOLUTION[platform]
  if (!res) return { width: '100%', height: '100%' }

  if (aspectMode.value === 'native') {
    const ratio = res.width / res.height
    return {
      maxWidth: '100%',
      maxHeight: '100%',
      aspectRatio: ratio.toString(),
    }
  }

  if (aspectMode.value === '4:3') {
    return {
      maxWidth: '100%',
      maxHeight: '100%',
      aspectRatio: '4/3',
    }
  }

  return { width: '100%', height: '100%' }
})

function toggleAspectRatio() {
  const modes: Array<'native' | 'stretch' | '4:3'> = ['native', '4:3', 'stretch']
  const idx = modes.indexOf(aspectMode.value)
  aspectMode.value = modes[(idx + 1) % modes.length]
}

function goBack() {
  if (confirm('确定要离开游戏吗？离开前将自动保存。')) {
    handleAutoSave()
    router.push('/')
  }
}

function platformLabel(platform: Platform): string {
  return PLATFORM_LABELS[platform] || platform
}

function platformBadgeClass(platform: Platform): string {
  const map: Record<Platform, string> = {
    nes: 'platform-badge-nes',
    md: 'platform-badge-md',
    snes: 'platform-badge-snes',
    gb: 'platform-badge-gb',
    gba: 'platform-badge-gba',
  }
  return map[platform] || ''
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function isMobileDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

async function loadGame() {
  try {
    await gameStore.fetchGame(gameId)
    game.value = gameStore.currentGame

    if (!game.value) {
      alert('游戏不存在')
      router.push('/')
      return
    }

    showMobileControls.value = isMobileDevice()

    await loadSaves()

    const romResponse = await gamesApi.getRomUrl(gameId)
    if (!romResponse.success || !romResponse.data) {
      alert('获取ROM失败')
      return
    }

    await initEmulator(romResponse.data.romUrl, game.value.platform)
  } catch (error) {
    console.error('Load game error:', error)
    alert('加载游戏失败')
    router.push('/')
  }
}

async function initEmulator(romUrl: string, platform: Platform) {
  loading.value = true
  loadProgress.value = 10

  try {
    const romResponse = await fetch(romUrl)
    const contentLength = romResponse.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0

    const reader = romResponse.body?.getReader()
    if (!reader) throw new Error('No reader available')

    const chunks: Uint8Array[] = []
    let received = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      received += value.length
      if (total > 0) {
        loadProgress.value = Math.min(90, Math.round((received / total) * 90))
      }
    }

    const romData = new Uint8Array(received)
    let offset = 0
    for (const chunk of chunks) {
      romData.set(chunk, offset)
      offset += chunk.length
    }

    loadProgress.value = 95

    const core = PLATFORM_CORE_MAP[platform]
    const system = PLATFORM_SYSTEM_MAP[platform]

    ;(window as any).EJS_player = '#emulator-container'
    ;(window as any).EJS_core = core
    ;(window as any).EJS_gameUrl = URL.createObjectURL(new Blob([romData]))
    ;(window as any).EJS_system = system
    ;(window as any).EJS_startOnLoaded = true

    if (platform === 'gb' || platform === 'gba') {
      const res = PLATFORM_NATIVE_RESOLUTION[platform]
      ;(window as any).EJS_fullscreenOnLoad = false
      ;(window as any).EJS_language = 'zh-CN'
    }

    ;(window as any).EJS_onGameStart = () => {
      emulatorReady.value = true
      loading.value = false
      loadProgress.value = 100
      startAutoSave()
      applyPerformanceSettings(platform)
    }

    const existingLoader = document.querySelector('script[src*="emulatorjs"]')
    if (existingLoader) existingLoader.remove()

    const script = document.createElement('script')
    script.src = 'https://www.emulatorjs.com/loader.js'
    script.async = true
    document.head.appendChild(script)

  } catch (error) {
    console.error('Init emulator error:', error)
    loading.value = false
    alert('模拟器初始化失败')
  }
}

function applyPerformanceSettings(platform: Platform) {
  try {
    const emulator = (window as any).EJS_emulator
    if (!emulator) return

    if (platform === 'gba') {
      const core = emulator.core
      if (core) {
        core.setVariable('mgba_frameskip', '0')
        core.setVariable('mgba_color_correction', '1')
        core.setVariable('mgba_interframe_blending', '0')
      }
    }

    if (platform === 'gb') {
      const core = emulator.core
      if (core) {
        core.setVariable('gambatte_gb_colorization', 'auto')
        core.setVariable('gambatte_gb_hwmode', 'auto')
        core.setVariable('gambatte_mix_frames', 'accurate')
      }
    }
  } catch (error) {
    console.warn('Failed to apply performance settings:', error)
  }
}

function pressButton(button: string) {
  try {
    const emulator = (window as any).EJS_emulator
    if (!emulator?.core) return

    const buttonMap: Record<string, number> = {
      up: 0, down: 1, left: 2, right: 3,
      a: 4, b: 5, start: 6, select: 7,
      l: 8, r: 9,
    }

    const player = 1
    const btnIndex = buttonMap[button.toLowerCase()]
    if (btnIndex !== undefined) {
      emulator.core.pressButton(player, btnIndex)
    }
  } catch {}
}

function releaseButton(button: string) {
  try {
    const emulator = (window as any).EJS_emulator
    if (!emulator?.core) return

    const buttonMap: Record<string, number> = {
      up: 0, down: 1, left: 2, right: 3,
      a: 4, b: 5, start: 6, select: 7,
      l: 8, r: 9,
    }

    const player = 1
    const btnIndex = buttonMap[button.toLowerCase()]
    if (btnIndex !== undefined) {
      emulator.core.releaseButton(player, btnIndex)
    }
  } catch {}
}

async function loadSaves() {
  if (!game.value) return
  try {
    const response = await savesApi.getGameSaves(game.value.id, game.value.platform)
    if (response.success && response.data) {
      const saveMap: Record<number, CloudSave> = {}
      for (const save of response.data) {
        saveMap[save.slot_id] = save
      }
      saves.value = saveMap
    }
  } catch {}
}

function handleSaveState() {
  showSaveModal.value = true
}

function handleLoadState() {
  showSaveModal.value = true
}

async function saveToSlot(slotId: number) {
  if (!game.value) return

  try {
    const stateData = (window as any).EJS_emulator?.saveState?.()
    if (!stateData) {
      alert('无法获取存档数据')
      return
    }

    const saveDataStr = typeof stateData === 'string' ? stateData : btoa(String.fromCharCode(...new Uint8Array(stateData)))

    await savesApi.createSave({
      game_id: game.value.id,
      platform: game.value.platform,
      slot_id: slotId,
      save_data: saveDataStr,
      play_time: 0,
      is_auto_save: false,
    })

    await loadSaves()
    alert(`存档位 ${slotId} 保存成功`)
  } catch (error) {
    console.error('Save error:', error)
    alert('存档失败')
  }
}

async function loadFromSlot(slotId: number) {
  if (!game.value) return

  try {
    const response = await savesApi.getSaveData(game.value.id, game.value.platform, slotId)
    if (response.success && response.data) {
      const saveData = response.data.save_data
      ;(window as any).EJS_emulator?.loadState?.(saveData)
      showSaveModal.value = false
    }
  } catch (error) {
    console.error('Load save error:', error)
    alert('读档失败')
  }
}

async function handleAutoSave() {
  if (!game.value || !emulatorReady.value) return

  try {
    const stateData = (window as any).EJS_emulator?.saveState?.()
    if (!stateData) return

    const saveDataStr = typeof stateData === 'string' ? stateData : btoa(String.fromCharCode(...new Uint8Array(stateData)))

    await savesApi.createSave({
      game_id: game.value.id,
      platform: game.value.platform,
      slot_id: 0,
      save_data: saveDataStr,
      play_time: 0,
      is_auto_save: true,
    })
  } catch (error) {
    console.error('Auto save error:', error)
  }
}

function startAutoSave() {
  if (autoSaveTimer) clearInterval(autoSaveTimer)
  autoSaveTimer = setInterval(handleAutoSave, AUTO_SAVE_INTERVAL_MS)
}

async function handleScreenshot() {
  if (!game.value) return

  try {
    const canvas = document.querySelector('#emulator-container canvas') as HTMLCanvasElement
    if (!canvas) {
      alert('无法获取画面')
      return
    }

    canvas.toBlob(async (blob) => {
      if (!blob) return

      const formData = new FormData()
      formData.append('file', blob, 'screenshot.png')
      formData.append('platform', game.value!.platform)
      formData.append('game_id', game.value!.id)
      formData.append('width', canvas.width.toString())
      formData.append('height', canvas.height.toString())

      const { mediaApi } = await import('@/api/media')
      await mediaApi.uploadScreenshot(formData)
      alert('截图已保存到云端')
    }, 'image/png')
  } catch (error) {
    console.error('Screenshot error:', error)
    alert('截图失败')
  }
}

function toggleFullscreen() {
  const container = document.getElementById('emulator-container')
  if (container) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      container.requestFullscreen()
    }
  }
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  loadGame()
})

onUnmounted(() => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
  handleAutoSave()
})
</script>
