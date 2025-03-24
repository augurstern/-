<template>
  <div v-if="loading" class="dict-tag-loading">
    <el-skeleton style="width: 60px" animated />
  </div>
  <el-tooltip 
    v-else-if="showTooltip" 
    :content="tooltipContent" 
    placement="top"
    :disabled="!hasTooltip"
  >
    <el-tag
      v-bind="$attrs"
      :type="resolveType"
      :effect="effect"
      :size="size"
      :class="{'dict-tag-clickable': clickable}"
      @click="handleClick"
    >
      {{ displayLabel }}
    </el-tag>
  </el-tooltip>
  <el-tag
    v-else
    v-bind="$attrs"
    :type="resolveType"
    :effect="effect"
    :size="size"
    :class="{'dict-tag-clickable': clickable}"
    @click="handleClick"
  >
    {{ displayLabel }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDictionary } from '@/hooks/useDictionary'

const props = defineProps({
  // 字典类型编码
  dictCode: {
    type: String,
    required: true
  },
  // 字典值
  value: {
    type: [String, Number],
    required: true
  },
  // 默认显示内容，当找不到对应字典项时显示
  defaultLabel: {
    type: String,
    default: '-'
  },
  // 是否只获取启用状态的字典项
  onlyActive: {
    type: Boolean,
    default: true
  },
  // 标签尺寸
  size: {
    type: String,
    default: 'default'
  },
  // 标签样式效果
  effect: {
    type: String,
    default: 'light'
  },
  // 是否显示tooltip
  showTooltip: {
    type: Boolean,
    default: true
  },
  // tooltip内容，默认与标签文本相同
  tooltipContent: {
    type: String,
    default: ''
  },
  // 是否可点击
  clickable: {
    type: Boolean,
    default: false
  },
  // 标签类型（优先于字典项定义的样式）
  type: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['click'])

// 获取字典数据
const { loading, getDictLabel, getDictItem } = useDictionary(props.dictCode, props.onlyActive)

// 显示标签
const displayLabel = computed(() => {
  return getDictLabel(String(props.value), props.defaultLabel)
})

// 获取标签类型
const resolveType = computed(() => {
  // 如果提供了type，优先使用
  if (props.type) {
    return props.type
  }
  
  // 否则使用字典项的cssClass
  const dictItem = getDictItem(String(props.value))
  return dictItem?.cssClass || ''
})

// 是否有tooltip内容
const hasTooltip = computed(() => {
  return Boolean(props.tooltipContent || displayLabel.value)
})

// 处理点击事件
const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    const dictItem = getDictItem(String(props.value))
    emit('click', {
      value: props.value,
      label: displayLabel.value,
      dictItem,
      event
    })
  }
}
</script>

<style scoped>
.dict-tag-loading {
  display: inline-block;
  vertical-align: middle;
}

.dict-tag-clickable {
  cursor: pointer;
}
</style> 