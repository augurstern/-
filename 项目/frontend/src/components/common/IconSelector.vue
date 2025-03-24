<template>
  <div class="icon-selector">
    <el-popover
      v-model:visible="popoverVisible"
      placement="bottom"
      :width="400"
      trigger="click"
    >
      <template #reference>
        <div class="selector-trigger">
          <div class="selected-icon">
            <el-icon :size="24">
              <component :is="getIconComponent(modelValue)" />
            </el-icon>
          </div>
          <div class="selector-input">
            <el-input
              v-model="searchKeyword"
              placeholder="请选择或搜索图标"
              :suffix-icon="ArrowDown"
              readonly
              @click.stop
            />
          </div>
        </div>
      </template>
      
      <div class="icon-popover">
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索图标"
            clearable
            :prefix-icon="Search"
          />
        </div>
        
        <div class="icon-list">
          <div
            v-for="icon in filteredIcons"
            :key="icon.name"
            class="icon-item"
            :class="{ 'is-active': modelValue === icon.name }"
            @click="selectIcon(icon.name)"
          >
            <el-icon :size="20">
              <component :is="icon.component" />
            </el-icon>
            <span class="icon-name">{{ icon.name }}</span>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowDown, Search } from '@element-plus/icons-vue'
import * as ElementPlusIcons from '@element-plus/icons-vue'

// 接收的属性
const props = defineProps<{
  modelValue: string;
}>()

// 定义事件
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>()

// 状态
const popoverVisible = ref(false)
const searchKeyword = ref('')

// 获取所有图标
const allIcons = computed(() => {
  return Object.keys(ElementPlusIcons)
    .filter(key => typeof (ElementPlusIcons as any)[key] === 'object')
    .map(key => ({
      name: key,
      component: (ElementPlusIcons as any)[key]
    }))
})

// 过滤图标
const filteredIcons = computed(() => {
  if (!searchKeyword.value) {
    return allIcons.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return allIcons.value.filter(icon => 
    icon.name.toLowerCase().includes(keyword)
  )
})

// 获取图标组件
const getIconComponent = (iconName: string) => {
  if (!iconName) return ElementPlusIcons.Collection
  
  const icon = (ElementPlusIcons as any)[iconName]
  return icon || ElementPlusIcons.Collection
}

// 选择图标
const selectIcon = (iconName: string) => {
  emit('update:modelValue', iconName)
  popoverVisible.value = false
  searchKeyword.value = ''
}
</script>

<style scoped>
.icon-selector {
  width: 100%;
}

.selector-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  width: 100%;
}

.selected-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 32px;
  border: 1px solid var(--el-border-color);
  border-right: none;
  border-radius: 4px 0 0 4px;
  background-color: var(--el-fill-color-light);
}

.selector-input {
  flex: 1;
}

.selector-input :deep(.el-input__inner) {
  border-radius: 0 4px 4px 0;
}

.icon-popover {
  padding: 10px;
}

.search-bar {
  margin-bottom: 15px;
}

.icon-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.icon-item:hover {
  background-color: var(--el-fill-color-light);
}

.icon-item.is-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.icon-name {
  margin-top: 5px;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  text-align: center;
}
</style> 