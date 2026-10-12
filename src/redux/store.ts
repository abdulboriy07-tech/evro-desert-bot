'use client'
import {configureStore} from "@reduxjs/toolkit";
import   cartSlice  from "./features/cart/cart";

export const store = configureStore({
    reducer : {
        cart : cartSlice,
    },
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;