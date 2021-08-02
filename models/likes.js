const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const likeSchema=new Schema({
      username:{
          type:String,
          default:null
      },
      postId:{
          type:String,
          default:null
      }
},
{ timestamps: true }
);
module.exports=mongoose.model('like',likeSchema);