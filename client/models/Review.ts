import mongoose, { Schema, models } from "mongoose";

const ReviewSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Snapshot of the reviewer's name, so the review still reads correctly
    // if they change their account name later.
    name: {
      type: String,
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// One review per person per product.
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

const Review = models.Review || mongoose.model("Review", ReviewSchema);

export default Review;
