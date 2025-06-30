import User from "../models/Users.js"

//update user cartData: /api/cart/update
export const updateCart = async (req,res)=>{
    try {
        const {userId,cartItems} = req.body
        await User.findByIdAndUpdate(userId,{cartItems})
        res.json({ success: true, message: "cart updated" });
 

    } catch (error) {
        console.log(error.message);
        res.json({ success: error, message: "error updating cart" });
    }
}