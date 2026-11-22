const mongoose=require('mongoose')
const schema=new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  kind:{type:String,required:true},titulo:{type:String,required:true,maxLength:120},detalle:{type:String,required:true,maxLength:500},route:{type:String,required:true},
  seenAt:{type:Date,default:null},expiresAt:{type:Date,required:true,index:{expires:0}},
},{timestamps:true})
module.exports=mongoose.model('Notification',schema)
