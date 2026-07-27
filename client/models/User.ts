import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "customer",
    },
  },
  {
    timestamps: true,
  }
);

const User = models.User || mongoose.model("User", UserSchema);

export default User;