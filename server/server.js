const mongoose = require("mongoose")
const Document = require('./Document')

mongoose.connect('mongodb+srv://docsclone:yi9BVuWRnnkS6YWo@cluster0.qyi9dpq.mongodb.net/googledocsclone?retryWrites=true&w=majority',
  {},(err)=>{
    if(err)console.log(err)
    else console.log("Db Connected")
  }
);

const defaultValue = ""

const io = require('socket.io')(3001, {
    // Cross Origin requests
    cors: {
        origin: 'http://localhost:3000',
        methods: ["GET", "POST"],
    },
})

io.on("connection", socket => {
    console.log("connected")



    // getting document
    socket.on('get-document', async documentId => {
        const document = await findOrCreateDocument(documentId)
        socket.join(documentId)
        socket.emit("load-document", document.data)

        // sending changes to every user
        socket.on('send-changes', delta => {
            socket.broadcast.to(documentId).emit('receive-changes', delta)
        })

        // saving document
        socket.on("save-document", async data =>{
            await Document.findByIdAndUpdate(documentId, {data})
        })
    })
})


async function findOrCreateDocument(id){
    if(id==null) return
    console.log("saving");
    const document = await Document.findById(id)
    if(document) return document
    console.log("can't find document wth id: "+id);
    return await Document.create({_id: id, data: defaultValue})
}