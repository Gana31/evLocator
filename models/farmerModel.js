import mongoose from "mongoose";

const farmerSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
      },
      lastname: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      password: {
        type: String,
        required: true,
      },
      mobile: {
        type: Number,
        required: true,
      },
      farm:{
          type: Array,
          default: [],
      },
      userType:{
        type:String,
        default:'farmer'
      }
},{
    timestamps:true,
});

const farmerModel = mongoose.model("User",farmerSchema);

export default farmerModel;