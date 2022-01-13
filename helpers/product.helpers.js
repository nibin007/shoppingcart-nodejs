var db=require('../config/connection')
const promise=require('promise')
const { resolve, reject } = require('promise')
const { ObjectID, ObjectId } = require('bson')
const collection =require('../config/collections')
const becrypt=require('bcrypt')
var objectid=require('mongodb').ObjectId
module.exports={
    addproduct:(product,cb)=>{
        
        db.get().collection('mm').insertOne(product).then((result)=>{
         console.log(result)
         cb(result.insertedId)
            
        })},
            getallproducts:()=>{
                return new promise(async(resolve,reject)=>{
                 let value=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
                 resolve(value)
                })
                   
                },deleteProduct:(proId)=>{
                    return new promise((resolve,reject)=>{
                        console.log(proId)
                       db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectid(proId)}).then((response)=>{
                           resolve(response)
                       })
                    })
                },getProductDetails:(proid)=>{
                    return new promise((resolve,reject)=>{
                        db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectid(proid)}).then((product)=>{
                            resolve(product)
                        })
                    })
                },updateProduct:(proId,details)=>{
                    return new promise((resolve,reject)=>{
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectid(proId)},{
                            $set:{
                                name:details.name,
                                description:details.description,
                                price:details.price,
                                category:details.category
                            }
                        }).then((response)=>{
                            resolve(response)
                        })
                    })
                },seeplacedorders:(placed)=>{
                    return new promise(async(resolve,reject)=>{
                      let orders = await db.get().collection(collection.ORDERCOLLECTION).find({status:placed}).toArray()
                      console.log(orders)
                      resolve(orders)
                    })
                },changestatus:(orderid)=>{
                    return new promise((resolve,reject)=>{
                       // console.log(orderid)
                        db.get().collection(collection.ORDERCOLLECTION).updateOne({_id:ObjectId(orderid)},{
                            $set:{
                                status:'Shipped'
                            }
                        }).then((response)=>{
                            resolve()
                        })
                    })
                },adminsignup:(details)=>{
                    return new promise(async(resolve,reject)=>{
                        details.password= await becrypt.hash(details.password,10)
                        db.get().collection(collection.ADMINCOLLECTION).insertOne(details).then((data)=>{
                            resolve(data)
                        })
                    })


                },adminlogin:(details)=>{
                    return new promise (async(resolve,reject)=>{
                       let adminobj ={}
                       let admin =await db.get().collection(collection.ADMINCOLLECTION).findOne({email:details.email})
                       if(admin){
                           becrypt.compare(details.password,admin.password).then((status)=>{
                               console.log(status)
                               if(status){
                                 console.log("loginsuccess")
                                 adminobj.admin=admin
                                 adminobj.status=true 
                                 resolve(adminobj)                                
                               }else{
                                   console.log('loginfailed due to incorrect password')
                                   resolve({status:false})
                               }
                           })

                       }else{
                           console.log("emailwrong")
                           resolve({status:false})
                       } 
                    })
                }
                
                
            }
        
        
    
    
    

    
