const MassageType = require('../models/MassageType');

const MassageShop = require('../models/MassageShop');

//@desc    Get all Massage Types
//@route   GET /api/v1/massage-types
//@access  Private
exports.getMassageTypes = async (req, res, next) => {
    const massageTypes = await MassageType.find({});

    return res.status(200).json({
        data: massageTypes,
        success: true,
    });
}

exports.createMassageType = async (req, res, next) => {

    let massageShop;
    try {
        massageShop = await MassageType.create(req.body);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        })
    }
    return res.status(201).json({
        success: true,
        data: massageShop
    });
}