<script setup lang="ts">
import { ref } from 'vue'
import { ElCard, ElRow, ElCol } from 'element-plus'

const emit = defineEmits(['template-selected'])

const templates = ref<Array<any>>([])

// 获取模板数据
const fetchTemplates = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/templates')
    templates.value = await response.json()
  } catch (err) {
    console.error('模板加载失败:', err)
  }
}

fetchTemplates()

const handleSelect = (template: any) => {
  emit('template-selected', template)
}
</script>

<template>
  <ElRow :gutter="20">
    <ElCol 
      v-for="(template, index) in templates"
      :key="index"
      :xs="24"
      :sm="12"
      :md="8"
      :lg="6"
    >
      <ElCard 
        class="template-card"
        shadow="hover"
        @click="handleSelect(template)"
      >
        <h3>{{ template.template_name }}</h3>
        <p class="category">{{ template.category }}</p>
      </ElCard>
    </ElCol>
  </ElRow>
</template>

<style scoped>
.template-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s;
}

.template-card:hover {
  transform: translateY(-5px);
}

.category {
  color: #666;
  font-size: 0.9em;
}
</style>