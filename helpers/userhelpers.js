const becrypt=require('bcrypt')
var db=require('../config/connection')
const collection =require('../config/collections')
var objectid=require('mongodb').ObjectId
const { reject, resolve } = require('promise')
const { response } = require('express')
const { ObjectId } = require('bson')
const Razorpay=require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_YayVzxWHBI3NUk',
    key_secret: 'z6zUG0dHFwt0JfMfBVEHDKnB',
  });
module.exports={ 
   userloginhelper:(password)=>{
       return new Promise(async(resolve,reject)=>{
           password.password=await becrypt.hash(password.password,10)
          db.get().collection(collection.USERCOLLECTION).insertOne(password).then((data)=>{
              resolve(password)
            
       })})},
       dologin:(userdata)=>{
           return new Promise(async(resolve,reject)=>{
               let loginstatus=false
               let response={}
              
              let user = await db.get().collection(collection.USERCOLLECTION).findOne({email:userdata.email})
               if (user){
                    becrypt.compare(userdata.password,user.password).then((status)=>{
                      if(status){
                          console.log('login success')
                          response.user=user
                          response.status=true
                          resolve(response)
                      }else{
                          console.log("login failed")
                          resolve({status:false})
                      }

                  })
              }else{
                  console.log('login failed')
                  resolve({status:false})
              }
           })
       },addtocart:(proId,userId)=>{
           let proobj={item:objectid(proId),
                         quantity:1}
           return new Promise (async(resolve,reject)=>{
               let usercart=await db.get().collection(collection.CARTCOLLECTION).findOne({user:objectid(userId)})
               if (usercart){
                   let proExist=usercart.products.findIndex(product=>product.item==proId)
                   if(proExist!=-1){
                       db.get().collection(collection.CARTCOLLECTION).updateOne({'products.item':objectid(proId)},
                         {$inc:{'products.$.quantity':1}}).then(()=>{resolve()})
                   }else{
                   db.get().collection(collection.CARTCOLLECTION).updateOne({user:objectid(userId)},
                   {
                       $push:{products:proobj}
                
                }
                   ).then((response)=>{
                       resolve()
                   })}


               }else{
                   let cartobj={
                       user:objectid(userId),
                       products:[proobj]
                   }
                   db.get().collection(collection.CARTCOLLECTION).insertOne(cartobj).then((response)=>{
                       resolve()
                   })
               }
           })
       },carthelper:(userId)=>{
           return new Promise(async(resolve,reject)=>{
              let cartitems=await db.get().collection(collection.CARTCOLLECTION).aggregate([
               {
                   $match:{user:objectid(userId)}
               },
               {
                   $unwind:'$products'
               },{
                   $project:{
                       item:'$products.item',
                       quantity:'$products.quantity'
                   }
               },{
                   $lookup:{
                       from:collection.PRODUCT_COLLECTION,
                       localField:'item',
                       foreignField:'_id',
                       as:'product'
                   },
                   
               },{
                   $project:{
                       item:1,quantity:1,product:{$arrayElemAt:['$product',0]}                  }
               }
             

               ]).toArray()
               resolve(cartitems)
           })
       },cartcount:(userId)=>{
           return new Promise (async(resolve,reject)=>{
            let cartcount=0
            let cartdetails= await db.get().collection(collection.CARTCOLLECTION).findOne({user:objectid(userId)})
           if(cartdetails){
                 cartcount=cartdetails.products.length
           }resolve(cartcount)
        })
    },changeproductquantity:(details)=>{
            details.count=parseInt(details.count)
            details.quantity=parseInt(details.quantity)
        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CARTCOLLECTION).updateOne({_id:objectid(details.cart)},
                 {
                     $pull:{products:{item:objectid(details.product)}}
                    
                    }
                ).then((response)=>{
                    resolve({removeproduct:true})
                })
            }else{
            db.get().collection(collection.CARTCOLLECTION).updateOne({_id:objectid(details.cart),'products.item':objectid(details.product)},
                         {$inc:{'products.$.quantity':details.count}}).then((response)=>{
                    
                            resolve({status:true})})

        
        }
    })},removeproduct:(details)=>{
        return new Promise((resolve,reject)=>{
           db.get().collection(collection.CARTCOLLECTION).updateOne({_id:objectid(details.cart)},
             {
                 $pull:{products:{item:objectid(details.product)}}
             }
           
           ).then((response)=>{
               resolve({remove:true})
           })

        })
    },totalsum:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let total=await db.get().collection(collection.CARTCOLLECTION).aggregate([
             {
                 $match:{user:objectid(userId)}
             },
             {
                 $unwind:'$products'
             },{
                 $project:{
                     item:'$products.item',
                     quantity:'$products.quantity'
                 }
             },{
                 $lookup:{
                     from:collection.PRODUCT_COLLECTION,
                     localField:'item',
                     foreignField:'_id',
                     as:'product'
                 },  
             },{
                 $project:{
                     item:1,quantity:1,product:{$arrayElemAt:['$product',0]}                  }
             },
             {
                 $group:{
                    _id:null,
                    total:{$sum:{$multiply:['$quantity',{$toInt:'$product.price'}]}
                  
                 }
             }
            }

            ]).toArray()
            //console.log(total[0])
             resolve(total[0].total)
        
         })

    },shippingdetails:(details,products,totalsum,userId)=>{
        return new Promise((resolve,reject)=>{
            console.log(details.userId)
            console.log(userId)
            //console.log(details,products,totalsum)
            let status=details.paymentmethod==='COD'?'placed':'Pending'
            let orderobj={
                deliverydetails:{
                    mobile:details.mobile,
                    address:details.address,
                    pincode:details.pincode
                },
                userId:userId,
                Paymentmethod:details.paymentmethod,
                products:products,
                totalamount:totalsum,
                status:status,
                date:new Date()
            }
             db.get().collection(collection.ORDERCOLLECTION).insertOne(orderobj).then((response)=>{
                //console.log(response)
                console.log("yo"+userId)
             db.get().collection(collection.CARTCOLLECTION).deleteOne({user:ObjectId(userId)}) 
               
                resolve(response.insertedId)
            })
        })

    },getcartforship:(userId)=>{
        return new Promise(async(resolve,reject)=>{
             //console.log(userId)
        let cart=await db.get().collection(collection.CARTCOLLECTION).findOne({user:objectid(userId)})
         //console.log(cart)
        resolve(cart.products)     
       
        })
       
        
    },showorders:(user)=>{
        return new Promise(async(resolve,reject)=>{
           // console.log(user)
            let orders=await db.get().collection(collection.ORDERCOLLECTION).find({userId:user}).toArray()
            //console.log(orders)
            resolve(orders)

        })

    },getorderproducts:(orderid)=>{
        return new Promise(async(resolve,reject)=>{
            let orderitems=await db.get().collection(collection.ORDERCOLLECTION).aggregate([
                {
                    $match:{_id:objectid(orderid)}
                },
                {
                    $unwind:'$products'
                },{
                    $project:
                    {
                        item:'$products.item',
                      quantity:'$products.quantity',
                      totalamount:1
                   }
                },
                {$lookup:
                    {
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'

                    },
               },{
                   $project:{
                       totalamount:1,item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                   }



               }
            ]).toArray()
           // console.log(orderitems)
            
            resolve(orderitems)
        })

    },createrazorpayorder:(orderid,total)=>{
        return new Promise((resolve,reject)=>{
            var options = {
                amount: total,  // amount in the smallest currency unit
                currency: "INR",
                receipt:""+orderid
              };
              instance.orders.create(options, function(err, order) {
              //  console.log("new order:",order);
                resolve(order)
              });
        })
    },verifypayment:(details)=>{
        return new Promise((resolve,reject)=>{
            //console.log( details)
            console.log(details['razorpay_payment_id'])
            console.log(details.checkout_logo)
           const crypto = require('crypto');
           let hmac= crypto.createHmac('sha256', 'z6zUG0dHFwt0JfMfBVEHDKnB');
           hmac.update((details.razorpay_order_id)+'|'+(details.razorpay_payment_id));
           hmac=hmac.digest('hex')
          // console.log('id'+hmac)
          console.log(details.razorpay_signature)
          if(hmac==details.razorpay_signature){
              console.log('correct')
             resolve()
         }else{
             console.log("wrong")
             reject()
         }
        })
    },changepaymentstatus:(orderid)=>{
         return new Promise((resolve,reject)=>{
             db.get().collection(collection.ORDERCOLLECTION).updateOne({_id:objectid(orderid)},
               {
                   $set:{
                       status:'placed'
                   }
                }
             ).then(()=>{
                 resolve()
             })
         })
    },totalsumaftership:(orderid)=>{
        return new Promise(async(resolve,reject)=>{
            //console.log("hello"+user)
          let amount =await db.get().collection(collection.ORDERCOLLECTION).aggregate([
                {
                    $match:{_id:objectid(orderid)}
                },
                {
                    $project:{totalamount:1}
                }
            ]).toArray()
            
             resolve(amount[0].totalamount)

        })
    }

    




}