import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface singleData {
    id: number;
    cartItemId?: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    customizable: boolean;
    weight?: string;
    customText?: string;
    filling?: string;
}

interface InitialType {
    cartItems: singleData[];
}

const initial_data: InitialType = {
    cartItems: [],
};

export const generateCartItemId = (item: {
    id: number;
    name: string;
    weight?: string;
    filling?: string;
    customText?: string;
}): string => {
    const normWeight = (item.weight || "std").trim().toLowerCase();
    const normFilling = (item.filling || "def").trim().toLowerCase();
    const normText = (item.customText || "").trim().toLowerCase();
    return `${item.id}_${normWeight}_${normFilling}_${normText}`;
};

export const cartSlice = createSlice({
    initialState: initial_data,
    name: 'cart',
    reducers: {
        addToCart: (state, action: PayloadAction<singleData>) => {
            const info = action.payload;
            const cartItemId = info.cartItemId || generateCartItemId(info);

            const existingItem = state.cartItems.find(
                (item) =>
                    (item.cartItemId && item.cartItemId === cartItemId) ||
                    (item.name === info.name &&
                     item.weight === info.weight &&
                     item.filling === info.filling &&
                     (item.customText || "") === (info.customText || ""))
            );

            if (existingItem) {
                existingItem.quantity += info.quantity || 1;
            } else {
                state.cartItems.push({
                    ...info,
                    cartItemId,
                    quantity: info.quantity || 1,
                });
            }
        },
        increaseHandler: (state, action: PayloadAction<{ cartItemId?: string; name: string; weight?: string }>) => {
            const { cartItemId, name, weight } = action.payload;
            const existingItem = state.cartItems.find((item) =>
                cartItemId ? item.cartItemId === cartItemId : item.name === name && (weight ? item.weight === weight : true)
            );
            if (existingItem) {
                existingItem.quantity += 1;
            }
        },
        minusHandler: (state, action: PayloadAction<{ cartItemId?: string; name: string; weight?: string }>) => {
            const { cartItemId, name, weight } = action.payload;
            const existingIndex = state.cartItems.findIndex((item) =>
                cartItemId ? item.cartItemId === cartItemId : item.name === name && (weight ? item.weight === weight : true)
            );
            if (existingIndex !== -1) {
                if (state.cartItems[existingIndex].quantity <= 1) {
                    state.cartItems.splice(existingIndex, 1);
                } else {
                    state.cartItems[existingIndex].quantity -= 1;
                }
            }
        },
        deleteHandler: (state, action: PayloadAction<{ cartItemId?: string; name: string; weight?: string }>) => {
            const { cartItemId, name, weight } = action.payload;
            state.cartItems = state.cartItems.filter((item) => {
                if (cartItemId) return item.cartItemId !== cartItemId;
                return !(item.name === name && (weight ? item.weight === weight : true));
            });
        },
        updateCustomText: (state, action: PayloadAction<{ cartItemId?: string; name: string; text: string }>) => {
            const { cartItemId, name, text } = action.payload;
            const item = state.cartItems.find((i) =>
                cartItemId ? i.cartItemId === cartItemId : i.name === name
            );
            if (item) {
                item.customText = text;
                item.cartItemId = generateCartItemId(item);
            }
        },
        clearCart: (state) => {
            state.cartItems = [];
        }
    }
});

export const { addToCart, increaseHandler, minusHandler, deleteHandler, updateCustomText, clearCart } = cartSlice.actions;
export default cartSlice.reducer;