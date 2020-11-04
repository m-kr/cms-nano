const { Page, pageValidationSchema } = require('../models/Page');
const { PageType } = require('../models/PageType');
const ListFeatures = require('../utils/ListFeatures');

const getPages = async (req, res) => {
  const { pageId } = req.params;

  try {
    if (pageId) {
      const singlePage = await Page.findById(pageId)
        .select('name url pageDetails attributes')
        .populate({
          path: 'pageDetails',
          model: 'PageDetails',
          select: 'name country title description',
        })
        .populate({
          path: 'type',
          select: 'name',
        })
        .exec();

      if (!singlePage) {
        res.status(401).send('Page not exist');

        return;
      }

      const { type } = singlePage.toObject();
      const pageType = await PageType.findById(type).populate('attributes.type').exec();
      const pageTypeData = pageType.toObject();
      const pageTypeAttributesSchema = pageTypeData.attributes.map(attribute => ({
        ...attribute,
        type: attribute.type.type,
      }));

      res.send({
        pageType: pageTypeData.name,
        attributesSchema: pageTypeAttributesSchema,
        data: singlePage,
      });
    } else {
      const sortableFields = ['name', 'type', 'url', 'createdAt', 'updatedAt'];
      const listFeatures = new ListFeatures(Page, req.query, 'name');
      const { currentPage, itemsPerPage, limit, skip, totalPages } = await listFeatures.getPaginationParameters();
      const sortBy = listFeatures.getSort(sortableFields);
      const queryFilter = listFeatures.getQueryFilter();

      const pages = await Page.find(queryFilter)
        .populate({
          path: 'pageDetails',
          model: 'PageDetails',
          populate: {
            path: 'country',
            select: 'name code',
          },
        })
        .populate({
          path: 'type',
          select: 'name',
        })
        .select('-attributes')
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .exec();

      res.send({
        currentPage,
        totalPages,
        itemsPerPage,
        data: pages,
      });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const createPage = async (req, res) => {
  const { error } = pageValidationSchema.validate(req.body);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  try {
    const page = new Page(req.body);
    await page.save();
    res.send(page._id);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const updatePage = async (req, res) => {
  const { error } = pageValidationSchema.validate(req.body);
  const { pageId } = req.params;

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  try {
    const page = await Page.findOneAndUpdate({ _id: pageId }, req.body);
    res.send(page);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const deletePage = async (req, res) => {
  const { pageId } = req.params;

  try {
    await Page.findByIdAndRemove(pageId);
    res.send(pageId);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  getPages,
  createPage,
  updatePage,
  deletePage,
};
