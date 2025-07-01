import cookieParser from 'cookie-parser';
import express from 'express'
import cors from 'cors'
import connectDB from './configs/db.js';
import 'dotenv/config';
import userRouter from './routes/userRoute.js';
import sellerRouter from './routes/sellerRoute.js';
import connectCloudinary from './configs/cloudinary.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import addressRouter from './routes/addressRoute.js';
import orderRouter from './routes/orderRoute.js';
import { stripeWebhook } from './controllers/orderController.js';


const app = express();
const port = process.env.PORT || 4000;

app.post('/stripe',express.raw({type:'application/json'}),stripeWebhook)


//middleware configuration
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://snapfresh-git-main-mavekepeters-projects.vercel.app',
    'https://snapfresh-alpha.vercel.app'
  ],
  credentials: true
}));


await connectDB()
await connectCloudinary()


app.get('/',(req,res)=>res.send("API IS WORKING"))
app.use('/api/user',userRouter)
app.use('/api/seller',sellerRouter)
app.use('/api/product',productRouter)
app.use('/api/cart',cartRouter)
app.use('/api/address',addressRouter)
app.use('/api/order',orderRouter)

app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);
    
})