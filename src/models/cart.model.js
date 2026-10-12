import {model, models, Schema} from 'mongoose'
import { stringify } from 'querystring';

const OrderSchema = new Schema({
    username : {
        type : String,
        required : true,
    },
    Email : {
        type : String,
        required: true
    },
    Address : {
        type : String,
        required : true,
    },
    cartProducts : {
        type : Object,
        required : true,
    },
    paid : {
        type : Boolean,
        default : false,
        required : true,
    },
    Delivered : {
        type : Boolean,
        default : false,
        required : true,
    },
}, {timestamps : true});

export const Order = models?.Order || model('Order', OrderSchema);

