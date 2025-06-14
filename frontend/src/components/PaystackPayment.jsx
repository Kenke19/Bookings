import React from 'react';
import Paystack from '@paystack/inline-js';

export default function PaystackPayment({ email, amount, reservationId, onSuccess }) {
    const publicKey = "pk_test_e90e6c587ebd25fe4222f01a142324ef07660033";

    const handlePayment = () => {
    const paystack = new Paystack();

        paystack.checkout({
            key: publicKey,
            email: email,
            amount: amount * 100, // Paystack expects amount in kobo
            metadata: {
                reservationId,
            },
        onSuccess(transaction) {
            onSuccess(transaction.reference);
        },
        onClose() {
            alert('Payment was not completed.');
        },
        });
    };

    return (
        <button
            onClick={handlePayment}
            style={{
                backgroundColor: 'blue',
                color: '#fff',
                padding: '12px 28px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'background 0.2s',
            }}
        >
            Pay Now
        </button>
    );
}
