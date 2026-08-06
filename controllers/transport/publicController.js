const Vehicle = require('../../models/transport/Vehicle');
const DestinationPrice = require('../../models/transport/DestinationPrice');
const { calculateDistance } = require('../../services/distanceService');
const logger = require('../../utils/logger');

const searchVehicles = async (req, res, next) => {
    try {
        const { type } = req.query;
        const query = {
            availability: 'online',
            status: { $ne: 'maintenance' },
            $or: [
                { type: { $nin: ['van', 'bus'] }, status: 'idle' },
                { type: { $in: ['van', 'bus'] }, availableSeats: { $gt: 0 } },
            ],
        };
        if (type) query.type = type;
        const vehicles = await Vehicle.find(query).populate('partner', 'businessName').sort({ pricePerKm: 1 }).limit(20);
        res.json({ success: true, vehicles });
    } catch (error) { next(error); }
};

const getVehicle = async (req, res, next) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            availability: 'online',
            status: { $ne: 'maintenance' },
            $or: [
                { type: { $nin: ['van', 'bus'] }, status: 'idle' },
                { type: { $in: ['van', 'bus'] }, availableSeats: { $gt: 0 } },
            ],
        }).populate('partner', 'businessName');
        if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
        res.json({ success: true, vehicle });
    } catch (error) { next(error); }
};

const calculatePublicFare = async (req, res, next) => {
    try {
        const { from, to, vehicleType, pickupCoords, dropoffCoords, manualDistance, seats } = req.body;

        if (!from || !to) {
            return res.status(400).json({ success: false, message: 'From and To locations are required' });
        }

        const fixedPrice = await DestinationPrice.findOne({
            $or: [
                { from: { $regex: new RegExp(from, 'i') }, to: { $regex: new RegExp(to, 'i') } },
                { from: { $regex: new RegExp(to, 'i') }, to: { $regex: new RegExp(from, 'i') } },
            ],
            isActive: true,
        }).sort({ price: 1 });

        const seatMultiplier = seats && seats > 1 ? seats : 1;

        if (fixedPrice) {
            logger.info(`Public fixed price: ${from} → ${to} = ${fixedPrice.price}`);
            return res.json({
                success: true,
                fare: {
                    type: 'fixed',
                    price: fixedPrice.price * seatMultiplier,
                    from: fixedPrice.from,
                    to: fixedPrice.to,
                    distanceKm: fixedPrice.estimatedDistance || null,
                    durationMinutes: fixedPrice.estimatedDuration || null,
                    departureTimes: fixedPrice.departureTimes || [],
                    seats: seatMultiplier,
                    method: 'destination_price',
                },
            });
        }

        const query = {
            availability: 'online',
            status: { $ne: 'maintenance' },
            $or: [
                { type: { $nin: ['van', 'bus'] }, status: 'idle' },
                { type: { $in: ['van', 'bus'] }, availableSeats: { $gt: 0 } },
            ],
        };
        if (vehicleType) query.type = vehicleType;

        const vehicle = await Vehicle.findOne(query).sort({ pricePerKm: 1 });

        if (!vehicle) {
            return res.json({ success: false, message: 'No available vehicles found' });
        }

        const pricePerKm = vehicle.pricePerKm || 0;
        const baseFare = vehicle.baseFare || 0;

        const distanceResult = await calculateDistance({
            from, to, pickupCoords, dropoffCoords, manualDistance,
            pricePerKm, baseFare,
        });

        if (distanceResult.method === 'failed') {
            return res.json({ success: false, message: distanceResult.error });
        }

        res.json({
            success: true,
            fare: {
                type: 'dynamic',
                distanceKm: distanceResult.distanceKm,
                durationMinutes: distanceResult.durationMinutes || null,
                pricePerKm,
                baseFare,
                estimatedTotal: distanceResult.estimatedTotal * seatMultiplier,
                seats: seatMultiplier,
                method: distanceResult.method,
                vehicleId: vehicle._id,
            },
        });
    } catch (error) { next(error); }
};

module.exports = { searchVehicles, getVehicle, calculatePublicFare };