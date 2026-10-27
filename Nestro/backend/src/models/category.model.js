import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: 3,
        maxLength: 20,
        unique: true
    },
    slug:{
        type: String,
        required: true,
        trim : true,
        unique: true
    },
  image: {
  type: String,
  default: null
  },
    status:{
        type:Boolean,
        default: true
    }
},
{
    timestamps: true
}
)

const CategoryModel= mongoose.model("category",CategorySchema);
export default CategoryModel;