import express from 'express'
import authUser from '../middlewares/authUser.js'
import { getAllOrders, getUserOrders, mpesaCallback, placeOrderCod, placeOrderMpesa, placeOrderStripe } from '../controllers/orderController.js'
import authSeller from '../middlewares/authSeller.js'
import Order from '../models/Order.js'

const orderRouter = express.Router()

orderRouter.post('/cod',authUser,placeOrderCod)
orderRouter.get('/user',authUser,getUserOrders)
orderRouter.get('/seller',authSeller,getAllOrders)
orderRouter.post('/stripe',authUser,placeOrderStripe)
orderRouter.post('/mpesa',authUser,placeOrderMpesa)
orderRouter.post("/mpesa-callback", mpesaCallback);

export default orderRouter;
