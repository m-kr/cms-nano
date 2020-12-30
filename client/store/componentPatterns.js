import { v4 as uuidv4 } from 'uuid';
import {
  ComponentPatternModelSchema,
  FieldModelSchema,
  FieldOptionModelSchema,
  FieldsetModelSchema,
} from '../../server/models/data-schemas';
import { reorderItems, showRequestResult } from '@/utils';

const FIELD_ATTRIBUTES = ['min', 'max', 'required', 'default'];

export const state = () => ({
  newComponentId: null,
  componentPatterns: [],
  componentPatternMainData: {},
  componentPatternFields: null,
  componentPatternFieldset: null,
  currentPage: 1,
  modelSchemas: {
    componentPattern: ComponentPatternModelSchema(),
    field: FieldModelSchema(),
    fieldOption: FieldOptionModelSchema(),
    fieldset: FieldsetModelSchema(),
  },
  fieldTypes: null,
  totalPages: 1,
  itemsPerPage: 10,
  search: null,
  sort: '-updatedAt',
});

export const getters = {
  /**
   * @param {object} state
   * @return {function(string): (null|[])}
   */
  formFieldsAttributes: state => schemaName => {
    if (!state.modelSchemas[schemaName]) {
      return null;
    }

    const attributes = {};

    for (const [fieldName, fieldAttributes] of Object.entries(
      state.modelSchemas[schemaName]
    )) {
      const filteredAttributesKeys = Object.keys(
        fieldAttributes
      ).filter(attributeKey => FIELD_ATTRIBUTES.includes(attributeKey));

      attributes[fieldName] = {};

      for (const filteredAttributeKey of filteredAttributesKeys) {
        attributes[fieldName] = {
          ...attributes[fieldName],
          [filteredAttributeKey]: fieldAttributes[filteredAttributeKey],
        };
      }
    }

    return attributes;
  },

  formMainParameters(state, getters) {
    const fieldsAttributes = getters.formFieldsAttributes('componentPattern');

    return {
      name: {
        type: 'text',
        label: 'Name (Upper CamelCase)',
        attributes: fieldsAttributes.name,
      },
      label: {
        type: 'text',
        attributes: fieldsAttributes.label,
      },
      description: {
        type: 'text',
        attributes: fieldsAttributes.description,
      },
    };
  },

  formFields(state, getters) {
    const fieldsAttributes = getters.formFieldsAttributes('field');
    const fieldOptionsAttributes = getters.formFieldsAttributes('fieldOption');

    return {
      required: {
        type: 'boolean',
        attributes: fieldsAttributes.required,
      },
      fieldTypeId: {
        label: 'Field type',
        type: 'text',
        defaultValue: 'text',
        hidden: !getters.fieldTypesOptions,
        options: getters.fieldTypesOptions,
        attributes: fieldsAttributes.fieldTypeId,
      },
      name: {
        label: 'Name (camelCase)',
        type: 'text',
        attributes: fieldsAttributes.name,
      },
      label: {
        type: 'text',
        attributes: fieldsAttributes.label,
      },
      description: {
        type: 'text',
        attributes: fieldsAttributes.description,
      },
      definedOptionsId: {
        label: 'Options from global definition',
        type: 'text',
        attributes: fieldsAttributes.definedOptionsId,
      },
      options: {
        label: 'Custom options',
        type: 'fieldsGroup',
        attributes: fieldsAttributes.options,
        fields: {
          name: {
            type: 'text',
            attributes: fieldOptionsAttributes.name,
          },
          value: {
            type: 'text',
            attributes: fieldOptionsAttributes.value,
          },
        },
      },
      defaultValue: {
        label: 'Default value',
        typeFrom: 'fieldTypeId',
        attributes: fieldsAttributes.defaultValue,
      },
    };
  },

  formFieldset(state, getters) {
    const fieldsetAttributes = getters.formFieldsAttributes('fieldset');

    return {
      required: {
        type: 'boolean',
        attributes: fieldsetAttributes.required,
      },
      name: {
        type: 'text',
        label: 'Name (camelCase)',
        attributes: fieldsetAttributes.name,
      },
      label: {
        type: 'text',
        attributes: fieldsetAttributes.label,
      },
      description: {
        type: 'text',
        attributes: fieldsetAttributes.description,
      },
    };
  },

  fieldTypesOptions(state) {
    if (!state.fieldTypes) {
      return null;
    }

    return state.fieldTypes.map(fieldType => ({
      name: fieldType.type,
      value: fieldType._id,
    }));
  },

  componentData({
    componentPatternMainData,
    componentPatternFields,
    componentPatternFieldset,
  }) {
    return {
      ...componentPatternMainData,
      fields: componentPatternFields,
      fieldset: componentPatternFieldset,
    };
  },

  randomId() {
    return uuidv4();
  },
};

