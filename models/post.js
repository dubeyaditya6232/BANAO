const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const commentsSchema=new Schema({
    comment:{
       type: String,
    },
    username:{
        type: String,
        default: null
    }
/*     author:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User'
    } */
},{
   timestamps: true
})

const postSchema=new Schema({
    content:{
        type:String,
    },
    username:{
        type:String,
        default: null
    },
    likes:{
        type:Number,
        default:0
    },
    comments:[commentsSchema]   
},
{ timestamps: true }
);
module.exports=mongoose.model('post',postSchema);