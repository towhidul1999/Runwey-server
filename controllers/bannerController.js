const BannerModel=require("../models/bannerSchema");
const User = require("../models/User");


exports.banner=async(req,res,next)=>{ 
   console.log(req.user)
   let user = await User.findById(req.user);

   if(user.role=="admin"){
    try{
        if(req.files.bannerImage==undefined){
            return res.status(400).json({status:400,message:"Banner image is required"});
        }
        if(req.body.bannerName==""){
            return res.status(400).json({status:400,message:"Banner Name is required"}); 
        }

        let bannerimage="";
       
        if (req.files.bannerImage[0]) {
            bannerimage = `/banners/${req.files.bannerImage[0].filename}`;
        }

        console.log(bannerimage)

        const response=new BannerModel({
            bannerImage:bannerimage,
            bannerName:req.body.bannerName
        });
        const bannerImages=await response.save();
        return res.status(200).json({status:200,message:"Banner images add successfully"});

    }catch(err){
       next(err.message);
    }
   }else{
    return res.status(401).json({status:401,message:"UnAuthorized user"});  
   }
   
    
}

exports.bannerDataGet=async(req,res,next)=>{
  

       try{
            let AllBanners = await BannerModel.find();
            return res.status(200).json({status:200,message:"Data get successfully",data:{"bannersData":AllBanners}})
           

       }catch(err){
          next(err.message);
       } 
    
}


exports.bannerDelete=async(req,res,next)=>{
    let user = await User.findById(req.user);
     if(user.role=="admin"){
         const banner=await BannerModel.findById(req.params.id);
         
         if(banner){
             const deleteBanner=await BannerModel.findByIdAndDelete(req.params.id);
             return res.status(200).json({status:200,message:"Banner delete successfully"});
 
         }else{
            return res.status(400).json({status:400,message:"Banner Not found"});

         }
     }else{
        return res.status(401).json({status:401,message:"UnAuthorized user"});  
     }
}