const { Schema, model } = require('mongoose');
const Joi = require('@hapi/joi');

const siteInfo = new Schema({
  url: { type: String, require: true, max: 250 },
});

const siteInfoValidationSchema = Joi.object({
  url: Joi.string().required().max(250),
});

const SiteInfo = model('SiteInfo', siteInfo);

module.exports = {
  SiteInfo,
  siteInfo,
  siteInfoValidationSchema,
};
