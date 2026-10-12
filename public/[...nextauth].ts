import nextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'
const authOptions : NextAuthOptions = {
    providers : [
        GoogleProvider({
            clientId : process.env.NEXT_GOOGLE_CLIENT_ID as string,
            clientSecret : process.env.NEXT_GOOGLE_CLIENT_SECRET as string,
        })
    ]
}

const handler = nextAuth(authOptions);

export {handler as GET, handler as POST};