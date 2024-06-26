const Tour = require("../model/tourModel");
const factory = require("./handlerFactory");
const asyncHandler = require("../util/asyncHandler");
const AppError = require("../util/appError");
const sendEmail = require("../util/email");
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
exports.createTour = factory.createOne(Tour);
exports.BookTour = asyncHandler(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  const user = req.user;
  const currentDate = new Date();
  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
  }
  // check if tour has already started or not
  if (tour.startDate < currentDate) {
    return next(new AppError("this  tour has already started", 400));
  }
  // Check if the user has already booked the tour
  const hasBooked = tour.selectedByUsers.some(
    (entry) => entry.user && entry.user.toString() === req.user.id
  );
  if (hasBooked) {
    return next(new AppError("You have already booked this tour", 400));
  }
  if (tour.availability <= 0) {
    return next(
      new AppError("No seats available,This tour is fully booked", 400)
    );
  }
  const userSelection = { user: req.user.id, bookedAt: new Date() };
  tour.selectedByUsers.push(userSelection);
  tour.availability -= 1;

  await tour.save();
  // send  email.
  const data = {
    user: { name: user.name, email: user.email },
    tour: {
      name: tour.name,
      startDate: tour.startDate,
      endDate: tour.endDate,
      duration: tour.duration,
      price: tour.price,
    },
    supportEmail: "support@destatouring.com",
  };
  await sendEmail({ email: user.email, template: "bookTour.ejs", data });
  res.status(200).json({
    status: "success",
    data: tour,
  });
});
// list of tours booked by user
exports.myTours = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const bookedTours = await Tour.find({
    "selectedByUsers.user": userId,
  }).select("name price startDate endDate locations "); // Select only specified fields
  if (bookedTours.length === 0) {
    return next(new AppError("You have not booked any tours yet", 404));
  }

  res.status(200).json({
    status: "success",
    results: bookedTours.length,
    data: bookedTours,
  });
});
// booking cancellation.
exports.cancelBooking = asyncHandler(async (req, res, next) => {
  try {
    const user = req.user;
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return next(new AppError("Tour not found"));
    }

    // find  booking for current user.
    const bookingIndex = tour.selectedByUsers.findIndex(
      (booking) => booking.user?.toString() === (req.user?._id.toString() || "")
    );
    // if booking not found.(findIndex returns -1 if element is not found)
    if (!bookingIndex === -1) {
      return next(new AppError("booking not found", 404));
    }
    const booking = tour.selectedByUsers[bookingIndex];
    // calculate cancellation deadline.(2 days  after booking  day)
    const cancellationDeadline = new Date(
      booking.bookedAt.getTime() + 2 * 24 * 60 * 60 * 1000
    );
    // check if cancellation deadline is passed.
    if (new Date() > cancellationDeadline) {
      return next(new AppError("cancellation deadline has passed"));
    }
    if (bookingIndex !== -1) {
      // First, update the booking's status and canceledAt before removing it
      tour.selectedByUsers[bookingIndex].status = "canceled";
      tour.selectedByUsers[bookingIndex].canceledAt = Date.now();
    }
    // remove booking  from tour.
    tour.selectedByUsers.splice(bookingIndex, 1);
    // update avaiaality of the tour,
    tour.availability += 1;

    await tour.save();
    // send  email.
    const data = {
      user: { name: user.name, email: user.email },
      tour: {
        name: tour.name,
        startDate: tour.startDate,
        endDate: tour.endDate,
        duration: tour.duration,
        price: tour.price,
      },
      supportEmail: "support@destatouring.com",
    };
    await sendEmail({
      email: user.email,
      template: "canceleBooking.ejs",
      data,
    });
    res.status(200).json({
      status: "sucess",
      message: "booking cancelled successfully",
    });
  } catch (err) {
    console.log(err);
  }
});
