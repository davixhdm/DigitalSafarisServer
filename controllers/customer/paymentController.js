const Payment = require('../../models/customer/Payment');
const Wallet = require('../../models/customer/Wallet');
const Booking = require('../../models/customer/Booking');
const Order = require('../../models/restaurant/Order');
const Ride = require('../../models/transport/Ride');
const Customer = require('../../models/customer/Customer');
const PlatformSettings = require('../../models/admin/PlatformSettings');
const { stripe: stripeService, mpesa: mpesaService } = require('../../services/paymentService');
const { customer: customerEmails, partner: partnerEmails } = require('../../services/emailService');
const { createNotification } = require('../../services/notificationService');
const logger = require('../../utils/logger');

const getEnabledMethods = async () => {
    const setting = await PlatformSettings.findOne({ key: 'payment_methods' });
    return setting?.value || ['mpesa', 'wallet'];
};

const getPaymentMethods = async (req, res, next) => {
    try {
        const methods = await getEnabledMethods();
        res.json({ success: true, methods });
    } catch (error) { next(error); }
};

const findOrCreateWallet = async (customerId, currency = 'KES') => {
    return await Wallet.findOneAndUpdate(
        { customer: String(customerId) },
        { $setOnInsert: { balance: 0, currency } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
};

const creditWalletFromPayment = async (payment) => {
    const customerId = String(payment.customer);
    const currency = payment.currency || 'KES';
    const wallet = await findOrCreateWallet(customerId, currency);

    wallet.balance += payment.amount;
    wallet.transactions.push({
        type: 'credit',
        amount: payment.amount,
        description: 'Top-up via ' + (payment.method === 'mpesa' ? 'M-Pesa' : payment.method),
        reference: payment.reference,
        createdAt: new Date(),
    });
    await wallet.save();

    const customer = await Customer.findById(payment.customer);
    if (customer) {
        customerEmails.sendWalletTopup(customer, payment.amount, wallet.balance)
            .catch(e => logger.error('Topup email failed: ' + e.message));
    }

    createNotification({
        customerId,
        type: 'payment',
        title: 'Wallet Topped Up',
        message: `KES ${payment.amount.toLocaleString()} added to your wallet.`,
    }).catch(e => logger.error('Notification failed: ' + e.message));

    return wallet;
};

const createBookingFromPayment = async (customerId, data, paymentId) => {
    const Room = require('../../models/accommodation/Room');
    const Property = require('../../models/accommodation/Property');
    const AccommodationPartner = require('../../models/accommodation/AccommodationPartner');

    const { propertyId, roomId, checkIn, checkOut, guests, specialRequests } = data;
    const room = await Room.findById(roomId);
    const property = await Property.findById(propertyId);
    const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
    const totalAmount = room.price * nights;

    const booking = await Booking.create({
        customer: customerId, property: propertyId, room: roomId,
        checkIn: new Date(checkIn), checkOut: new Date(checkOut),
        guests: guests || 1, totalAmount, specialRequests,
        status: 'confirmed', paymentStatus: 'paid',
    });

    await Room.findByIdAndUpdate(roomId, { status: 'occupied' });

    if (paymentId) await Payment.findByIdAndUpdate(paymentId, { booking: booking._id });

    const customer = await Customer.findById(customerId);
    const customerName = customer ? customer.firstName + ' ' + customer.lastName : 'Guest';

    if (customer) {
        customerEmails.sendBookingConfirmed(customer, {
            id: booking._id, propertyName: property.name,
            checkIn: new Date(checkIn).toISOString().split('T')[0],
            checkOut: new Date(checkOut).toISOString().split('T')[0],
            guests: guests || 1, totalAmount,
        }).catch(e => logger.error('Booking email failed: ' + e.message));

        createNotification({
            customerId: customer._id.toString(),
            type: 'booking', title: 'Booking Confirmed',
            message: `Your stay at ${property.name} is confirmed.`,
        }).catch(e => logger.error('Notification failed: ' + e.message));
    }

    const partner = await AccommodationPartner.findById(property.partner);
    if (partner) {
        partnerEmails.sendNewReservation(partner, {
            id: booking._id, propertyName: property.name, roomNumber: room.roomNumber,
            guestName: customerName,
            checkIn: new Date(checkIn).toISOString().split('T')[0],
            checkOut: new Date(checkOut).toISOString().split('T')[0], totalAmount,
        }).catch(e => logger.error('Partner email failed: ' + e.message));

        createNotification({
            partnerId: partner._id.toString(),
            type: 'booking', title: 'New Reservation',
            message: customerName + ' booked ' + property.name + ' - Room ' + room.roomNumber + '.',
        }).catch(e => logger.error('Notification failed: ' + e.message));
    }

    return booking;
};

const createOrderFromPayment = async (customerId, data, paymentId) => {
    const MenuItem = require('../../models/restaurant/MenuItem');
    const RestaurantPartner = require('../../models/restaurant/RestaurantPartner');

    const { items, orderType, deliveryAddress, customerPhone, notes } = data;
    let partnerId = null;
    const validatedItems = [];
    for (const item of items) {
        const menuItem = await MenuItem.findById(item.menuItem);
        if (!partnerId) partnerId = menuItem.partner;
        validatedItems.push({ menuItem: menuItem._id, name: menuItem.name, quantity: item.quantity || 1, price: menuItem.price });
    }

    const restaurant = await RestaurantPartner.findById(partnerId);
    const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = orderType === 'delivery' ? (restaurant?.deliveryFee || 0) : 0;
    const total = subtotal + deliveryFee;

    const order = await Order.create({
        partner: partnerId, customer: customerId, customerPhone: customerPhone || '',
        items: validatedItems, orderType: orderType || 'delivery', deliveryAddress, notes,
        subtotal, deliveryFee, total, estimatedTime: 20, status: 'confirmed', paymentStatus: 'paid',
    });

    if (paymentId) await Payment.findByIdAndUpdate(paymentId, { 'metadata.orderId': order._id });

    const customer = await Customer.findById(customerId);
    const customerName = customer ? customer.firstName + ' ' + customer.lastName : 'Guest';

    if (customer) {
        createNotification({
            customerId: customer._id.toString(),
            type: 'food', title: 'Order Confirmed',
            message: `Your order from ${restaurant?.businessName || 'restaurant'} has been placed.`,
        }).catch(e => logger.error('Notification failed: ' + e.message));
    }

    if (restaurant) {
        partnerEmails.sendNewOrder(restaurant, {
            id: order._id, customerName, itemsCount: validatedItems.length,
            orderType: orderType || 'delivery', total,
            deliveryAddress: deliveryAddress?.street || 'N/A',
            phone: customerPhone || '', notes: notes || '', items: validatedItems,
        }).catch(e => logger.error('Partner email failed: ' + e.message));

        createNotification({
            partnerId: restaurant._id.toString(),
            type: 'food', title: 'New Order Received',
            message: customerName + ' placed an order. Total: KES ' + total + '.',
        }).catch(e => logger.error('Notification failed: ' + e.message));
    }

    return order;
};

const createRideFromPayment = async (customerId, data, paymentId) => {
    const Vehicle = require('../../models/transport/Vehicle');
    const TransportPartner = require('../../models/transport/TransportPartner');

    const { vehicleId, pickup, dropoff, rideType, scheduledTime, customerPhone, fare, seats, seatNumbers } = data;
    const vehicle = await Vehicle.findById(vehicleId);
    const seatCount = seats || 1;

    const isFixedPrice = fare?.type === 'fixed';
    const hasLegs = fare?.legs?.length > 0;
    const distance = hasLegs ? null : (isFixedPrice ? (fare?.distanceKm || null) : (fare?.distanceKm || 5));
    const total = fare?.estimatedTotal || fare?.price || Math.round((vehicle.pricePerKm * (distance || 5) + (vehicle.baseFare || 0)) * 100) / 100;

    const ride = await Ride.create({
        partner: vehicle.partner, vehicle: vehicleId, customer: customerId,
        pickup: {
            address: pickup?.address || pickup,
            note: pickup?.note || '',
            coordinates: pickup?.coordinates || [0, 0],
        },
        dropoff: {
            address: dropoff?.address || dropoff,
            note: dropoff?.note || '',
            coordinates: dropoff?.coordinates || [0, 0],
        },
        rideType: rideType || 'immediate', scheduledTime: scheduledTime || null,
        status: 'requested', paymentStatus: 'paid', distance,
        seats: seatCount, seatNumbers: seatNumbers || [], customerPhone: customerPhone || '',
        fare: {
            base: isFixedPrice ? total : (fare?.baseFare || vehicle.baseFare || 0) * seatCount,
            distance: isFixedPrice ? 0 : (fare?.pricePerKm || vehicle.pricePerKm) * (distance || 5) * seatCount,
            time: 0,
            total,
            currency: 'KES',
        },
    });

    if (['van', 'bus'].includes(vehicle.type)) {
        vehicle.availableSeats = Math.max(0, vehicle.availableSeats - seatCount);
        vehicle.activeRides.push(ride._id);
        if (vehicle.availableSeats === 0) vehicle.status = 'on_trip';
    } else {
        vehicle.status = 'on_trip';
    }
    vehicle.dispatchStatus = 'dispatched';
    await vehicle.save();

    if (paymentId) await Payment.findByIdAndUpdate(paymentId, { 'metadata.rideId': ride._id });

    const customer = await Customer.findById(customerId);
    const customerName = customer ? customer.firstName + ' ' + customer.lastName : 'Guest';
    const vehicleName = vehicle.make + ' ' + vehicle.model + ' (' + vehicle.plateNumber + ')';

    const partner = await TransportPartner.findById(vehicle.partner);
    if (partner) {
        partnerEmails.sendNewRide(partner, {
            id: ride._id, customerName, vehicleName, rideType: rideType || 'immediate',
            pickup: ride.pickup.address, dropoff: ride.dropoff.address,
            distance: hasLegs ? null : distance, total,
            phone: customerPhone || '', scheduledTime, seats: seatCount,
        }).catch(e => logger.error('Partner email failed: ' + e.message));

        createNotification({
            partnerId: partner._id.toString(),
            type: 'transport', title: 'New Ride Request',
            message: customerName + ' requested a ride. ' + ride.pickup.address + ' to ' + ride.dropoff.address + '.',
        }).catch(e => logger.error('Notification failed: ' + e.message));
    }

    if (customer) {
        const reference = 'DS-' + Date.now();
        customerEmails.sendPaymentReceived(customer, {
            amount: total, method: 'Wallet', reference,
            type: 'ride',
            details: {
                vehicle: vehicleName,
                pickup: ride.pickup.address,
                dropoff: ride.dropoff.address,
                seats: seatCount, total,
            },
        }).catch(e => logger.error('Customer email failed: ' + e.message));

        createNotification({
            customerId: customer._id.toString(),
            type: 'transport', title: 'Ride Booked',
            message: `Your ride from ${ride.pickup.address} to ${ride.dropoff.address} has been booked.`,
        }).catch(e => logger.error('Customer notification failed: ' + e.message));
    }

    return ride;
};

const processPayment = async (req, res, next) => {
    try {
        const { method, amount, bookingData, orderData, rideData, phone } = req.body;
        const enabledMethods = await getEnabledMethods();

        if (!enabledMethods.includes(method)) return res.status(400).json({ success: false, message: method + ' is not available.' });
        if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Valid amount required.' });

        const reference = 'DS-' + Date.now();

        if (method === 'wallet') {
            const customerId = String(req.user._id);
            const wallet = await findOrCreateWallet(customerId, 'KES');
            if (wallet.balance < amount) return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });

            wallet.balance -= amount;
            wallet.transactions.push({ type: 'debit', amount, description: 'Payment #' + reference, reference, createdAt: new Date() });
            await wallet.save();

            const payment = await Payment.create({
                customer: customerId, amount, method: 'wallet', type: 'payment',
                status: 'completed', reference, transactionId: reference,
                metadata: { bookingData, orderData, rideData },
            });

            let createdItem = null;
            if (bookingData) createdItem = await createBookingFromPayment(customerId, bookingData, payment._id);
            else if (orderData) createdItem = await createOrderFromPayment(customerId, orderData, payment._id);
            else if (rideData) createdItem = await createRideFromPayment(customerId, rideData, payment._id);

            customerEmails.sendPaymentReceived(req.user, { amount, method: 'Wallet', reference }).catch(e => logger.error('Email failed: ' + e.message));

            return res.json({ success: true, payment, createdItem, message: 'Payment successful via wallet.' });
        }

        if (method === 'mpesa') {
            if (!phone) return res.status(400).json({ success: false, message: 'Phone required for M-Pesa.' });
            const { checkoutRequestId } = await mpesaService.stkPush({ phone, amount, reference, description: 'Digital Safaris Payment' });
            await Payment.create({ customer: String(req.user._id), amount, method: 'mpesa', type: 'payment', status: 'pending', reference, transactionId: checkoutRequestId, metadata: { bookingData, orderData, rideData } });
            return res.json({ success: true, checkoutRequestId, reference, message: 'M-Pesa STK push sent. Enter PIN.' });
        }

        if (method === 'stripe') {
            const { clientSecret, paymentIntentId } = await stripeService.createPaymentIntent({ amount, currency: 'kes', metadata: { customerId: String(req.user._id) } });
            await Payment.create({ customer: String(req.user._id), amount, method: 'stripe', type: 'payment', status: 'pending', reference, transactionId: paymentIntentId, metadata: { bookingData, orderData, rideData } });
            return res.json({ success: true, clientSecret, paymentIntentId, reference, message: 'Stripe payment initiated.' });
        }

        res.status(400).json({ success: false, message: 'Invalid payment method.' });
    } catch (error) { next(error); }
};

