import User from "../models/Users.js";
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
//Regster user
export const registerUser = async(req,res)=>{
    try {
        const {name,email,password} = req.body;
        if(!name || !email || !password){
            return res.json({success:false,message:'Missing details'})
        }
        const existingUser = await User.findOne({email})

        if (existingUser) {
            return res.json({success:false, message:'User already exists'})
        }
        const hashedPassword = await bcryptjs.hash(password,10)
        const user = await User.create({name,email,password:hashedPassword})

        const token = jwt.sign({id: user._id},process.env.JWT_SECTRET,{expiresIn:'7d'})
        res.cookie('token',token,{
            httpOnly:true, //prevent javascript to access cookies
            secure:process.env.NODE_ENV === 'production',//use secure cooies in production

            sameSite:process.env.NODE_ENV === 'production' ? 'none' : 'strict', //CSRF protection
            maxAge:7*24*60*1000,
        })
        return res.json({success:true, user:{email:user.email,name:user.name}})
    } catch (error) {
        console.log(error.message);
        return res.json({success:false, message:error.message})
    }
}

//login User : /api/user/login
export const login = async (req,res)=>{
    try {
        const {email, password} = req.body
        if (!email || !password) {
            return res.json({success:false, message:"Email and passsword are required"})
        }
        const user = await User.findOne({email});
        if (!user) {
            return res.json({success:false, message:"Invalid email or password"})
        }
        const isMatch = await bcryptjs.compare(password,user.password)
        if (!isMatch) {
          return res.json({success:false, message:"Invalid email or password"})

        }

        const token = jwt.sign({id: user._id},process.env.JWT_SECTRET,{expiresIn:'7d'})
        res.cookie('token',token,{
            httpOnly:true, //prevent javascript to access cookies
            secure:process.env.NODE_ENV === 'production',//use secure cooies in production

            sameSite:process.env.NODE_ENV === 'production' ? 'none' : 'strict', //CSRF protection
            maxAge:7*24*60*1000,
        })
        return res.json({success:true, user:{email:user.email,name:user.name}})
    } catch (error) {
        console.log(error.message);
        return res.json({success:false, message:error.message})
    }
}

//check Auth : /api/user/is-auth
export const isAuth = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password"); // ✅ Use req.user.id
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        return res.json({ success: true, user });
    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, message: error.message });
    }
};

//Logout User :/api/user/logout
export const logout =async(req,res)=>{
    try {
        res.clearCookie('token',{
            httpOnly:true, //prevent javascript to access cookies
            secure:process.env.NODE_ENV === 'production',//use secure cooies in production
            sameSite:process.env.NODE_ENV === 'production' ? 'none' : 'strict', //CSRF protection
            
        });
        return res.json({success:true,message:"Logged out"})

    } catch (error) {
        console.log(error.message);
        return res.json({success:false, message:error.message})
    }

}





