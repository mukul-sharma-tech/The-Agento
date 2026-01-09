// import mongoose, { Schema, Document, Model } from "mongoose";

// export interface IUser extends Document {
//   name: string;
//   email: string;
//   password: string;
//   companyName: string;
// }

// const UserSchema: Schema<IUser> = new Schema(
//   {
//     name: { type: String, required: true, trim: true },
//     email: { type: String, required: true, unique: true, lowercase: true },
//     password: { type: String, required: true },
//     companyName: { type: String, required: true },
//   },
//   { timestamps: true }
// );

// const User: Model<IUser> =
//   mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

// export default User;


import mongoose, { Schema, models } from "mongoose";

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  companyName: string;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    companyName: { type: String, required: true },

    resetPasswordToken: String,
    resetPasswordExpiry: Date,
  },
  { timestamps: true }
);

export default models.User || mongoose.model<IUser>("User", UserSchema);