const verifyPayment = async (req, res, next) => {
    try {
        const { paymentIntentId, checkoutRequestId } = req.body;
        const query = { customer: String(req.user._id) };
        if (paymentIntentId) query.transactionId = paymentIntentId;
        if (checkoutRequestId) query.transactionId = checkoutRequestId;

        const payment = await Payment.findOne(query);
        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

        if (payment.status !== 'pending') {
            return res.json({ success: true, payment, message: 'Payment already processed.' });
        }

        if (payment.method === 'stripe') {
            const { status } = await stripeService.confirmPayment(payment.transactionId);
            const updated = await Payment.findOneAndUpdate(
                { _id: payment._id, status: 'pending' },
                { status: status === 'succeeded' ? 'completed' : 'failed' },
                { new: true }
            );
            if (!updated) return res.json({ success: true, payment, message: 'Payment already processed.' });

            if (updated.status === 'completed' && updated.metadata) {
                if (updated.metadata.topup) await creditWalletFromPayment(updated);
                if (updated.metadata.bookingData) await createBookingFromPayment(updated.customer, updated.metadata.bookingData, updated._id);
                if (updated.metadata.orderData) await createOrderFromPayment(updated.customer, updated.metadata.orderData, updated._id);
                if (updated.metadata.rideData) await createRideFromPayment(updated.customer, updated.metadata.rideData, updated._id);
            }
            return res.json({ success: true, payment: updated });
        }

        if (payment.method === 'mpesa') {
            const { resultCode } = await mpesaService.queryStkStatus(payment.transactionId);
            const updated = await Payment.findOneAndUpdate(
                { _id: payment._id, status: 'pending' },
                { status: String(resultCode) === '0' ? 'completed' : 'failed' },
                { new: true }
            );
            if (!updated) return res.json({ success: true, payment, message: 'Payment already processed.' });

            if (updated.status === 'completed' && updated.metadata) {
                if (updated.metadata.topup) await creditWalletFromPayment(updated);
                if (updated.metadata.bookingData) await createBookingFromPayment(updated.customer, updated.metadata.bookingData, updated._id);
                if (updated.metadata.orderData) await createOrderFromPayment(updated.customer, updated.metadata.orderData, updated._id);
                if (updated.metadata.rideData) await createRideFromPayment(updated.customer, updated.metadata.rideData, updated._id);
            }
            return res.json({ success: true, payment: updated });
        }

        res.json({ success: true, payment });
    } catch (error) { next(error); }
};

