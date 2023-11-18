<template>
  <div class="container">
    <!-- Выводим график для каждого портфеля -->
    <div v-if="portfoliosChartData.length == 0">
      Нет данных для отображения гистограммы!
    </div>
    <div v-for="(portfolioData, index) in portfoliosChartData" :key="index" class="mb-4">
      <h3>Портфель #{{ index + 1 }}</h3>
      <canvas v-if="portfolioData" :ref="'hvChart-' + index"></canvas>
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
      console.log('Данные есть вообще '+this.$store.state.chartData)
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
      if (!data || Object.keys(data).length === 0) {
        console.error('No data available to prepare chart data.');
        return [];
      }

      return Object.entries(data).map(([portfolioIndex, portfolio]) => {
        if (!portfolio.hv_period || isNaN(portfolio.hv_period)) {
          console.error(`Invalid hv_period for portfolio index ${portfolioIndex}.`);
          return null;
        }

        const hv_period = parseInt(portfolio.hv_period, 10);
        let datasets = [];
        let unifiedLabels = []; // Создаем массив для унифицированных дат

        Object.entries(portfolio.tickers).forEach(([ticker, tickerData]) => {
          if (!tickerData || tickerData.length < hv_period) {
            console.error(`Not enough data for ticker ${ticker} to calculate volatility.`);
            return;
          }

          const labels = []; // Даты для оси X конкретного тикера
          const chartData = []; // Данные для конкретного тикера

          // Ваши расчеты priceChanges и volatilities ...
          const priceChanges = tickerData.map((day, index, array) => {
            if (index === 0) return null; // Первый день пропускаем
            const previousClose = array[index - 1].close.num / Math.pow(10, array[index - 1].close.scale);
            const currentClose = day.close.num / Math.pow(10, day.close.scale);
            return Math.log(currentClose / previousClose);
          }).filter(n => n !== null); // Исключаем первый день

          const volatilities = priceChanges.map((change, index, array) => {
            if (index < hv_period - 1) return null; // Недостаточно данных для расчета
            const relevantChanges = array.slice(index - hv_period + 1, index + 1);
            const mean = relevantChanges.reduce((a, b) => a + b, 0) / relevantChanges.length;
            const variance = relevantChanges.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / relevantChanges.length;
            return Math.sqrt(variance) * Math.sqrt(portfolio.trading_days)*100; // Переводим в годовое выражение ЗДЕСЬ НУЖНО ВСТАВИТЬ ВМЕСТО 252
          }).filter(n => n !== null);

          for (let i = hv_period - 1; i < priceChanges.length; i++) {
            if (i < tickerData.length) {
              labels.push(tickerData[i].date);
              chartData.push(volatilities[i - hv_period + 1]);
            }
          }

          // Объединяем даты всех тикеров в один массив
          unifiedLabels = unifiedLabels.concat(labels.filter(label => !unifiedLabels.includes(label)));

          datasets.push({
            label: ticker,
            data: chartData,
            borderColor: this.getRandomColor(),
            fill: false,
          });
        });

        // Убедитесь, что у вас есть данные для графика
        if (datasets.length === 0) {
          console.error(`No datasets were created for portfolio index ${portfolioIndex}.`);
          return null;
        }

        console.log(`Datasets for portfolio index ${portfolioIndex}:`, datasets);

        // Возвращаем объект с унифицированными датами и датасетами
        return {
          portfolioIndex,
          labels: unifiedLabels,
          datasets,
        };
      }).filter(n => n !== null); // Исключаем портфолио без данных
    },

    // Вспомогательная функция для генерации случайного цвета
    getRandomColor() {
      var letters = '0123456789ABCDEF';
      var color = '#';
      for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    },


    renderAllCharts() {
      // Удаляем все предыдущие графики
      this.charts.forEach(chart => chart.destroy());
      this.charts = [];

      this.$nextTick(() => {
        this.portfoliosChartData.forEach((portfolio, index) => {
          const refName = 'hvChart-' + index;
          const canvasRef = this.$refs[refName][0];
          if (canvasRef && typeof canvasRef.getContext === 'function') {
            const ctx = canvasRef.getContext('2d');
            const chart = new Chart(ctx, {
              type: 'line',
              data: {
                labels: portfolio.labels,
                datasets: portfolio.datasets // Используйте datasets из prepareChartData
              },
              options: {
                responsive: true,
                scales: {
                  x: {
                    beginAtZero: true
                  },
                  y: {
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
      });

    }
  },
  beforeUnmount() {
    // Уничтожаем все графики при уничтожении компонента
    this.charts.forEach(chart => chart.destroy());
  }
}
</script>