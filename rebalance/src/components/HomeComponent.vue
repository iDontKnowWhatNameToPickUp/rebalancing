<template>
  <div class="container">
    <!-- Выводим график для каждого портфеля -->
    <div v-if="portfoliosChartData.length == 0">
      Нет данных для отображения гистограммы!
    </div>
    <div v-for="(portfolioData, index) in portfoliosChartData" :key="index" class="mb-4">
      <h3>Портфель #{{ index + 1 }}</h3>
      <canvas :ref="'priceChangeChart-' + index"></canvas>
    </div>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
  data() {
    return {
      portfoliosChartData: null, // Массив данных для каждого портфеля
      charts: [], // Массив для хранения экземпляров графиков
    };
  },
  computed: {
    chartData() {
      return this.$store.state.chartData;
    }
  },
  watch: {
    chartData: {
      immediate: true,
      handler(newData) {
        this.portfoliosChartData = this.prepareChartData(newData);
        this.renderAllCharts();
      }
    }
  },
  methods: {
    prepareChartData(data) {
      // Подготавливаем данные для каждого портфеля
      return Object.entries(data).map(([, portfolio]) => {
        const labels = [];
        const chartData = [];
        Object.entries(portfolio.tickers).forEach(([ticker, tickerData]) => {
          const openPrice = tickerData[0].open.num / Math.pow(10, tickerData[0].open.scale);
          const closePrice = tickerData[tickerData.length - 1].close.num / Math.pow(10, tickerData[tickerData.length - 1].close.scale);
          const priceChangePercent = ((closePrice - openPrice) / openPrice) * 100;
          labels.push(ticker);
          chartData.push(priceChangePercent.toFixed(2)); // Округляем до двух знаков после запятой
        });
        console.log(labels, chartData)
        return { labels, chartData };
      });
    },
    renderAllCharts() {
      // Удаляем все предыдущие графики
      this.charts.forEach(chart => chart.destroy());
      this.charts = [];

      // Рендерим новые графики
      this.$nextTick(() => {
        
        this.portfoliosChartData.forEach((portfolio, index) => {
          console.log(this.$refs);
          const refName = 'priceChangeChart-' + index;
          const canvasRef = this.$refs[refName][0];
          console.log(`Ref for ${refName}:`, canvasRef);
          if (canvasRef && typeof canvasRef.getContext === 'function') {
            const ctx = canvasRef.getContext('2d');
            console.log('port lables '+portfolio.labels)
            const chart = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: portfolio.labels,
                datasets: [{
                  label: 'Изменение цены (%)',
                  data: portfolio.chartData,
                  backgroundColor: portfolio.chartData.map(value => value >= 0 ? 'green' : 'red'),
                }]
              },
              options: {
                indexAxis: 'y',
                scales: {
                  x: {
                    beginAtZero: true
                  }
                }
              }
            });
            this.charts.push(chart);
          } else {
            console.error(`Canvas ref '${refName}' not found.`);
          }
        });
      })
    }
  },
  beforeUnmount() {
    // Уничтожаем все графики при уничтожении компонента
    this.charts.forEach(chart => chart.destroy());
  }
}
</script>
