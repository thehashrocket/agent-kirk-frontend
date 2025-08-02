"use client";
// Password Reset Page.
// URL : /reset-password/userId=[ID]
// This page allows users to reset their password by providing a new password.

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';


export default function ResetPasswordPage() {
    const router = useRouter();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userId, setUserId] = useState('');

    // userId is expected to be passed as a query parameter in the URL.

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('userId');
        if (id) {
            setUserId(id);
        } else {
            toast.error('User ID is required');
            router.push('/login'); // Redirect to login if no userId is provided
        }
    }, [router]);

    const handleResetPassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            const response = await fetch(`/api/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, newPassword }),
            });

            if (!response.ok) {
                throw new Error('Failed to reset password');
            }

            toast.success('Password reset successfully');
            router.push('/auth/signin');
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('An unknown error occurred');
            }
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Reset Password</CardTitle>
            </CardHeader>
            <CardContent>
                <Input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mb-4"
                />
                <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mb-4"
                />
                <Button
                    onClick={handleResetPassword}
                    disabled={!newPassword || !confirmPassword || !userId}
                    className="w-full"
                    variant="default"
                >
                    Reset Password
                </Button>
            </CardContent>
        </Card>
    );
}