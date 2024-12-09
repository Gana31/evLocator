import mongoose from "mongoose";
const random_profile = () => {
  const img_urls = [
    "https://res.cloudinary.com/dnyhn7loo/image/upload/v1732534321/profile_images/g1xzno2gegyixplrqky2.webp",
    "https://res.cloudinary.com/dnyhn7loo/image/upload/v1732534320/profile_images/xyrs8o9vgo8qjhz1dlaw.webp",
    "https://res.cloudinary.com/dnyhn7loo/image/upload/v1732534320/profile_images/lhwlf42g7q5wzqafrkfu.webp",
    "https://res.cloudinary.com/dnyhn7loo/image/upload/v1732534320/profile_images/mzsr5qkbppzbix9xl89w.webp",
    "https://res.cloudinary.com/dnyhn7loo/image/upload/v1732534320/profile_images/kpt4t3bkjkvi63gtaduy.webp"
  ]
  const idx = Math.floor(Math.random() * img_urls.length);
  return img_urls[idx];
};

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
        default: null,
      },
      avatar: {
        type: String,
        default: random_profile(),
        required : true
      },
      userType:{
        type:String,
        default:'user'
      }
},{
    timestamps:true,
});

const farmerModel = mongoose.model("User",farmerSchema);

export default farmerModel;
