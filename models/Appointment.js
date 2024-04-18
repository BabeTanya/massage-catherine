const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    apptDate: {
        type: Date,
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    massageShop: {
        type: mongoose.Schema.ObjectId,
        ref: 'MassageShop',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    massageType: {
        type: mongoose.Schema.ObjectId,
        ref: 'MassageType',
        required: true
    },
    // massageType: {
    //     type: String,
    //     enum: {
    //         values: ['Neck-Back', 'Thai', 'Aroma'],
    //         message: '{VALUE} is not supported, Please specify Neck-Back, Thai or Aroma'
    //     },
    //     required: true
    // }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);