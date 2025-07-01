import Address from "../models/Address.js"

//add Address :/api/address/add
export const addAdress = async(req,res)=>{
    try {
        const {
  firstName, lastName, email, street, city,
  state, zipcode, country, phone, userId
} = req.body;

await Address.create({
  firstName,
  lastName,
  email,
  street,
  city,
  state,
  zipcode,
  country,
  phone,
  userId
});

        res.json({success:true,message:"Address added successfully"})

    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
    }
}

//get Address : /api/address/get
export const getAddress = async(req,res)=>{
    try {
        const {userId} = req.query;
        const addresses = await Address.find({userId});
        res.json({success:true,addresses})
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
    }
}