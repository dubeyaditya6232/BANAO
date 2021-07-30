const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const usersSchema=new Schema({
    email:{
        type:String,
    },
    username:{
        type:String,
    },
    password:{
        type:String,
    },
    resetPasswordToken: {
        type: String,
        default: '',
        expires: Date.now()+3600,
        required: false
    },
},
{ timestamps: true }
);
module.exports=mongoose.model('user',usersSchema);