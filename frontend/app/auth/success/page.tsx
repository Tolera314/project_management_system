'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUser } from '../../context/UserContext';

function AuthSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setUser } = useUser();

    useEffect(() => {
        const token = searchParams.get('token');
        const userStr = searchParams.get('user');

        if (token && userStr) {
            try {
                const user = JSON.parse(decodeURIComponent(userStr));

                // Use context login or manual storage
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                // Optionally dispatch to context if available
                setUser(user);

                // If no workspace, the dashboard will open the modal
                router.push('/dashboard');
            } catch (e) {
                console.error('Failed to parse user data', e);
                router.push('/login?error=Authentication error');
            }
        } else {
            router.push('/login?error=Invalid authentication data');
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-[#070514] flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white">Authenticating...</h2>
                <p className="text-slate-400">Please wait while we log you in.</p>
            </div>
        </div>
    );
}

export default function AuthSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#070514]" />}>
            <AuthSuccessContent />
        </Suspense>
    );
}
