import { createStore } from 'vuex';

export default createStore({
  state() {
    return {
      chartData: [],
    };
  },
  mutations: {
    setChartData(state, data) {
      state.chartData = data;
    },
  },
  actions: {
    fetchChartData({ commit }, data) {
      commit('setChartData', data);
    },
  },
});
