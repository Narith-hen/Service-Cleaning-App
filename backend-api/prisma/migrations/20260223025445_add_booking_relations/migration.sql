-- AlterTable
ALTER TABLE `booking` MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'pending';

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_cleanerId_fkey` FOREIGN KEY (`cleanerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
