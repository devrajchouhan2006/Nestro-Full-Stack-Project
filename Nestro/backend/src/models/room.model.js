import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
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

const RoomModel= mongoose.model("Room",RoomSchema);
export default RoomModel;