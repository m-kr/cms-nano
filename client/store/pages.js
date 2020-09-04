export const state = () => ({
  currentPage: 1,
  totalPages: 1,
  itemsPerPage: 10,
  pagesList: [],
  search: null,
  sort: '-createdAt',
});

export const mutations = {
  LOAD_PAGES(state, { data, currentPage, totalPages }) {
    state.pagesList = data;
    state.currentPage = currentPage;
    state.totalPages = totalPages;
  },

  REMOVE_PAGE(state, pageId) {
    state.pagesList = state.pagesList.filter(page => page._id !== pageId);
  },

  SEARCH_PAGE(state, search) {
    state.search = search;
  },

  SORT_BY(state, sortBy) {
    state.sort = sortBy;
  },
};

export const actions = {
  async loadPages({ commit, state }, { nextPage } = {}) {
    const { data } = await this.$axios.get('pages', {
      params: {
        page: nextPage || state.currentPage,
        limit: state.itemsPerPage,
        search: state.search,
        sort: state.sort,
      },
    });
    return commit('LOAD_PAGES', data);
  },

  async removePage({ commit }, pageId) {
    const { data } = await this.$axios.delete(`pages/${pageId}`);

    if (data) {
      return commit('REMOVE_PAGE', pageId);
    }
  },

  async changePage({ state, dispatch }, targetPage) {
    if (
      targetPage === state.currentPage ||
      targetPage < 1 ||
      targetPage > state.totalPages
    ) {
      return;
    }

    await dispatch('loadPages', { nextPage: targetPage });
  },

  async searchPage({ commit, dispatch }, search) {
    commit('SEARCH_PAGE', search);
    await dispatch('loadPages', { nextPage: 1 });
  },

  async sortBy({ commit, dispatch }, sortBy) {
    commit('SORT_BY', sortBy);
    await dispatch('loadPages');
  },
};
