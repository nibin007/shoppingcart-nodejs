const { json } = require('body-parser');
var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product.helpers');
const userhelpers = require('../helpers/userhelpers');
const verifyLogin=(req,res,next)=>{
  if(req.session.user){
    next()
  }else{
    res.redirect('/loginuser')
  }
}
/* GET home page. */
router.get('/', async function(req, res, next) {
    let user = req.session.user
    let count=null
    //console.log(user)
    if (req.session.user){
       count = await userhelpers.cartcount(req.session.user._id)
    }
  productHelpers.getallproducts().then((products)=>{
    res.render('user/index',{products,user, count,admin:false});
})})
router.get('/loginuser',(req,res)=>{
    if(req.session.user){
      res.redirect('/') 
    }
     else{
      res.render('user/userlogin',{'success':req.session.i,'loginerr':req.session.userloginerr})
      req.session.userloginerr=false
      req.session.i=false
}})
router.get('/signups',(req,res)=>{
  res.render('../views/user/signup.hbs')
})
router.post('/signups',(req,res)=>{
   userhelpers.userloginhelper(req.body).then((details)=>{
     req.session.user.loggedin=true
     console.log(details)
      req.session.i="signup Success. Please login"
     res.redirect('/loginuser' )
  })})
  
  router.post('/login',(req,res)=>{
  userhelpers.dologin(req.body).then((response)=>{
      if(response.status){
           req.session.user=response.user
           req.session.user.loggedin=true
         res.redirect('/')
     }else{
       req.session.userloginerr="incorrect username or password"
      res.redirect('/loginuser')
    }
   })

 })
 router.get('/cart',verifyLogin,async(req,res)=>{
    let products=await userhelpers.carthelper(req.session.user._id);
    let total=0
    if(products.length>0){
     total=await userhelpers.totalsum(req.session.user._id)}
     res.render('../views/user/cart.hbs',{products,total,user:req.session.user})
     
   //console.log(products);
  
 })
 router.get('/logoutuser',(req,res)=>{
  req.session.user=null
  res.redirect('/')
 })
 router.get('/addtocart/:id',verifyLogin,(req,res)=>{
   console.log('api-call')
   userhelpers.addtocart(req.params.id,req.session.user._id).then(()=>{
     res.json({status:true})  
   })

 })
 router.post('/change-product-quantity',(req,res)=>{

   userhelpers.changeproductquantity(req.body).then(async(response)=>{   
    response.total=await userhelpers.totalsum(req.body.user)
    
     res.json(response)
   })
 })
 router.post('/delete-product-cart',(req,res)=>{
   userhelpers.removeproduct(req.body).then((response)=>{
     res.json(response)

   })
 })
 router.get('/placeorder',verifyLogin,async(req,res)=>{
   let total=await userhelpers.totalsum(req.session.user._id)
   res.render('../views/user/placeorder.hbs',{total,user:req.session.user})
 })
 router.post('/shiporder',async(req,res)=>{
   //console.log(req.body)
   console.log(req.body.userId)
   let products=await userhelpers.getcartforship(req.session.user._id)
   let cost=await userhelpers.totalsum(req.session.user._id)
    userhelpers.shippingdetails(req.body,products,cost,req.session.user._id).then((orderid)=>{
      console.log(req.body.paymentmethod)
      if(req.body.paymentmethod==='COD'){
      res.json({codsuccess:true})
      }else{
        userhelpers.createrazorpayorder(orderid,cost).then((response)=>{
          res.json(response)

        })
      }

  })})
 router.get('/orders',verifyLogin,async(req,res)=>{
    let orders= await userhelpers.showorders(req.session.user._id);
    //let total=await userhelpers.totalsumaftership(req.session.user._id);
    
    //console.log("nibin"+total)
    res.render('user/orderedlist.hbs',{orders,user:req.session.user})
    
  })
  router.get('/ordersuccess',(req,res)=>{
    res.render('user/ordersuccess',{user:req.session.user})
  })
  router.get('/viewproductorders/:id',verifyLogin,async(req,res)=>{
    let products=await userhelpers.getorderproducts(req.params.id)
    let total=await userhelpers.totalsumaftership(req.params.id);
    //console.log("ok"+total)
    res.render('../views/user/myorders.hbs',{user:req.session.user,total,products})
  })
router.post('/verify',(req,res)=>{
       //console.log(toString(req.body))
       //req.body=JSON.stringify(req.body)
       //console.log(req.body['response'])
        console.log("fuck"+req.body)
        //console.log(req.body)
    //console.log(JSON.stringify(req.body))
     userhelpers.verifypayment(req.body).then(()=>{
      //console.log("hi"+req.body.order.receipt)
     // userhelpers.changepaymentstatus(req.body.order.receipt).then(()=>{
       console.log('payment success')
       res.json({status:true})
    // })
     
   }).catch((err)=>{
     res.json({status:false})
  
 })

   

 })
  
 

module.exports = router;
