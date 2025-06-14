import React, { useState } from 'react';
import PaystackPayment from './PaystackPayment';
import { useAuth } from '../contexts/AuthContext';

export default function ReservationForm() {
  const { user } = useAuth();
  const [form, setForm] = useState({ date: '', amount: 0 });
  const [reservationId, setReservationId] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reservation.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          email: user.email
        })
      });
      const text = await res.text();
      console.log('Response text:', text);
      const data = JSON.parse(text);
      if (data.success) {
        setReservationId(data.reservation_id);
      } else {
        alert('Failed to create reservation');
      }
    } catch (err) {
      console.error('Failed to parse JSON:', err);
    }
  };

  const handlePaymentSuccess = async (reference) => {
    try {
      const res = await fetch('/api/verify-payment.php', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, reservation_id: reservationId })
      });
      const data = await res.json();
      if (data.success) {
        setPaymentSuccess(true);
        alert('Payment successful and verified!');
      } else {
        alert('Payment verification failed.');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
    }
  };

  return (
    <div className="reservation-form-center">
      {!reservationId && (
        <form onSubmit={handleSubmit} className="reservation-form">
          <input
            name="date"
            type="date"
            onChange={handleChange}
            required
            className="reservation-input"
          />
          <input
            name="amount"
            type="number"
            placeholder="Amount"
            onChange={handleChange}
            required
            className="reservation-input"
          />
          <button type="submit" className="reservation-submit-btn">
            Reserve
          </button>
        </form>
      )}

      {reservationId && !paymentSuccess && (
        <PaystackPayment
          email={user.email}
          amount={form.amount}
          reservationId={reservationId}
          onSuccess={handlePaymentSuccess}
          className="paystack-payment"
        />
      )}

      {paymentSuccess && (
        <p className="reservation-success-message">
          Thank you! Your reservation and payment are confirmed.
        </p>
      )}
    </div>
  );
}
