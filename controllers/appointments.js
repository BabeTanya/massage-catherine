const Appointment = require('../models/Appointment');
const MassageShop = require('../models/MassageShop');

//@desc    Get all appointments
//@route   GET /api/v1/appointments
//@access  Private
exports.getAppointments = async (req, res, next) => {
    let query;
    //General users can see only thier appointments!
    if (req.user.role !== 'admin') {
        if (req.params.massageShopId) {
            query = Appointment.find({ user: req.user.id, massageShop: req.params.massageShopId }).populate({
                path: 'massageShop',
                select: 'name address phoneNumber'
            }).populate({
                path: 'massageType',
                select: 'name price'
            });
        } else {
            query = Appointment.find({ user: req.user.id }).populate({
                path: 'massageShop',
                select: 'name address phoneNumber'
            }).populate({
                path: 'massageType',
                select: 'name price'
            });
        }
    } else { //If you are an admin, you can see all!
        if (req.params.massageShopId) {
            query = Appointment.find({ massageShop: req.params.massageShopId }).populate({
                path: 'massageShop',
                select: 'name address phoneNumber openTime closeTime'
            }).populate({
                path: 'massageType',
                select: 'name price'
            });
        } else {
            query = Appointment.find().populate({
                path: 'massageShop',
                select: 'name address phoneNumber openTime closeTime'
            }).populate({
                path: 'massageType',
                select: 'name price'
            });
        }
    }
    try {
        const appointments = await query;

        res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
        });
    } catch (error) {
        console.log(error.stack);
        return res.status(500).json({
            success: false,
            message: "Cannot find Appointment"
        });
    }
};

//@desc    Get single appointment
//@route   GET /api/v1/appointments/:id
//@access  Public
exports.getAppointment = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id).populate({
            path: 'massageShop',
            select: 'name address phoneNumber openTime closeTime'
        }).populate({
            path: 'massageType',
            select: 'name price'
        });;

        if (!appointment) {
            return res.status(404).json({ success: false, message: `No appointment with the id of ${req.params.id}` });
        }

        res.status(200).json({
            success: true,
            data: appointment
        });
    } catch (error) {
        console.log(error.stack);
        return res.status(500).json({ success: false, message: "Cannot find Appointment" });
    }
}

//@desc    Add single appointment
//@route   POST /api/v1/massageShops/:massageShopId/appointments/
//@access  Private
exports.addAppointment = async (req, res, next) => {
    try {
        req.body.massageShop = req.params.massageShopId;
        const massageShop = await MassageShop.findById(req.params.massageShopId);

        if (!massageShop) {
            return res.status(404).json({ success: false, message: `No massage shop with the id of ${req.params.massageShopId}` });
        }

        //add user Id to req.body
        req.body.user = req.user.id;
        //Check for existed appointment
        const existedAppointments = await Appointment.find({ user: req.user.id });
        //If the user is not an admin, they can only create 3 appointment.
        if (existedAppointments.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({ success: false, message: `The user with ID ${req.user.id} has already made 3 appointments` });
        }

        const createAppointment = await Appointment.create(req.body);
        const appointment = await Appointment.findById(createAppointment.id).populate({
            path: 'massageShop',
            select: 'name address phoneNumber openTime closeTime'
        }).populate({
            path: 'massageType',
            select: 'name price'
        });;
        res.status(200).json({ suceess: true, data: appointment });
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({ success: false, message: `Cannot create appointment: ${err.message}` })
    }
};

//@desc    Update appointment
//@route   PUT /api/v1/appointments/:id
//@access  Private
exports.updateAppointment = async (req, res, next) => {
    try {
        let appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: `No appointment with the id of ${req.params.id}` });
        }

        //Make sure user is the appointment owner
        if (appointment.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to update this appointment` })
        }

        appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: appointment
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Cannot update Appointment" });
    }
};

//@desc    Delete appointment
//@route   DELETE /api/v1/appointments/:id
//@access  Private
exports.deleteAppointment = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ success: false, message: `No appt with id ${req.params.id}` });
        }

        // Make sure user is the appointment owner
        if (appointment.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to delete this appointment` })
        }

        await appointment.deleteOne();
        res.status(200).json({ success: true, data: {} });

    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({ success: false, message: "Cannot delete Appointment" });
    }
};