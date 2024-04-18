const mongoose = require('mongoose');

const MassageTypeSchema =  new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    price: {
        type: Number,
        required: [true, 'Please add price']
    }
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})

module.exports=mongoose.model('MassageType', MassageTypeSchema);