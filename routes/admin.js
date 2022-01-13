var express = require('express');
var router = express.Router();
var producthelper=require('../helpers/product.helpers')
const fs =require('fs')
const app = require('../app');
const mongoclient=require('mongodb').MongoClient;
const productHelpers = require('../helpers/product.helpers');
const path = require('path');
const { Router } = require('express');

/* GET users listing. */
const verifyadminlogin=(req,res,next)=>{
  if(req.session.admin){
    next()
  }else{
    res.redirect('/admin/adminlogin')
  }
}

router.get('/',verifyadminlogin, function(req, res, next) {
  let adminname=req.session.admin
  productHelpers.getallproducts().then((products)=>{
    res.render('admin/viewproduct',{admin:true,products,adminname})
  })})

router.get('/adminsignin',(req,res)=>{
  res.render('admin/adminsignup')
})
router.post('/adminsignup',(req,res)=>{
  //console.log(req.body)
  productHelpers.adminsignup(req.body).then((data)=>{
   // console.log(data)
    res.redirect('admin/adminlogin')

  })
})
router.get('/adminlogin',(req,res)=>{
  res.render('admin/adminlogin',{'error':req.session.adminloginerr,admin:true})
  req.session.adminloginerr=false
})
router.post('/login',(req,res)=>{
  console.log(req.body)
  productHelpers.adminlogin(req.body).then((response)=>{
    if(response.status){
      req.session.admin=response.admin
      res.redirect('/admin')
    }else{
      req.session.adminloginerr="incorrect username or password"
      res.redirect('/admin/adminlogin')
    }

  })

})
router.get('/logout',(req,res)=>{
  req.session.admin=null
  res.redirect('/admin/adminlogin')
})

router.get('/add-product',verifyadminlogin, function(req,res){
  res.render('admin/addproduct')

});
router.get('/delete/:id',(req,res)=>{
  let proId =req.params.id
  const paths='./public/productimages/'+proId+'.jpg'
  console.log(proId)
  producthelper.deleteProduct(proId).then((response)=>{
    try{fs.unlinkSync(paths)
         console.log('image deleted')}
         catch(err){
           console.log(err)
         }
         res.redirect('/admin')
  })
})
router.post('/add-product',verifyadminlogin, (req,res)=>{
    const a=req.files.filess
    const path='./public/productimages/'
    req.body.price=parseInt(req.body.price)
    producthelper.addproduct(req.body,(id)=>{
       a.mv(path+id+'.jpg',(err,done)=>{
        if(err){res.send(err)}
        else{res.render('admin/addproduct')}
      })
      
    })
  })
  router.get('/editproduct/:id',verifyadminlogin, async(req,res)=>{
      let product=  await producthelper.getProductDetails(req.params.id)
      console.log(product)

      res.render('admin/editproduct',{product})
     })
     router.post('/updateproduct/:id',(req,res)=>{
       producthelper.updateProduct(req.params.id,req.body).then(()=>{
         res.redirect('/admin')
         if(req.files.filess){
           const a=req.files.filess
           id=req.params.id
           const path ='./public/productimages/'
           a.mv(path+id+'.jpg') 
         }
       })

     })
router.get('/seeplacedorder',async(req,res)=>{
       let placed="placed"
      let orders= await producthelper.seeplacedorders(placed)
      res.render('admin/placedorders',{orders})
     })
router.get('/changestatus/:id',(req,res)=>{
     let orderid=req.params.id
     console.log(orderid)
      producthelper.changestatus(orderid).then((ans)=>{
        res.redirect('/seeplacedorders')
       })
     })
                
  
  
  module.exports=router;
   

    
  
 
  