const mpesaCallback = async (req, res, next) => {
    try {
        const { Body } = req.body;

        if (!Body?.stkCallback) {
            logger.warn('M-Pesa callback: invalid payload');
            return res.json({ success: true });
        }

        const { CheckoutRequestID, ResultCode } = Body.stkCallback;

        if (!CheckoutRequestID) {
            logger.warn('M-Pesa callback: missing CheckoutRequestID');
            return res.json({ success: true });
        }

        const status = String(ResultCode) === '0' ? 'completed' : 'failed';

        const payment = await Payment.findOneAndUpdate(
            { transactionId: CheckoutRequestID, status: 'pending' },
            { status },
            { new: true }
        );

        if (!payment) {
            const existing = await Payment.findOne({ transactionId: CheckoutRequestID });
            if (existing) {
                logger.info(`M-Pesa callback retry ignored: ${CheckoutRequestID} (already ${existing.status})`);
            } else {
                logger.warn(`M-Pesa callback for unknown payment: ${CheckoutRequestID}`);
            }
            return res.json({ success: true });
        }

        if (status === 'completed' && payment.metadata) {
            if (payment.metadata.topup) {
                await creditWalletFromPayment(payment);
            } else {
                if (payment.metadata.bookingData) await createBookingFromPayment(payment.customer, payment.metadata.bookingData, payment._id);
                if (payment.metadata.orderData) await createOrderFromPayment(payment.customer, payment.metadata.orderData, payment._id);
                if (payment.metadata.rideData) await createRideFromPayment(payment.customer, payment.metadata.rideData, payment._id);

                const customer = await Customer.findById(payment.customer);
                if (customer) {
                    customerEmails.sendPaymentReceived(customer, { amount: payment.amount, method: 'M-Pesa', reference: payment.reference }).catch(e => logger.error('Email failed: ' + e.message));
                }
            }
        }

        res.json({ success: true });
    } catch (error) { next(error); }
};

const getPaymentHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const customerId = String(req.user._id);
        const payments = await Payment.find({ customer: customerId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
        const total = await Payment.countDocuments({ customer: customerId });
        res.json({ success: true, payments, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (error) { next(error); }
};

const getPayment = async (req, res, next) => {
    try {
        const customerId = String(req.user._id);
        const payment = await Payment.findOne({ _id: req.params.id, customer: customerId });
        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
        res.json({ success: true, payment });
    } catch (error) { next(error); }
};

module.exports = { getPaymentMethods, processPayment, verifyPayment, mpesaCallback, getPaymentHistory, getPayment };