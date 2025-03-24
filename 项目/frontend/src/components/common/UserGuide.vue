<template>
  <div class="user-guide-container">
    <el-dialog
      v-model="visible"
      :title="currentStep.title"
      width="400px"
      :append-to-body="true"
      :close-on-click-modal="false"
      :show-close="false"
      custom-class="guide-dialog"
    >
      <div class="guide-content">
        <div class="guide-image" v-if="currentStep.image">
          <img :src="currentStep.image" :alt="currentStep.title" />
        </div>
        <div class="guide-description">{{ currentStep.description }}</div>
      </div>
      <template #footer>
        <div class="guide-footer">
          <div class="step-indicators">
            <div 
              v-for="(_, index) in steps" 
              :key="index" 
              class="step-dot"
              :class="{ active: index === currentStepIndex }"
              @click="goToStep(index)"
            ></div>
          </div>
          <div class="guide-actions">
            <el-button 
              v-if="currentStepIndex > 0" 
              @click="prevStep"
            >
              上一步
            </el-button>
            <el-button 
              v-if="currentStepIndex < steps.length - 1" 
              type="primary" 
              @click="nextStep"
            >
              下一步
            </el-button>
            <el-button 
              v-else 
              type="success" 
              @click="completeGuide"
            >
              完成
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
    
    <div v-if="highlightElement && visible" class="guide-highlight-overlay" ref="highlightOverlay"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

export interface GuideStep {
  title: string
  description: string
  image?: string
  elementSelector?: string
  position?: 'top' | 'right' | 'bottom' | 'left'
}

const props = defineProps<{
  steps: GuideStep[]
  modelValue: boolean
  guideKey: string
  autoStart?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'complete'): void
}>()

// 当前步骤索引
const currentStepIndex = ref(0)

// 计算当前步骤
const currentStep = computed(() => props.steps[currentStepIndex.value] || {
  title: '',
  description: ''
})

// 对话框可见性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 高亮元素
const highlightElement = ref<HTMLElement | null>(null)
const highlightOverlay = ref<HTMLElement | null>(null)

// 定位高亮元素
const positionHighlight = () => {
  if (!currentStep.value.elementSelector) {
    highlightElement.value = null
    return
  }
  
  // 获取目标元素
  highlightElement.value = document.querySelector(currentStep.value.elementSelector)
  
  if (highlightElement.value && highlightOverlay.value) {
    // 获取元素位置
    const rect = highlightElement.value.getBoundingClientRect()
    
    // 设置高亮覆盖层位置
    highlightOverlay.value.style.top = `${rect.top - 5}px`
    highlightOverlay.value.style.left = `${rect.left - 5}px`
    highlightOverlay.value.style.width = `${rect.width + 10}px`
    highlightOverlay.value.style.height = `${rect.height + 10}px`
  }
}

// 下一步
const nextStep = () => {
  if (currentStepIndex.value < props.steps.length - 1) {
    currentStepIndex.value++
  }
}

// 上一步
const prevStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
  }
}

// 跳转到指定步骤
const goToStep = (index: number) => {
  if (index >= 0 && index < props.steps.length) {
    currentStepIndex.value = index
  }
}

// 完成引导
const completeGuide = () => {
  visible.value = false
  
  // 保存完成状态到本地存储
  localStorage.setItem(`guide_completed_${props.guideKey}`, 'true')
  
  // 触发完成事件
  emit('complete')
}

// 检查是否已完成
const checkIfCompleted = (): boolean => {
  return localStorage.getItem(`guide_completed_${props.guideKey}`) === 'true'
}

// 监听步骤变化，更新高亮位置
watch(currentStepIndex, () => {
  nextTick(() => {
    positionHighlight()
  })
})

// 监听对话框可见性
watch(visible, (newValue) => {
  if (newValue) {
    nextTick(() => {
      positionHighlight()
    })
  }
})

// 窗口大小变化时重新定位高亮
const handleResize = () => {
  if (visible.value) {
    positionHighlight()
  }
}

// 生命周期钩子
onMounted(() => {
  // 添加窗口大小变化监听器
  window.addEventListener('resize', handleResize)
  
  // 如果设置了自动开始并且没有完成过，则自动显示
  if (props.autoStart && !checkIfCompleted()) {
    visible.value = true
  }
})

onBeforeUnmount(() => {
  // 移除窗口大小变化监听器
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.guide-dialog {
  border-radius: 8px;
  overflow: hidden;
}

.guide-content {
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.guide-image {
  text-align: center;
}

.guide-image img {
  max-width: 100%;
  border-radius: 6px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.guide-description {
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.guide-footer {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.step-indicators {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--el-border-color);
  cursor: pointer;
  transition: all 0.3s;
}

.step-dot.active {
  background-color: var(--el-color-primary);
  transform: scale(1.2);
}

.guide-actions {
  display: flex;
  justify-content: space-between;
}

.guide-highlight-overlay {
  position: fixed;
  z-index: 2000;
  border: 2px solid var(--el-color-primary);
  border-radius: 4px;
  box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0.6);
  pointer-events: none;
  transition: all 0.3s ease;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0.6);
  }
  50% {
    box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0.5);
  }
  100% {
    box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0.6);
  }
}
</style> 