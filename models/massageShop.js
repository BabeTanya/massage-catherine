const mongoose = require('mongoose');

const MassageShopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    phoneNumber: {
        type: String,
        required: [true, 'Please specify telephone number']
    },
    openTime: {
        type: String,
        required: [true, 'Please specify open time']
    },
    closeTime: {
        type: String,
        required: [true, 'Please specify close time']
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

//Reverse populate with virtuals
MassageShopSchema.virtual('appointments', {
    ref: 'Appointment',
    localField: '_id',
    foreignField: 'MassageShop',
    justOne: false,
});

//Cascade delete appointments when a massage shop is deleted
MassageShopSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    console.log(`Appointments being removed from massage shop ${this._id}`);
    await this.model('Appointment').deleteMany({ massageShop: this._id });
    next();
})

module.exports = mongoose.model('MassageShop', MassageShopSchema);