const asyncHandler = require("../util/asyncHandler");
const appError = require("../util/appError");

// create-one
exports.createOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });
// get-all
exports.getAll = (Model) =>
  asyncHandler(async (req, res, next) => {
    const doc = await Model.find();
    res.status(200).json({
      status: "success",
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
// get-one
exports.getOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) {
      return next(new appError("No document found with that ID", 404));
    }
    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });
// update-one
exports.updateOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new appError("No document found with that ID", 404));
    }
    res.status(200).json({
      status: "success",
      data: {
        itinerary: [
          {
            day: {
              type: String,
              required: [true, "Day is required"],
            },
            description: {
              type: String,
              required: [true, "Description is required"],
            },
          },
        ],
        data: doc,
      },
    });
  });
// delete-one
exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new appError("No document found with that ID", 404));
    }
    res.status(204).json({
      status: "success",
      data: null,
    });
  });
// delete-all
exports.deleteAll = (Model) =>
  asyncHandler(async (req, res, next) => {
    const doc = await Model.deleteMany();
    res.status(204).json({
      status: "success",
      data: null,
    });
  });