
const mongoclient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect=function(done){
     const dbname ='nib'
      const url ='mongodb://localhost:27017'
       mongoclient.connect(url,(err,data)=>{
           if(err) return done(err)
               state.db=data.db(dbname)
            done()
           }
       )
        }
       module.exports.get=function(){
           return state.db
       }

