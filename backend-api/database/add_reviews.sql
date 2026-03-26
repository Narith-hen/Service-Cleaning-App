-- Add sample data for existing cleaners to show in top cleaners

-- First, let's see what cleaners we have
-- SELECT user_id, username, email FROM users WHERE role_id = 3;

-- Insert sample bookings for existing cleaners (assuming they have user_id 1 and 2)
-- Adjust the user_id values based on your actual cleaner IDs
INSERT IGNORE INTO bookings (booking_date, booking_status, total_price, payment_status, user_id, cleaner_id, service_id) VALUES
('2024-01-15 10:00:00', 'completed', 75.00, 'completed', 3, 1, 1),
('2024-01-16 14:00:00', 'completed', 120.00, 'completed', 4, 2, 2),
('2024-01-17 09:00:00', 'completed', 80.00, 'completed', 5, 1, 1),
('2024-01-18 11:00:00', 'completed', 95.00, 'completed', 3, 2, 2),
('2024-01-19 15:00:00', 'completed', 110.00, 'completed', 4, 1, 1),
('2024-01-20 08:00:00', 'completed', 85.00, 'completed', 5, 2, 2);

-- Insert sample reviews for the bookings
INSERT IGNORE INTO reviews (rating, comment, booking_id, user_id, cleaner_id) VALUES
(5, 'Excellent service! Very professional and thorough.', 1, 3, 1),
(4, 'Good job, arrived on time and did quality work.', 2, 4, 2),
(5, 'Outstanding! My house has never looked better.', 3, 5, 1),
(4, 'Very satisfied with the cleaning service.', 4, 3, 2),
(5, 'Professional and friendly. Highly recommend!', 5, 4, 1),
(4, 'Reliable and trustworthy cleaner.', 6, 5, 2);
