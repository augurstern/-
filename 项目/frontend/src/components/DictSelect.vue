<template>
  <el-select
    v-model="currentValue"
    v-bind="$attrs"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :multiple="multiple"
    :collapse-tags="collapseTags"
    :loading="loading"
    @change="handleChange"
  >
    <el-option
      v-for="option in options"
      :key="option.value"
      :label="option.label"
      :value="option.value"
      :disabled="option.disabled"
    >
      <template v-if="showTag && option.type">
        <el-tag 
          :type="option.type" 
          size="small" 
          style="margin-right: 8px;"
          disable-transitions
        >
          {{ option.label }}
        </el-tag>
      </template>
      <template v-else>
        {{ option.label }}
      </template>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useDictionary } from '@/hooks/useDictionary'

const props = defineProps({
  // 字典类型编码
  dictCode: {
    type: String,
    required: true
  },
  // 选择器绑定的值
  modelValue: {
    type: [String, Number, Array],
    default: ''
  },
  // 是否只获取启用状态的字典项
  onlyActive: {
    type: Boolean,
    default: true
  },
  // 占位符
  placeholder: {
    type: String,
    default: '请选择'
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否可以清空选项
  clearable: {
    type: Boolean,
    default: true
  },
  // 是否多选
  multiple: {
    type: Boolean,
    default: false
  },
  // 多选时是否将选中值按文字的形式展示
  collapseTags: {
    type: Boolean,
    default: false
  },
  // 是否以标签形式显示选项
  showTag: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// 当前值
const currentValue = ref(props.modelValue)

// 监听输入值变化
watch(() => props.modelValue, (val) => {
  currentValue.value = val
})

// 监听当前值变化
watch(() => currentValue.value, (val) => {
  emit('update:modelValue', val)
})

// 获取字典数据
const { loading, dictList } = useDictionary(props.dictCode, props.onlyActive)

// 字典选项
const options = computed(() => {
  return dictList.value.map(item => ({
    label: item.label,
    value: item.value,
    disabled: item.status === 'disabled',
    type: item.cssClass
  }))
})

// 处理值变化
const handleChange = (value: any) => {
  emit('change', {
    value,
    options: options.value,
    dictItems: dictList.value.filter(item => {
      if (Array.isArray(value)) {
        return value.includes(item.value)
      }
      return item.value === value
    })
  })
}
</script>

<style scoped>
/* 可以添加额外的样式 */
</style> 