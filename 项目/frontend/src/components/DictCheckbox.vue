<template>
  <div class="dict-checkbox-container" :class="{ 'is-button': isButton }">
    <el-checkbox-group
      v-model="currentValue"
      v-bind="$attrs"
      :disabled="disabled"
      :size="size"
      :min="min"
      :max="max"
      @change="handleChange"
    >
      <template v-if="isButton">
        <el-checkbox-button
          v-for="item in dictList"
          :key="item.value"
          :label="item.value"
          :disabled="item.status === 'disabled'"
        >
          {{ item.label }}
        </el-checkbox-button>
      </template>
      <template v-else>
        <el-checkbox
          v-for="item in dictList"
          :key="item.value"
          :label="item.value"
          :disabled="item.status === 'disabled'"
          :border="border"
        >
          {{ item.label }}
        </el-checkbox>
      </template>
    </el-checkbox-group>
    
    <div v-if="loading" class="dict-checkbox-loading">
      <el-skeleton :count="3" style="width: 100px" animated />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useDictionary } from '@/hooks/useDictionary'
import type { DictItem } from '@/api/dictionary'

const props = defineProps({
  // 字典类型编码
  dictCode: {
    type: String,
    required: true
  },
  // 选择器绑定的值
  modelValue: {
    type: Array,
    default: () => []
  },
  // 是否只获取启用状态的字典项
  onlyActive: {
    type: Boolean,
    default: true
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 组件尺寸
  size: {
    type: String,
    default: 'default'
  },
  // 是否显示边框
  border: {
    type: Boolean,
    default: false
  },
  // 是否使用按钮样式
  isButton: {
    type: Boolean,
    default: false
  },
  // 可被勾选的最小数量
  min: {
    type: Number,
    default: 0
  },
  // 可被勾选的最大数量
  max: {
    type: Number,
    default: Number.MAX_SAFE_INTEGER
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// 当前值
const currentValue = ref<string[]>(props.modelValue as string[])

// 监听输入值变化
watch(() => props.modelValue, (val) => {
  currentValue.value = val as string[]
})

// 监听当前值变化
watch(() => currentValue.value, (val) => {
  emit('update:modelValue', val)
})

// 获取字典数据
const { loading, dictList } = useDictionary(props.dictCode, props.onlyActive)

// 处理变更
const handleChange = (value: string[]) => {
  const selectedItems = dictList.value.filter(item => value.includes(item.value))
  emit('change', {
    value,
    dictItems: selectedItems
  })
}
</script>

<style scoped>
.dict-checkbox-container {
  position: relative;
}

.dict-checkbox-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style> 