export const mutations = {
  LOAD_COMPONENT_PATTERNS(
    state,
    { data, currentPage, totalPages, itemsPerPage }
  ) {
    state.componentPatterns = data;
    state.currentPage = currentPage;
    state.totalPages = totalPages;
    state.itemsPerPage = itemsPerPage;
  },

  LOAD_SINGLE_PATTERN(state, componentPattern) {
    state.activeComponentPattern = componentPattern;
  },

  LOAD_ADD_COMPONENT_VIEW_DATA(state, { fieldTypes }) {
    state.fieldTypes = fieldTypes;
  },

  ADD_COMPONENT_PATTERN(state, componentId) {
    state.newComponentId = componentId;
  },

  UPDATE_MAIN_PARAMETERS(state, { fieldName, value }) {
    state.componentPatternMainData[fieldName] = value;
  },

  UPDATE_FIELD_VALUE(state, { fieldIndex, fieldName, value }) {
    state.componentPatternFields.splice(fieldIndex, 1, {
      ...state.componentPatternFields[fieldIndex],
      [fieldName]: value,
    });
  },

  UPDATE_FIELDS(state, fields) {
    state.componentPatternFields = [...fields];
  },

  UPDATE_ALL_FIELDSET(state, fieldset) {
    state.componentPatternFieldset = [...fieldset];
  },

  UPDATE_FIELDSET(state, { fieldsetIndex, fieldName, value }) {
    state.componentPatternFieldset.splice(fieldsetIndex, 1, {
      ...state.componentPatternFieldset[fieldsetIndex],
      [fieldName]: value,
    });
  },

  UPDATE_FIELDSET_FIELD_VALUE(
    state,
    { fieldsetIndex, fieldIndex, fieldName, value }
  ) {
    state.componentPatternFieldset[fieldsetIndex].fields.splice(fieldIndex, 1, {
      ...state.componentPatternFieldset[fieldsetIndex].fields[fieldIndex],
      [fieldName]: value,
    });
  },

  REMOVE_COMPONENT_PATTERN(state, componentPatternId) {
    state.componentPatterns = state.componentPatterns.filter(
      componentPattern => componentPattern._id !== componentPatternId
    );
  },

  SEARCH_COMPONENT_PATTERN(state, search) {
    state.search = search;
  },

  SORT_BY(state, sortBy) {
    state.sort = sortBy;
  },
};

