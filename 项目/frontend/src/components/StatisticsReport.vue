<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import pdfMake from 'pdfmake/build/pdfmake'

const props = defineProps({
  distributionData: {
    type: Array as () => number[],
    default: () => [0, 0, 0]
  },
  labels: {
    type: Array as () => string[],
    default: () => ['采购类', '服务类', '工程类']
  },
  totalContracts: {
    type: Number,
    default: 0
  },
  overdueContracts: {
    type: Number,
    default: 0
  },
  overdueRate: {
    type: Number,
    default: 0
  }
})

Chart.register(...registerables)
let chartInstance: Chart | null = null

const initCharts = () => {
  const ctx = document.getElementById('statsChart') as HTMLCanvasElement
  
  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: props.labels,
      datasets: [{
        data: props.distributionData,
        backgroundColor: ['#36A2EB', '#4BC0C0', '#FFCE56']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  })
}

const exportPDF = () => {
  const docDefinition: any = { // 添加类型断言解决pdfMake类型校验问题
    content: [
      { text: '合同统计报告', style: 'header' },
      { text: new Date().toLocaleDateString(), style: 'subheader' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*'],
          body: [
            ['统计项', '数值'],
            ['合同总数', props.totalContracts],
            ['逾期合同', props.overdueContracts],
            ['逾期率', ((props.overdueRate) * 100).toFixed(1) + '%']
          ]
        }
      }
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 12, color: '#666', margin: [0, 0, 0, 20] }
    }
  }
  
  pdfMake.createPdf(docDefinition).download('contract-report.pdf')
}

onMounted(initCharts)

// 当数据变化时重新渲染图表
watch([() => props.distributionData, () => props.labels], () => {
  initCharts()
}, { deep: true })

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>

<template>
  <div class="chart-container">
    <canvas id="statsChart"></canvas>
    <el-button 
      type="primary" 
      size="small"
      @click="exportPDF"
      class="export-btn"
    >
      导出报告
    </el-button>
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 300px;
  margin: 0 auto;
}

.export-btn {
  position: absolute;
  right: 10px;
  top: 10px;
  z-index: 100;
}
</style>