export const actions = {
  async fetchComponentPatterns({ commit, dispatch, state }, nextPage) {
    const data = await showRequestResult({
      request: this.$axios.get(`component-patterns`, {
        params: {
          page: nextPage || state.currentPage,
          limit: state.itemsPerPage,
          search: state.search,
        },
      }),
      dispatch,
    });

    if (data) {
      commit('LOAD_COMPONENT_PATTERNS', data);
    }
  },

  async fetchSingleComponentPattern({ commit, dispatch }, componentId) {
    const data = await showRequestResult({
      request: this.$axios.get(`component-patterns/${componentId}`),
      dispatch,
    });

    if (data) {
      commit('LOAD_SINGLE_PATTERN', data);
    }
  },

  async initAddComponentViewData({ commit, dispatch }) {
    const fieldTypes = await showRequestResult({
      request: this.$axios.get('field-types'),
      dispatch,
    });

    if (fieldTypes) {
      commit('LOAD_ADD_COMPONENT_VIEW_DATA', { fieldTypes });
    }
  },

  async addComponentPattern({ commit, dispatch, getters }) {
    const componentId = await showRequestResult({
      request: this.$axios.post('component-patterns', getters.componentData),
      dispatch,
      successMessage: `Added ${getters.componentData.name} component`,
    });

    if (componentId) {
      commit('ADD_COMPONENT_PATTERN', componentId);
    }
  },

  async saveComponentPattern({ store, dispatch }) {
    await showRequestResult({
      request: this.$axios.put(
        `component-patterns/${store.activeComponentPattern._id}`
      ),
      dispatch,
      successMessage: 'Saved changes',
    });
  },

  updateComponentPatternMainParameters({ commit }, mainParameters) {
    commit('UPDATE_MAIN_PARAMETERS', mainParameters);
  },

  updateComponentPatternField({ commit }, updatedFieldParameters) {
    commit('UPDATE_FIELD_VALUE', updatedFieldParameters);
  },

  updateComponentPatternFieldsetField({ commit }, updatedFieldParameters) {
    commit('UPDATE_FIELDSET_FIELD_VALUE', updatedFieldParameters);
  },

  addField({ commit, state }) {
    commit('UPDATE_FIELDS', [...(state.componentPatternFields || []), {}]);
  },

  addFieldset({ commit, state }) {
    commit('UPDATE_ALL_FIELDSET', [
      ...(state.componentPatternFieldset || []),
      {
        fields: [{}],
      },
    ]);
  },

  addFieldsetField({ commit, state }, fieldsetIndex) {
    commit('UPDATE_FIELDSET', {
      fieldsetIndex,
      fieldName: 'fields',
      value: [...state.componentPatternFieldset[fieldsetIndex].fields, {}],
    });
  },

  updateFieldsetData({ commit }, updateFieldsetData) {
    commit('UPDATE_FIELDSET', updateFieldsetData);
  },

  reorderFields({ commit, state }, dropResult) {
    const newFields = [...state.componentPatternFields];
    commit('UPDATE_FIELDS', reorderItems(newFields, dropResult));
  },

  reorderFieldsetFields({ commit, state }, { fieldsetIndex, dropResult }) {
    const newFields = [...state.componentPatternFieldset[fieldsetIndex].fields];
    commit('UPDATE_FIELDSET', {
      fieldsetIndex,
      fieldName: 'fields',
      value: reorderItems(newFields, dropResult),
    });
  },

  async removeComponentPattern(
    { store, dispatch, commit },
    componentPatternId
  ) {
    if (!confirm('Please, confirm removing component')) {
      return;
    }

    await showRequestResult({
      request: this.$axios.delete(`component-patterns/${componentPatternId}`),
      dispatch,
      successMessage: 'Component has been removed',
    });

    commit('REMOVE_COMPONENT_PATTERN', componentPatternId);
  },

  async changePage({ state, dispatch }, targetPage) {
    if (
      targetPage === state.currentPage ||
      targetPage < 1 ||
      targetPage > state.totalPages
    ) {
      return;
    }

    await dispatch('fetchComponentPatterns', targetPage);
  },

  async searchComponentPattern({ commit, dispatch }, search) {
    commit('SEARCH_COMPONENT_PATTERN', search);
    await dispatch('fetchComponentPatterns', 1);
  },

  async sortBy({ commit, dispatch }, sortBy) {
    commit('SORT_BY', sortBy);
    await dispatch('fetchComponentPatterns');
  },
};
