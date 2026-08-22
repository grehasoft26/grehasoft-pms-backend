-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `username` VARCHAR(100) NULL,
    `phone` VARCHAR(50) NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `avatarUrl` VARCHAR(255) NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED', 'ARCHIVED') NOT NULL DEFAULT 'PENDING',
    `roleId` CHAR(36) NULL,
    `departmentId` CHAR(36) NULL,
    `designationId` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `address` TEXT NULL,
    `salaryMonthly` DECIMAL(10, 2) NULL,
    `joiningDate` DATE NULL,
    `version` INTEGER NOT NULL DEFAULT 0,
    `backupCodes` JSON NULL,
    `emailVerificationToken` VARCHAR(255) NULL,
    `emailVerifiedAt` TIMESTAMP(0) NULL,
    `failedLoginAttempts` INTEGER NOT NULL DEFAULT 0,
    `lastLoginAt` TIMESTAMP(0) NULL,
    `lastPasswordChangedAt` TIMESTAMP(0) NULL,
    `lockedUntil` TIMESTAMP(0) NULL,
    `mfaEnabled` BOOLEAN NOT NULL DEFAULT false,
    `mfaSecret` VARCHAR(255) NULL,
    `isTrackingEnabled` BOOLEAN NOT NULL DEFAULT true,
    `companyId` CHAR(36) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_username_key`(`username`),
    INDEX `users_status_idx`(`status`),
    INDEX `users_departmentId_fkey`(`departmentId`),
    INDEX `users_designationId_fkey`(`designationId`),
    INDEX `users_roleId_fkey`(`roleId`),
    INDEX `users_companyId_fkey`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_preferences` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `theme` VARCHAR(20) NOT NULL DEFAULT 'light',
    `language` VARCHAR(10) NOT NULL DEFAULT 'en',
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    `notificationsEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `user_preferences_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `parentId` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `roles_name_key`(`name`),
    INDEX `roles_parentId_fkey`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permission_groups` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `permission_groups_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permission_categories` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `groupId` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `permission_categories_name_key`(`name`),
    INDEX `permission_categories_groupId_fkey`(`groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `categoryId` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `permissions_name_key`(`name`),
    UNIQUE INDEX `permissions_code_key`(`code`),
    INDEX `permissions_categoryId_fkey`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isRoot` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `parentId` CHAR(36) NULL,
    `managerId` CHAR(36) NULL,
    `deputyManagerId` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `departments_name_key`(`name`),
    UNIQUE INDEX `departments_code_key`(`code`),
    INDEX `departments_deputyManagerId_fkey`(`deputyManagerId`),
    INDEX `departments_managerId_fkey`(`managerId`),
    INDEX `departments_parentId_fkey`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teams` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `leadId` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `teams_name_key`(`name`),
    UNIQUE INDEX `teams_code_key`(`code`),
    INDEX `teams_leadId_fkey`(`leadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_teams` (
    `userId` CHAR(36) NOT NULL,
    `teamId` CHAR(36) NOT NULL,
    `roleInTeam` VARCHAR(50) NOT NULL DEFAULT 'member',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `user_teams_teamId_fkey`(`teamId`),
    PRIMARY KEY (`userId`, `teamId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `designations` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `departmentId` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `designations_name_key`(`name`),
    UNIQUE INDEX `designations_code_key`(`code`),
    INDEX `designations_departmentId_fkey`(`departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_sessions` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `refreshTokenHash` VARCHAR(255) NOT NULL,
    `deviceName` VARCHAR(100) NULL,
    `deviceType` VARCHAR(50) NULL,
    `browser` VARCHAR(100) NULL,
    `operatingSystem` VARCHAR(100) NULL,
    `ipAddress` VARCHAR(50) NULL,
    `userAgent` VARCHAR(255) NULL,
    `lastActivityAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `revokedAt` TIMESTAMP(0) NULL,
    `expiresAt` TIMESTAMP(0) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `user_sessions_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_histories` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `password_histories_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `tokenHash` VARCHAR(255) NOT NULL,
    `expiresAt` TIMESTAMP(0) NOT NULL,
    `usedAt` TIMESTAMP(0) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `password_reset_tokens_tokenHash_key`(`tokenHash`),
    INDEX `password_reset_tokens_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_categories` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `client_categories_name_key`(`name`),
    UNIQUE INDEX `client_categories_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clients` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `status` ENUM('PROSPECT', 'ACTIVE', 'INACTIVE', 'ON_HOLD', 'ARCHIVED') NOT NULL DEFAULT 'PROSPECT',
    `industry` VARCHAR(100) NULL,
    `companyType` VARCHAR(100) NULL,
    `website` VARCHAR(255) NULL,
    `gstVatNumber` VARCHAR(50) NULL,
    `taxNumber` VARCHAR(50) NULL,
    `registrationNumber` VARCHAR(100) NULL,
    `profileLogo` VARCHAR(255) NULL,
    `remarks` TEXT NULL,
    `categoryId` CHAR(36) NOT NULL,
    `primaryContactId` CHAR(36) NULL,
    `primaryAddressId` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `clients_code_key`(`code`),
    INDEX `clients_status_idx`(`status`),
    INDEX `clients_categoryId_idx`(`categoryId`),
    INDEX `clients_primaryAddressId_fkey`(`primaryAddressId`),
    INDEX `clients_primaryContactId_fkey`(`primaryContactId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_contacts` (
    `id` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `designation` VARCHAR(100) NULL,
    `email` VARCHAR(255) NOT NULL,
    `mobile` VARCHAR(50) NULL,
    `officePhone` VARCHAR(50) NULL,
    `whatsApp` VARCHAR(50) NULL,
    `birthday` DATE NULL,
    `notes` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `linkedIn` VARCHAR(255) NULL,
    `preferredContactMethod` VARCHAR(50) NULL,
    `preferredContactTime` VARCHAR(100) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `client_contacts_clientId_idx`(`clientId`),
    INDEX `client_contacts_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_addresses` (
    `id` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NOT NULL,
    `type` ENUM('BILLING', 'SHIPPING', 'HEAD_OFFICE', 'BRANCH_OFFICE', 'OTHER') NOT NULL DEFAULT 'BILLING',
    `addressLine1` VARCHAR(255) NOT NULL,
    `addressLine2` VARCHAR(255) NULL,
    `city` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100) NULL,
    `postalCode` VARCHAR(20) NOT NULL,
    `country` VARCHAR(100) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `googleMapsUrl` VARCHAR(512) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `client_addresses_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_documents` (
    `id` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `fileKey` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(100) NULL,
    `fileSize` INTEGER NULL,
    `documentVersion` VARCHAR(20) NOT NULL DEFAULT '1.0',
    `category` ENUM('CONTRACT', 'NDA', 'PURCHASE_ORDER', 'INVOICE', 'CERTIFICATE', 'LICENSE', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `expiryDate` DATE NULL,
    `reminderDate` DATE NULL,
    `uploadDate` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `uploadedBy` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `client_documents_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_contracts` (
    `id` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NOT NULL,
    `contractNumber` VARCHAR(100) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `renewalDate` DATE NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED') NOT NULL DEFAULT 'DRAFT',
    `renewalReminder` BOOLEAN NOT NULL DEFAULT false,
    `documentReference` VARCHAR(255) NULL,
    `contractValue` DECIMAL(15, 2) NULL,
    `currency` VARCHAR(10) NULL DEFAULT 'INR',
    `autoRenewal` BOOLEAN NOT NULL DEFAULT false,
    `noticePeriod` INTEGER NULL,
    `renewalOwnerId` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `client_contracts_contractNumber_key`(`contractNumber`),
    INDEX `client_contracts_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_notes` (
    `id` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NULL,
    `content` TEXT NOT NULL,
    `type` ENUM('INTERNAL', 'FOLLOW_UP') NOT NULL DEFAULT 'INTERNAL',
    `attachmentsReference` JSON NULL,
    `pinned` BOOLEAN NOT NULL DEFAULT false,
    `private` BOOLEAN NOT NULL DEFAULT false,
    `mentions` JSON NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `client_notes_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_tags` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `client_tags_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_timelines` (
    `id` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NOT NULL,
    `event` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `metadata` JSON NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdBy` CHAR(36) NULL,

    INDEX `client_timelines_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_sources` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `lead_sources_name_key`(`name`),
    UNIQUE INDEX `lead_sources_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_statuses` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `lead_statuses_name_key`(`name`),
    UNIQUE INDEX `lead_statuses_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` CHAR(36) NOT NULL,
    `companyName` VARCHAR(255) NOT NULL,
    `contactName` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `website` VARCHAR(255) NULL,
    `gstNumber` VARCHAR(50) NULL,
    `expectedBudget` DECIMAL(15, 2) NULL,
    `expectedClosingDate` DATE NULL,
    `remarks` TEXT NULL,
    `leadScore` INTEGER NOT NULL DEFAULT 0,
    `leadPriority` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM',
    `leadTemperature` ENUM('COLD', 'WARM', 'HOT') NOT NULL DEFAULT 'WARM',
    `sourceId` CHAR(36) NOT NULL,
    `statusId` CHAR(36) NOT NULL,
    `ownerId` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `enquiryFrom` VARCHAR(100) NULL,
    `howContacted` VARCHAR(100) NULL,
    `contactedPerson` VARCHAR(255) NULL,
    `referencePerson` VARCHAR(255) NULL,
    `serviceRequired` JSON NULL,
    `clientRequirements` TEXT NULL,
    `detailsGiven` TEXT NULL,
    `competitorWebsites` TEXT NULL,
    `documentsGiven` JSON NULL,
    `loginCredentials` JSON NULL,
    `addressLine1` VARCHAR(255) NULL,
    `addressLine2` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL,
    `postalCode` VARCHAR(20) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `leads_statusId_idx`(`statusId`),
    INDEX `leads_sourceId_idx`(`sourceId`),
    INDEX `leads_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_activities` (
    `id` CHAR(36) NOT NULL,
    `leadId` CHAR(36) NOT NULL,
    `type` ENUM('PHONE_CALL', 'MEETING', 'EMAIL', 'WHATSAPP', 'SMS', 'TASK', 'REMINDER', 'NOTE') NOT NULL DEFAULT 'NOTE',
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `activityDate` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdBy` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `lead_activities_leadId_idx`(`leadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_assignments` (
    `id` CHAR(36) NOT NULL,
    `leadId` CHAR(36) NOT NULL,
    `assigneeId` CHAR(36) NOT NULL,
    `assignedById` CHAR(36) NOT NULL,
    `assignedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `notes` TEXT NULL,
    `transferFromId` CHAR(36) NULL,

    INDEX `lead_assignments_leadId_idx`(`leadId`),
    INDEX `lead_assignments_assigneeId_idx`(`assigneeId`),
    INDEX `lead_assignments_assignedById_fkey`(`assignedById`),
    INDEX `lead_assignments_transferFromId_fkey`(`transferFromId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_timelines` (
    `id` CHAR(36) NOT NULL,
    `leadId` CHAR(36) NOT NULL,
    `event` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `metadata` JSON NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdBy` CHAR(36) NULL,

    INDEX `lead_timelines_leadId_idx`(`leadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pipelines` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `pipelines_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pipeline_stages` (
    `id` CHAR(36) NOT NULL,
    `pipelineId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `probability` INTEGER NOT NULL DEFAULT 10,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `pipeline_stages_pipelineId_code_key`(`pipelineId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `opportunities` (
    `id` CHAR(36) NOT NULL,
    `leadId` CHAR(36) NULL,
    `name` VARCHAR(255) NOT NULL,
    `value` DECIMAL(15, 2) NOT NULL,
    `probability` INTEGER NOT NULL DEFAULT 10,
    `expectedCloseDate` DATE NOT NULL,
    `stageId` CHAR(36) NOT NULL,
    `competitors` TEXT NULL,
    `winReason` TEXT NULL,
    `lossReason` TEXT NULL,
    `ownerId` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `opportunities_stageId_idx`(`stageId`),
    INDEX `opportunities_ownerId_idx`(`ownerId`),
    INDEX `opportunities_clientId_idx`(`clientId`),
    INDEX `opportunities_leadId_fkey`(`leadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `opportunity_items` (
    `id` CHAR(36) NOT NULL,
    `opportunityId` CHAR(36) NOT NULL,
    `productName` VARCHAR(255) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `price` DECIMAL(15, 2) NOT NULL,
    `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `tax` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(15, 2) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,

    INDEX `opportunity_items_opportunityId_idx`(`opportunityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `opportunity_timelines` (
    `id` CHAR(36) NOT NULL,
    `opportunityId` CHAR(36) NOT NULL,
    `event` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `metadata` JSON NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdBy` CHAR(36) NULL,

    INDEX `opportunity_timelines_opportunityId_idx`(`opportunityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proposal_templates` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `proposal_templates_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proposals` (
    `id` CHAR(36) NOT NULL,
    `opportunityId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `proposalNumber` VARCHAR(100) NOT NULL,
    `status` ENUM('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `discountTotal` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `taxTotal` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
    `validUntil` DATE NOT NULL,
    `templateId` CHAR(36) NULL,
    `pdfFileKey` VARCHAR(255) NULL,
    `currentVersion` INTEGER NOT NULL DEFAULT 1,
    `pdfGeneratedAt` TIMESTAMP(0) NULL,
    `pdfGeneratedBy` CHAR(36) NULL,
    `pdfVersion` INTEGER NULL,
    `pdfFileSize` INTEGER NULL,
    `pdfChecksum` VARCHAR(255) NULL,
    `builderConfig` JSON NULL,
    `isConverted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `proposals_proposalNumber_key`(`proposalNumber`),
    INDEX `proposals_opportunityId_idx`(`opportunityId`),
    INDEX `proposals_pdfGeneratedBy_fkey`(`pdfGeneratedBy`),
    INDEX `proposals_templateId_fkey`(`templateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proposal_items` (
    `id` CHAR(36) NOT NULL,
    `proposalId` CHAR(36) NOT NULL,
    `productName` VARCHAR(255) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `price` DECIMAL(15, 2) NOT NULL,
    `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `tax` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(15, 2) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `proposal_items_proposalId_idx`(`proposalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proposal_versions` (
    `id` CHAR(36) NOT NULL,
    `proposalId` CHAR(36) NOT NULL,
    `versionNumber` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `discountTotal` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `taxTotal` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `content` TEXT NOT NULL,
    `pdfFileKey` VARCHAR(255) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdBy` CHAR(36) NOT NULL,

    INDEX `proposal_versions_proposalId_idx`(`proposalId`),
    INDEX `proposal_versions_createdBy_fkey`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proposal_approvals` (
    `id` CHAR(36) NOT NULL,
    `proposalId` CHAR(36) NOT NULL,
    `approverId` CHAR(36) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `comments` TEXT NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `reviewedAt` TIMESTAMP(0) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `proposal_approvals_proposalId_idx`(`proposalId`),
    INDEX `proposal_approvals_approverId_fkey`(`approverId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_categories` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `project_categories_name_key`(`name`),
    UNIQUE INDEX `project_categories_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('FIXED_PRICE', 'TIME_AND_MATERIAL', 'RETAINER', 'MAINTENANCE', 'INTERNAL', 'RD') NOT NULL DEFAULT 'FIXED_PRICE',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'PLANNING',
    `healthStatus` ENUM('GREEN', 'AMBER', 'RED') NOT NULL DEFAULT 'GREEN',
    `estimatedCost` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `actualCost` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `remainingBudget` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `budgetVariance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `estimatedRevenue` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `estimatedHours` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `actualStartDate` DATE NULL,
    `actualEndDate` DATE NULL,
    `completionPercentage` INTEGER NOT NULL DEFAULT 0,
    `colorLabel` VARCHAR(50) NULL,
    `categoryId` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NULL,
    `proposalId` CHAR(36) NULL,
    `managerId` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `projects_code_key`(`code`),
    INDEX `projects_categoryId_idx`(`categoryId`),
    INDEX `projects_clientId_idx`(`clientId`),
    INDEX `projects_proposalId_idx`(`proposalId`),
    INDEX `projects_managerId_idx`(`managerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_tags` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `project_tags_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_templates` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('FIXED_PRICE', 'TIME_AND_MATERIAL', 'RETAINER', 'MAINTENANCE', 'INTERNAL', 'RD') NOT NULL DEFAULT 'FIXED_PRICE',
    `estimatedHours` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `estimatedTimelineDays` INTEGER NOT NULL DEFAULT 30,
    `config` JSON NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `project_templates_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_phases` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `startDate` DATE NULL,
    `endDate` DATE NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `project_phases_projectId_code_key`(`projectId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_milestones` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `phaseId` CHAR(36) NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `dueDate` DATE NOT NULL,
    `completionPercentage` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED') NOT NULL DEFAULT 'PENDING',
    `ownerId` CHAR(36) NOT NULL,
    `estimatedHours` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `actualHours` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `project_milestones_projectId_idx`(`projectId`),
    INDEX `project_milestones_phaseId_idx`(`phaseId`),
    INDEX `project_milestones_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_members` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `role` VARCHAR(100) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `project_members_userId_fkey`(`userId`),
    UNIQUE INDEX `project_members_projectId_userId_role_key`(`projectId`, `userId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_resources` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `allocationPercentage` INTEGER NOT NULL DEFAULT 100,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `role` VARCHAR(100) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `project_resources_projectId_idx`(`projectId`),
    INDEX `project_resources_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_dependencies` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NULL,
    `dependsOnProjectId` CHAR(36) NULL,
    `milestoneId` CHAR(36) NULL,
    `dependsOnMilestoneId` CHAR(36) NULL,
    `type` ENUM('FS', 'SS', 'FF', 'SF') NOT NULL DEFAULT 'FS',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `project_dependencies_projectId_idx`(`projectId`),
    INDEX `project_dependencies_dependsOnProjectId_idx`(`dependsOnProjectId`),
    INDEX `project_dependencies_milestoneId_idx`(`milestoneId`),
    INDEX `project_dependencies_dependsOnMilestoneId_idx`(`dependsOnMilestoneId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_risks` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `probability` INTEGER NOT NULL DEFAULT 1,
    `impact` INTEGER NOT NULL DEFAULT 1,
    `riskScore` INTEGER NOT NULL DEFAULT 1,
    `mitigationPlan` TEXT NULL,
    `ownerId` CHAR(36) NULL,
    `status` ENUM('IDENTIFIED', 'MITIGATED', 'OCCURRED', 'CLOSED') NOT NULL DEFAULT 'IDENTIFIED',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `project_risks_projectId_idx`(`projectId`),
    INDEX `project_risks_ownerId_fkey`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_issues` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('BUG', 'CHANGE_REQUEST', 'BLOCKER', 'DEPENDENCY', 'CLIENT_ISSUE') NOT NULL DEFAULT 'BUG',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `assignedToId` CHAR(36) NULL,
    `resolution` TEXT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `project_issues_projectId_idx`(`projectId`),
    INDEX `project_issues_assignedToId_fkey`(`assignedToId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_documents` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `fileKey` VARCHAR(255) NOT NULL,
    `category` ENUM('REQUIREMENTS', 'DESIGN', 'CONTRACT', 'WIREFRAME', 'MEETING_NOTES', 'DEPLOYMENT', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `uploadedBy` CHAR(36) NOT NULL,
    `uploadDate` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `deletedBy` CHAR(36) NULL,

    INDEX `project_documents_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_timelines` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `event` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `metadata` JSON NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdBy` CHAR(36) NULL,

    INDEX `project_timelines_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sprints` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `status` ENUM('PLANNING', 'ACTIVE', 'COMPLETED') NOT NULL DEFAULT 'PLANNING',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `sprints_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sprint_goals` (
    `id` CHAR(36) NOT NULL,
    `sprintId` CHAR(36) NOT NULL,
    `goal` TEXT NOT NULL,
    `isAchieved` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `sprint_goals_sprintId_idx`(`sprintId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_types` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `icon` VARCHAR(100) NULL,
    `color` VARCHAR(50) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `task_types_name_key`(`name`),
    UNIQUE INDEX `task_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_statuses` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `color` VARCHAR(50) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `task_statuses_name_key`(`name`),
    UNIQUE INDEX `task_statuses_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_priorities` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `color` VARCHAR(50) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `task_priorities_name_key`(`name`),
    UNIQUE INDEX `task_priorities_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_labels` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `color` VARCHAR(50) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `task_labels_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tasks` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `milestoneId` CHAR(36) NULL,
    `sprintId` CHAR(36) NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `typeId` CHAR(36) NOT NULL,
    `statusId` CHAR(36) NOT NULL,
    `priorityId` CHAR(36) NOT NULL,
    `dueDate` DATE NULL,
    `startDate` DATE NULL,
    `estimatedHours` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `actualHours` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `remainingHours` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `storyPoints` INTEGER NULL,
    `progressPercentage` INTEGER NOT NULL DEFAULT 0,
    `position` INTEGER NOT NULL DEFAULT 0,
    `isRecurring` BOOLEAN NOT NULL DEFAULT false,
    `recurrenceRule` VARCHAR(255) NULL,
    `cronExpression` VARCHAR(255) NULL,
    `nextRecurrenceDate` TIMESTAMP(0) NULL,
    `parentTaskId` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `tasks_code_key`(`code`),
    INDEX `tasks_projectId_idx`(`projectId`),
    INDEX `tasks_milestoneId_idx`(`milestoneId`),
    INDEX `tasks_sprintId_idx`(`sprintId`),
    INDEX `tasks_typeId_idx`(`typeId`),
    INDEX `tasks_statusId_idx`(`statusId`),
    INDEX `tasks_priorityId_idx`(`priorityId`),
    INDEX `tasks_parentTaskId_idx`(`parentTaskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_checklists` (
    `id` CHAR(36) NOT NULL,
    `taskId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `task_checklists_taskId_idx`(`taskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_checklist_items` (
    `id` CHAR(36) NOT NULL,
    `checklistId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `task_checklist_items_checklistId_idx`(`checklistId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_comments` (
    `id` CHAR(36) NOT NULL,
    `taskId` CHAR(36) NOT NULL,
    `content` TEXT NOT NULL,
    `authorId` CHAR(36) NOT NULL,
    `parentCommentId` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,

    INDEX `task_comments_taskId_idx`(`taskId`),
    INDEX `task_comments_authorId_idx`(`authorId`),
    INDEX `task_comments_parentCommentId_idx`(`parentCommentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_attachments` (
    `id` CHAR(36) NOT NULL,
    `taskId` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `fileKey` VARCHAR(255) NOT NULL,
    `fileSize` INTEGER NULL,
    `mimeType` VARCHAR(100) NULL,
    `uploadedById` CHAR(36) NOT NULL,
    `uploadedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `task_attachments_taskId_idx`(`taskId`),
    INDEX `task_attachments_uploadedById_idx`(`uploadedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_watchers` (
    `id` CHAR(36) NOT NULL,
    `taskId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `task_watchers_userId_fkey`(`userId`),
    UNIQUE INDEX `task_watchers_taskId_userId_key`(`taskId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_dependencies` (
    `id` CHAR(36) NOT NULL,
    `taskId` CHAR(36) NOT NULL,
    `dependsOnTaskId` CHAR(36) NOT NULL,
    `type` ENUM('FS', 'SS', 'FF', 'SF') NOT NULL DEFAULT 'FS',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `task_dependencies_dependsOnTaskId_fkey`(`dependsOnTaskId`),
    UNIQUE INDEX `task_dependencies_taskId_dependsOnTaskId_key`(`taskId`, `dependsOnTaskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_timelines` (
    `id` CHAR(36) NOT NULL,
    `taskId` CHAR(36) NOT NULL,
    `event` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `metadata` JSON NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdBy` CHAR(36) NULL,

    INDEX `task_timelines_taskId_idx`(`taskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_sessions` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `startTime` TIMESTAMP(0) NOT NULL,
    `endTime` TIMESTAMP(0) NULL,
    `totalDuration` INTEGER NOT NULL DEFAULT 0,
    `activeTime` INTEGER NOT NULL DEFAULT 0,
    `idleTime` INTEGER NOT NULL DEFAULT 0,
    `breakTime` INTEGER NOT NULL DEFAULT 0,
    `productiveTime` INTEGER NOT NULL DEFAULT 0,
    `unproductiveTime` INTEGER NOT NULL DEFAULT 0,
    `attendanceStatus` ENUM('CHECK_IN', 'CHECK_OUT', 'LATE', 'EARLY_LEAVE', 'HOLIDAY', 'WEEKEND', 'ABSENT', 'PRESENT', 'HALF_DAY', 'REMOTE', 'WFH') NOT NULL DEFAULT 'CHECK_IN',
    `ipAddress` VARCHAR(50) NULL,
    `userAgent` VARCHAR(255) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `work_sessions_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_timers` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `taskId` CHAR(36) NOT NULL,
    `startTime` TIMESTAMP(0) NOT NULL,
    `pausedAt` TIMESTAMP(0) NULL,
    `accumulatedTime` INTEGER NOT NULL DEFAULT 0,
    `isRunning` BOOLEAN NOT NULL DEFAULT true,
    `description` TEXT NULL,
    `lastHeartbeat` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `recoveryFlag` BOOLEAN NOT NULL DEFAULT false,
    `resumeAfterRestart` BOOLEAN NOT NULL DEFAULT true,

    INDEX `task_timers_userId_idx`(`userId`),
    INDEX `task_timers_taskId_idx`(`taskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `time_entries` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `taskId` CHAR(36) NULL,
    `projectId` CHAR(36) NULL,
    `startTime` TIMESTAMP(0) NOT NULL,
    `endTime` TIMESTAMP(0) NOT NULL,
    `duration` INTEGER NOT NULL DEFAULT 0,
    `description` TEXT NULL,
    `billable` BOOLEAN NOT NULL DEFAULT true,
    `category` ENUM('DEVELOPMENT', 'MEETING', 'RESEARCH', 'TRAINING', 'SUPPORT', 'INTERNAL', 'SALES', 'ADMINISTRATION', 'DESIGN', 'TESTING', 'PLANNING', 'OTHER') NOT NULL DEFAULT 'DEVELOPMENT',
    `isManual` BOOLEAN NOT NULL DEFAULT false,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `dailyTimesheetId` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `billed` BOOLEAN NOT NULL DEFAULT false,

    INDEX `time_entries_userId_idx`(`userId`),
    INDEX `time_entries_taskId_idx`(`taskId`),
    INDEX `time_entries_projectId_idx`(`projectId`),
    INDEX `time_entries_dailyTimesheetId_idx`(`dailyTimesheetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `break_sessions` (
    `id` CHAR(36) NOT NULL,
    `workSessionId` CHAR(36) NOT NULL,
    `type` ENUM('LUNCH', 'TEA', 'PERSONAL', 'MEETING', 'CUSTOM') NOT NULL DEFAULT 'LUNCH',
    `startTime` TIMESTAMP(0) NOT NULL,
    `endTime` TIMESTAMP(0) NULL,
    `duration` INTEGER NOT NULL DEFAULT 0,
    `reason` VARCHAR(255) NULL,

    INDEX `break_sessions_workSessionId_idx`(`workSessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `idle_sessions` (
    `id` CHAR(36) NOT NULL,
    `workSessionId` CHAR(36) NOT NULL,
    `type` ENUM('SYSTEM_LOCK', 'SCREEN_SAVER', 'SLEEP', 'SHUTDOWN', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `startTime` TIMESTAMP(0) NOT NULL,
    `endTime` TIMESTAMP(0) NULL,
    `duration` INTEGER NOT NULL DEFAULT 0,
    `reason` VARCHAR(255) NULL,

    INDEX `idle_sessions_workSessionId_idx`(`workSessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `screenshots` (
    `id` CHAR(36) NOT NULL,
    `workSessionId` CHAR(36) NOT NULL,
    `filePath` VARCHAR(255) NOT NULL,
    `timestamp` TIMESTAMP(0) NOT NULL,
    `resolution` VARCHAR(50) NULL,
    `monitor` INTEGER NOT NULL DEFAULT 1,
    `isBlurred` BOOLEAN NOT NULL DEFAULT true,
    `isCompressed` BOOLEAN NOT NULL DEFAULT false,
    `checksum` VARCHAR(100) NULL,
    `retentionDays` INTEGER NOT NULL DEFAULT 30,

    INDEX `screenshots_workSessionId_idx`(`workSessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` CHAR(36) NOT NULL,
    `workSessionId` CHAR(36) NOT NULL,
    `timestamp` TIMESTAMP(0) NOT NULL,
    `keyboardCount` INTEGER NOT NULL DEFAULT 0,
    `mouseCount` INTEGER NOT NULL DEFAULT 0,
    `clicksCount` INTEGER NOT NULL DEFAULT 0,
    `scrollsCount` INTEGER NOT NULL DEFAULT 0,
    `activityScore` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,

    INDEX `activity_logs_workSessionId_idx`(`workSessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_usages` (
    `id` CHAR(36) NOT NULL,
    `workSessionId` CHAR(36) NOT NULL,
    `appName` VARCHAR(255) NOT NULL,
    `duration` INTEGER NOT NULL DEFAULT 0,
    `category` VARCHAR(50) NULL,

    INDEX `application_usages_workSessionId_idx`(`workSessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `website_usages` (
    `id` CHAR(36) NOT NULL,
    `workSessionId` CHAR(36) NOT NULL,
    `domain` VARCHAR(255) NOT NULL,
    `duration` INTEGER NOT NULL DEFAULT 0,
    `category` VARCHAR(50) NULL,

    INDEX `website_usages_workSessionId_idx`(`workSessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_timesheets` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `totalHours` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `billableHours` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('DRAFT', 'SUBMITTED', 'MANAGER_APPROVED', 'FINANCE_APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `daily_timesheets_userId_date_key`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `weekly_timesheets` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `totalHours` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('DRAFT', 'SUBMITTED', 'MANAGER_APPROVED', 'FINANCE_APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `weekly_timesheets_userId_startDate_key`(`userId`, `startDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timesheet_approvals` (
    `id` CHAR(36) NOT NULL,
    `weeklyTimesheetId` CHAR(36) NOT NULL,
    `approverId` CHAR(36) NOT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'MANAGER_APPROVED', 'FINANCE_APPROVED', 'REJECTED') NOT NULL DEFAULT 'SUBMITTED',
    `comments` TEXT NULL,
    `actionedAt` TIMESTAMP(0) NULL,

    INDEX `timesheet_approvals_weeklyTimesheetId_idx`(`weeklyTimesheetId`),
    INDEX `timesheet_approvals_approverId_idx`(`approverId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productivity_scores` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `score` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `focusTime` INTEGER NOT NULL DEFAULT 0,
    `deepWorkTime` INTEGER NOT NULL DEFAULT 0,
    `contextSwitches` INTEGER NOT NULL DEFAULT 0,
    `interruptions` INTEGER NOT NULL DEFAULT 0,
    `productivityPercentage` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,

    UNIQUE INDEX `productivity_scores_userId_date_key`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utilization_reports` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NULL,
    `projectId` CHAR(36) NULL,
    `teamId` CHAR(36) NULL,
    `departmentId` CHAR(36) NULL,
    `date` DATE NOT NULL,
    `billablePercentage` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `nonBillablePercentage` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,

    INDEX `utilization_reports_userId_idx`(`userId`),
    INDEX `utilization_reports_projectId_idx`(`projectId`),
    INDEX `utilization_reports_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `currencies` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `symbol` VARCHAR(10) NOT NULL,
    `exchangeRate` DECIMAL(15, 6) NOT NULL DEFAULT 1.000000,
    `isBase` BOOLEAN NOT NULL DEFAULT false,
    `conversionDate` TIMESTAMP(0) NULL,

    UNIQUE INDEX `currencies_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `taxes` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `rate` DECIMAL(5, 2) NOT NULL,
    `type` ENUM('GST', 'CGST', 'SGST', 'IGST', 'VAT', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM',
    `code` VARCHAR(50) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `taxes_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendors` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `companyName` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `taxNumber` VARCHAR(50) NULL,
    `pan` VARCHAR(50) NULL,
    `gst` VARCHAR(50) NULL,
    `bankDetails` TEXT NULL,
    `upi` VARCHAR(100) NULL,
    `paymentTerms` VARCHAR(100) NULL,
    `outstandingBalance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense_categories` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `expense_categories_name_key`(`name`),
    UNIQUE INDEX `expense_categories_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` CHAR(36) NOT NULL,
    `categoryId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NULL,
    `userId` CHAR(36) NOT NULL,
    `vendorId` CHAR(36) NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `currencyId` CHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `description` TEXT NULL,
    `receiptPath` VARCHAR(255) NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'MANAGER_APPROVED', 'FINANCE_APPROVED', 'PAID', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `expenses_categoryId_idx`(`categoryId`),
    INDEX `expenses_projectId_idx`(`projectId`),
    INDEX `expenses_userId_idx`(`userId`),
    INDEX `expenses_vendorId_idx`(`vendorId`),
    INDEX `expenses_currencyId_fkey`(`currencyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchases` (
    `id` CHAR(36) NOT NULL,
    `purchaseNumber` VARCHAR(50) NOT NULL,
    `vendorId` CHAR(36) NOT NULL,
    `purchaseDate` DATE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `subtotal` DECIMAL(15, 2) NOT NULL,
    `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `tax` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(15, 2) NOT NULL,
    `currencyId` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `purchases_purchaseNumber_key`(`purchaseNumber`),
    INDEX `purchases_vendorId_idx`(`vendorId`),
    INDEX `purchases_currencyId_fkey`(`currencyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_items` (
    `id` CHAR(36) NOT NULL,
    `purchaseId` CHAR(36) NOT NULL,
    `productName` VARCHAR(255) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `rate` DECIMAL(15, 2) NOT NULL,
    `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `tax` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(15, 2) NOT NULL,

    INDEX `purchase_items_purchaseId_idx`(`purchaseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `billable_rates` (
    `id` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NULL,
    `projectId` CHAR(36) NULL,
    `taskId` CHAR(36) NULL,
    `userId` CHAR(36) NULL,
    `departmentId` CHAR(36) NULL,
    `rate` DECIMAL(15, 2) NOT NULL,
    `currencyId` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `billable_rates_clientId_idx`(`clientId`),
    INDEX `billable_rates_projectId_idx`(`projectId`),
    INDEX `billable_rates_taskId_idx`(`taskId`),
    INDEX `billable_rates_userId_idx`(`userId`),
    INDEX `billable_rates_currencyId_fkey`(`currencyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estimates` (
    `id` CHAR(36) NOT NULL,
    `estimateNumber` VARCHAR(50) NOT NULL,
    `clientId` CHAR(36) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `status` ENUM('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED') NOT NULL DEFAULT 'DRAFT',
    `subtotal` DECIMAL(15, 2) NOT NULL,
    `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `tax` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(15, 2) NOT NULL,
    `currencyId` CHAR(36) NOT NULL,
    `expiryDate` DATE NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `estimates_estimateNumber_key`(`estimateNumber`),
    INDEX `estimates_clientId_idx`(`clientId`),
    INDEX `estimates_currencyId_fkey`(`currencyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estimate_items` (
    `id` CHAR(36) NOT NULL,
    `estimateId` CHAR(36) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `rate` DECIMAL(15, 2) NOT NULL,
    `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `tax` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(15, 2) NOT NULL,

    INDEX `estimate_items_estimateId_idx`(`estimateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` CHAR(36) NOT NULL,
    `invoiceNumber` VARCHAR(50) NOT NULL,
    `clientId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NULL,
    `recurringInvoiceId` CHAR(36) NULL,
    `status` ENUM('DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'VOID') NOT NULL DEFAULT 'DRAFT',
    `issueDate` DATE NOT NULL,
    `dueDate` DATE NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL,
    `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `tax` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(15, 2) NOT NULL,
    `balanceDue` DECIMAL(15, 2) NOT NULL,
    `currencyId` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `invoices_invoiceNumber_key`(`invoiceNumber`),
    INDEX `invoices_clientId_idx`(`clientId`),
    INDEX `invoices_projectId_idx`(`projectId`),
    INDEX `invoices_currencyId_fkey`(`currencyId`),
    INDEX `invoices_recurringInvoiceId_fkey`(`recurringInvoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_items` (
    `id` CHAR(36) NOT NULL,
    `invoiceId` CHAR(36) NOT NULL,
    `type` ENUM('PRODUCT', 'SERVICE', 'TASK', 'TIME_ENTRY', 'MANUAL') NOT NULL DEFAULT 'MANUAL',
    `timeEntryId` CHAR(36) NULL,
    `taskId` CHAR(36) NULL,
    `description` VARCHAR(255) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `rate` DECIMAL(15, 2) NOT NULL,
    `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `tax` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(15, 2) NOT NULL,

    INDEX `invoice_items_invoiceId_idx`(`invoiceId`),
    INDEX `invoice_items_taskId_fkey`(`taskId`),
    INDEX `invoice_items_timeEntryId_fkey`(`timeEntryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_methods` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `payment_methods_name_key`(`name`),
    UNIQUE INDEX `payment_methods_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_payments` (
    `id` CHAR(36) NOT NULL,
    `paymentDate` TIMESTAMP(0) NOT NULL,
    `paymentMethodId` CHAR(36) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `transactionId` VARCHAR(100) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'COMPLETED',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `invoice_payments_paymentMethodId_fkey`(`paymentMethodId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_payment_allocations` (
    `id` CHAR(36) NOT NULL,
    `paymentId` CHAR(36) NOT NULL,
    `invoiceId` CHAR(36) NOT NULL,
    `amountAllocated` DECIMAL(15, 2) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `invoice_payment_allocations_paymentId_idx`(`paymentId`),
    INDEX `invoice_payment_allocations_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recurring_invoices` (
    `id` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NULL,
    `frequency` VARCHAR(191) NOT NULL DEFAULT 'MONTHLY',
    `amount` DECIMAL(15, 2) NOT NULL,
    `currencyId` CHAR(36) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `lastRun` TIMESTAMP(0) NULL,
    `nextRun` TIMESTAMP(0) NOT NULL,
    `failureCount` INTEGER NOT NULL DEFAULT 0,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `recurring_invoices_clientId_idx`(`clientId`),
    INDEX `recurring_invoices_currencyId_fkey`(`currencyId`),
    INDEX `recurring_invoices_projectId_fkey`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_notes` (
    `id` CHAR(36) NOT NULL,
    `noteNumber` VARCHAR(50) NOT NULL,
    `invoiceId` CHAR(36) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `reason` VARCHAR(255) NULL,
    `date` DATE NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `credit_notes_noteNumber_key`(`noteNumber`),
    INDEX `credit_notes_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `debit_notes` (
    `id` CHAR(36) NOT NULL,
    `noteNumber` VARCHAR(50) NOT NULL,
    `invoiceId` CHAR(36) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `reason` VARCHAR(255) NULL,
    `date` DATE NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `debit_notes_noteNumber_key`(`noteNumber`),
    INDEX `debit_notes_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `financial_transactions` (
    `id` CHAR(36) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `date` TIMESTAMP(0) NOT NULL,
    `referenceId` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_billings` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `billingType` VARCHAR(191) NOT NULL,
    `rateAmount` DECIMAL(15, 2) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `project_billings_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_timelines` (
    `id` CHAR(36) NOT NULL,
    `invoiceId` CHAR(36) NOT NULL,
    `event` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `invoice_timelines_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ledger_accounts` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `ledger_accounts_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `journal_entries` (
    `id` CHAR(36) NOT NULL,
    `entryNumber` VARCHAR(50) NOT NULL,
    `date` TIMESTAMP(0) NOT NULL,
    `description` TEXT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `journal_entries_entryNumber_key`(`entryNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `journal_lines` (
    `id` CHAR(36) NOT NULL,
    `journalEntryId` CHAR(36) NOT NULL,
    `accountId` CHAR(36) NOT NULL,
    `debit` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `credit` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,

    INDEX `journal_lines_journalEntryId_idx`(`journalEntryId`),
    INDEX `journal_lines_accountId_idx`(`accountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `business_units` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `business_units_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `divisions` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `businessUnitId` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `divisions_code_key`(`code`),
    INDEX `divisions_businessUnitId_fkey`(`businessUnitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_profiles` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `employeeCode` VARCHAR(50) NOT NULL,
    `photo` VARCHAR(255) NULL,
    `dateOfJoining` DATE NOT NULL,
    `employmentStatus` ENUM('ACTIVE', 'PROBATION', 'NOTICE_PERIOD', 'RESIGNED', 'TERMINATED') NOT NULL DEFAULT 'PROBATION',
    `bloodGroup` VARCHAR(10) NULL,
    `nationality` VARCHAR(100) NULL,
    `maritalStatus` VARCHAR(50) NULL,
    `passport` VARCHAR(50) NULL,
    `drivingLicense` VARCHAR(50) NULL,
    `aadhaar` VARCHAR(50) NULL,
    `pan` VARCHAR(50) NULL,
    `bankDetails` TEXT NULL,
    `businessUnitId` CHAR(36) NULL,
    `divisionId` CHAR(36) NULL,
    `reportingManagerId` CHAR(36) NULL,
    `skipLevelManagerId` CHAR(36) NULL,
    `payrollGroup` VARCHAR(100) NULL,
    `salaryGrade` VARCHAR(50) NULL,
    `costCenter` VARCHAR(50) NULL,
    `employmentCategory` VARCHAR(100) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `employee_profiles_userId_key`(`userId`),
    UNIQUE INDEX `employee_profiles_employeeCode_key`(`employeeCode`),
    INDEX `employee_profiles_businessUnitId_fkey`(`businessUnitId`),
    INDEX `employee_profiles_divisionId_fkey`(`divisionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_documents` (
    `id` CHAR(36) NOT NULL,
    `employeeProfileId` CHAR(36) NOT NULL,
    `category` ENUM('RESUME', 'OFFER_LETTER', 'APPOINTMENT_LETTER', 'CONTRACT', 'PAN', 'AADHAAR', 'PASSPORT', 'DRIVING_LICENSE', 'CERTIFICATES', 'EXPERIENCE_LETTER') NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `documentPath` VARCHAR(255) NOT NULL,
    `uploadedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `employee_documents_employeeProfileId_fkey`(`employeeProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emergency_contacts` (
    `id` CHAR(36) NOT NULL,
    `employeeProfileId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `relationship` VARCHAR(50) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NULL,

    INDEX `emergency_contacts_employeeProfileId_fkey`(`employeeProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_skills` (
    `id` CHAR(36) NOT NULL,
    `employeeProfileId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `proficiency` VARCHAR(50) NOT NULL,

    INDEX `employee_skills_employeeProfileId_fkey`(`employeeProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_certifications` (
    `id` CHAR(36) NOT NULL,
    `employeeProfileId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `issuingOrganization` VARCHAR(100) NOT NULL,
    `issueDate` DATE NOT NULL,
    `expiryDate` DATE NULL,
    `credentialId` VARCHAR(100) NULL,

    INDEX `employee_certifications_employeeProfileId_fkey`(`employeeProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_experiences` (
    `id` CHAR(36) NOT NULL,
    `employeeProfileId` CHAR(36) NOT NULL,
    `companyName` VARCHAR(100) NOT NULL,
    `designation` VARCHAR(100) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NULL,
    `description` TEXT NULL,

    INDEX `employee_experiences_employeeProfileId_fkey`(`employeeProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_educations` (
    `id` CHAR(36) NOT NULL,
    `employeeProfileId` CHAR(36) NOT NULL,
    `institution` VARCHAR(100) NOT NULL,
    `degree` VARCHAR(100) NOT NULL,
    `fieldOfStudy` VARCHAR(100) NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NULL,

    INDEX `employee_educations_employeeProfileId_fkey`(`employeeProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendances` (
    `id` CHAR(36) NOT NULL,
    `employeeProfileId` CHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `status` ENUM('CHECK_IN', 'CHECK_OUT', 'LATE', 'EARLY_LEAVE', 'HOLIDAY', 'WEEKEND', 'ABSENT', 'PRESENT', 'HALF_DAY', 'REMOTE', 'WFH') NOT NULL DEFAULT 'PRESENT',
    `workSessionId` CHAR(36) NULL,
    `notes` TEXT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `attendances_workSessionId_key`(`workSessionId`),
    UNIQUE INDEX `attendances_employeeProfileId_date_key`(`employeeProfileId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shifts` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` ENUM('GENERAL', 'MORNING', 'EVENING', 'NIGHT', 'ROTATIONAL', 'FLEXIBLE', 'SPLIT') NOT NULL DEFAULT 'GENERAL',
    `startTime` VARCHAR(20) NOT NULL,
    `endTime` VARCHAR(20) NOT NULL,
    `gracePeriod` INTEGER NOT NULL DEFAULT 15,
    `nightShiftAllowance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shift_assignments` (
    `id` CHAR(36) NOT NULL,
    `employeeProfileId` CHAR(36) NOT NULL,
    `shiftId` CHAR(36) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `shift_assignments_employeeProfileId_fkey`(`employeeProfileId`),
    INDEX `shift_assignments_shiftId_fkey`(`shiftId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `holidays` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `date` DATE NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `holidays_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_types` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` ENUM('CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'COMP_OFF', 'LOSS_OF_PAY') NOT NULL,
    `daysAllowed` DOUBLE NOT NULL DEFAULT 12,
    `allowHalfDay` BOOLEAN NOT NULL DEFAULT true,
    `allowHourly` BOOLEAN NOT NULL DEFAULT false,
    `carryForward` BOOLEAN NOT NULL DEFAULT true,
    `allowEncashment` BOOLEAN NOT NULL DEFAULT false,
    `allowNegative` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `leave_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_balances` (
    `id` CHAR(36) NOT NULL,
    `employeeProfileId` CHAR(36) NOT NULL,
    `leaveTypeId` CHAR(36) NOT NULL,
    `allocated` DOUBLE NOT NULL,
    `used` DOUBLE NOT NULL DEFAULT 0,
    `remaining` DOUBLE NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `leave_balances_leaveTypeId_fkey`(`leaveTypeId`),
    UNIQUE INDEX `leave_balances_employeeProfileId_leaveTypeId_key`(`employeeProfileId`, `leaveTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_requests` (
    `id` CHAR(36) NOT NULL,
    `employeeProfileId` CHAR(36) NOT NULL,
    `leaveTypeId` CHAR(36) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `isHalfDay` BOOLEAN NOT NULL DEFAULT false,
    `isHourly` BOOLEAN NOT NULL DEFAULT false,
    `hoursRequested` DOUBLE NULL,
    `reason` TEXT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'MANAGER_APPROVED', 'HR_APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'SUBMITTED',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `leave_requests_employeeProfileId_fkey`(`employeeProfileId`),
    INDEX `leave_requests_leaveTypeId_fkey`(`leaveTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_approvals` (
    `id` CHAR(36) NOT NULL,
    `leaveRequestId` CHAR(36) NOT NULL,
    `approverId` CHAR(36) NOT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'MANAGER_APPROVED', 'HR_APPROVED', 'REJECTED', 'CANCELLED') NOT NULL,
    `comments` TEXT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `leave_approvals_approverId_fkey`(`approverId`),
    INDEX `leave_approvals_leaveRequestId_fkey`(`leaveRequestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_blackout_dates` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `description` TEXT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `overtime_requests` (
    `id` CHAR(36) NOT NULL,
    `employeeProfileId` CHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `hours` DOUBLE NOT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'MANAGER_APPROVED', 'HR_APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'SUBMITTED',
    `approvedById` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `overtime_requests_employeeProfileId_fkey`(`employeeProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `performance_goals` (
    `id` CHAR(36) NOT NULL,
    `employeeProfileId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `kpi` TEXT NULL,
    `competencies` TEXT NULL,
    `targetDate` DATE NOT NULL,
    `progress` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `performance_goals_employeeProfileId_fkey`(`employeeProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `performance_cycles` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `performance_reviews` (
    `id` CHAR(36) NOT NULL,
    `employeeProfileId` CHAR(36) NOT NULL,
    `cycleId` CHAR(36) NOT NULL,
    `managerId` CHAR(36) NOT NULL,
    `selfRating` INTEGER NULL,
    `managerRating` INTEGER NULL,
    `finalRating` INTEGER NULL,
    `selfFeedback` TEXT NULL,
    `managerFeedback` TEXT NULL,
    `finalFeedback` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `performance_reviews_cycleId_fkey`(`cycleId`),
    INDEX `performance_reviews_employeeProfileId_fkey`(`employeeProfileId`),
    INDEX `performance_reviews_managerId_fkey`(`managerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `performance_improvement_plans` (
    `id` CHAR(36) NOT NULL,
    `reviewId` CHAR(36) NOT NULL,
    `goals` TEXT NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `performance_improvement_plans_reviewId_key`(`reviewId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_courses` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `durationHours` INTEGER NOT NULL,
    `isMandatory` BOOLEAN NOT NULL DEFAULT false,
    `isExternal` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_enrollments` (
    `id` CHAR(36) NOT NULL,
    `employeeProfileId` CHAR(36) NOT NULL,
    `courseId` CHAR(36) NOT NULL,
    `enrollmentDate` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `completionDate` DATE NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ENROLLED',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `training_enrollments_courseId_fkey`(`courseId`),
    INDEX `training_enrollments_employeeProfileId_fkey`(`employeeProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_certificates` (
    `id` CHAR(36) NOT NULL,
    `enrollmentId` CHAR(36) NOT NULL,
    `certificateNumber` VARCHAR(100) NOT NULL,
    `issueDate` DATE NOT NULL,
    `expiryDate` DATE NULL,
    `renewalReminded` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `training_certificates_enrollmentId_key`(`enrollmentId`),
    UNIQUE INDEX `training_certificates_certificateNumber_key`(`certificateNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asset_assignments` (
    `id` CHAR(36) NOT NULL,
    `employeeProfileId` CHAR(36) NOT NULL,
    `assetType` VARCHAR(100) NOT NULL,
    `modelName` VARCHAR(100) NULL,
    `serialNumber` VARCHAR(100) NOT NULL,
    `warrantyMonths` INTEGER NOT NULL DEFAULT 12,
    `purchaseDate` DATE NOT NULL,
    `vendor` VARCHAR(100) NOT NULL,
    `assignedDate` DATE NOT NULL,
    `returnedDate` DATE NULL,
    `status` ENUM('ASSIGNED', 'RETURNED', 'LOST', 'DAMAGED', 'REPAIR', 'DISPOSED') NOT NULL DEFAULT 'ASSIGNED',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `asset_assignments_employeeProfileId_fkey`(`employeeProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_timelines` (
    `id` CHAR(36) NOT NULL,
    `employeeProfileId` CHAR(36) NOT NULL,
    `event` ENUM('JOINED', 'PROMOTION', 'SALARY_REVISION', 'DEPARTMENT_CHANGE', 'TRANSFER', 'AWARD', 'WARNING', 'SUSPENSION', 'RESIGNATION', 'TERMINATION', 'EXIT_INTERVIEW') NOT NULL,
    `description` TEXT NOT NULL,
    `date` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `employee_timelines_employeeProfileId_fkey`(`employeeProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `infrastructure_providers` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `apiEndpoint` VARCHAR(255) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `infrastructure_providers_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hosting_accounts` (
    `id` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NULL,
    `projectId` CHAR(36) NULL,
    `providerId` CHAR(36) NOT NULL,
    `accountUsername` VARCHAR(100) NOT NULL,
    `controlPanelUrl` VARCHAR(255) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED', 'FAILED') NOT NULL DEFAULT 'ACTIVE',
    `hostingPlanId` CHAR(36) NULL,
    `diskLimitGb` DECIMAL(10, 2) NULL,
    `diskUsedGb` DECIMAL(10, 2) NULL,
    `bandwidthLimitGb` DECIMAL(10, 2) NULL,
    `bandwidthUsedGb` DECIMAL(10, 2) NULL,
    `notes` TEXT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `hosting_accounts_clientId_fkey`(`clientId`),
    INDEX `hosting_accounts_hostingPlanId_fkey`(`hostingPlanId`),
    INDEX `hosting_accounts_projectId_fkey`(`projectId`),
    INDEX `hosting_accounts_providerId_fkey`(`providerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hosting_plans` (
    `id` CHAR(36) NOT NULL,
    `providerId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `diskGb` INTEGER NOT NULL,
    `ramGb` DECIMAL(10, 2) NOT NULL,
    `cpuCores` INTEGER NOT NULL,
    `bandwidthGb` INTEGER NOT NULL,
    `priceMonthly` DECIMAL(10, 2) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `hosting_plans_providerId_fkey`(`providerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servers` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `ipAddress` VARCHAR(50) NOT NULL,
    `sshPort` INTEGER NOT NULL DEFAULT 22,
    `os` VARCHAR(100) NOT NULL,
    `location` VARCHAR(100) NULL,
    `providerId` CHAR(36) NULL,
    `type` ENUM('SHARED', 'VPS', 'DEDICATED', 'CLOUD', 'CONTAINER') NOT NULL DEFAULT 'VPS',
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED', 'FAILED') NOT NULL DEFAULT 'ACTIVE',
    `diskGb` INTEGER NULL,
    `ramGb` DECIMAL(10, 2) NULL,
    `cpuCores` INTEGER NULL,
    `clientId` CHAR(36) NULL,
    `projectId` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `owner` VARCHAR(255) NULL,
    `serverIp` VARCHAR(100) NULL,

    INDEX `servers_clientId_fkey`(`clientId`),
    INDEX `servers_projectId_fkey`(`projectId`),
    INDEX `servers_providerId_fkey`(`providerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `server_environments` (
    `id` CHAR(36) NOT NULL,
    `serverId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NULL,
    `environment` ENUM('DEVELOPMENT', 'TESTING', 'STAGING', 'PRODUCTION') NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `domainName` VARCHAR(255) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED', 'FAILED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `server_environments_projectId_fkey`(`projectId`),
    INDEX `server_environments_serverId_fkey`(`serverId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deployments` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `serverEnvironmentId` CHAR(36) NOT NULL,
    `repositoryBranchId` CHAR(36) NULL,
    `commitHash` VARCHAR(100) NULL,
    `startedById` CHAR(36) NOT NULL,
    `status` ENUM('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'ROLLBACK') NOT NULL DEFAULT 'PENDING',
    `rollbackSupport` BOOLEAN NOT NULL DEFAULT true,
    `duration` INTEGER NULL,
    `rollbackReason` TEXT NULL,
    `buildLogs` LONGTEXT NULL,
    `environmentVariableVersion` INTEGER NOT NULL DEFAULT 1,
    `startedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `finishedAt` TIMESTAMP(0) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `deployments_projectId_fkey`(`projectId`),
    INDEX `deployments_repositoryBranchId_fkey`(`repositoryBranchId`),
    INDEX `deployments_serverEnvironmentId_fkey`(`serverEnvironmentId`),
    INDEX `deployments_startedById_fkey`(`startedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deployment_histories` (
    `id` CHAR(36) NOT NULL,
    `deploymentId` CHAR(36) NOT NULL,
    `logMessage` TEXT NOT NULL,
    `status` ENUM('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'ROLLBACK') NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `deployment_histories_deploymentId_fkey`(`deploymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repositories` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NULL,
    `name` VARCHAR(255) NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `owner` VARCHAR(100) NULL,
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'PRIVATE',
    `primaryLanguage` VARCHAR(50) NULL,
    `defaultBranch` VARCHAR(100) NOT NULL DEFAULT 'main',
    `lastCommit` VARCHAR(100) NULL,
    `lastSync` TIMESTAMP(0) NULL,
    `webhookEnabled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `repositories_projectId_fkey`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repository_branches` (
    `id` CHAR(36) NOT NULL,
    `repositoryId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `repository_branches_repositoryId_fkey`(`repositoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `domains` (
    `id` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NULL,
    `projectId` CHAR(36) NULL,
    `name` VARCHAR(255) NOT NULL,
    `registrar` VARCHAR(100) NOT NULL,
    `purchaseDate` DATE NOT NULL,
    `expiryDate` DATE NOT NULL,
    `autoRenew` BOOLEAN NOT NULL DEFAULT true,
    `privacyProtection` BOOLEAN NOT NULL DEFAULT false,
    `registrarLock` BOOLEAN NOT NULL DEFAULT true,
    `transferLock` BOOLEAN NOT NULL DEFAULT true,
    `purchaseCost` DECIMAL(10, 2) NULL,
    `renewalCost` DECIMAL(10, 2) NULL,
    `renewalReminderDays` INTEGER NOT NULL DEFAULT 30,
    `whoisRaw` TEXT NULL,
    `dnsSecEnabled` BOOLEAN NOT NULL DEFAULT false,
    `nameservers` VARCHAR(512) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED', 'FAILED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `serverId` CHAR(36) NULL,

    UNIQUE INDEX `domains_name_key`(`name`),
    INDEX `domains_clientId_fkey`(`clientId`),
    INDEX `domains_projectId_fkey`(`projectId`),
    INDEX `domains_serverId_fkey`(`serverId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sub_domains` (
    `id` CHAR(36) NOT NULL,
    `domainId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `targetIp` VARCHAR(50) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED', 'FAILED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `sub_domains_domainId_fkey`(`domainId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dns_records` (
    `id` CHAR(36) NOT NULL,
    `domainId` CHAR(36) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `host` VARCHAR(255) NOT NULL,
    `value` TEXT NOT NULL,
    `ttl` INTEGER NOT NULL DEFAULT 3600,
    `priority` INTEGER NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `dns_records_domainId_fkey`(`domainId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ssl_certificates` (
    `id` CHAR(36) NOT NULL,
    `domainId` CHAR(36) NULL,
    `subDomainId` CHAR(36) NULL,
    `issuer` VARCHAR(100) NOT NULL,
    `issuedDate` DATE NOT NULL,
    `expiryDate` DATE NOT NULL,
    `wildcard` BOOLEAN NOT NULL DEFAULT false,
    `autoRenewal` BOOLEAN NOT NULL DEFAULT false,
    `daysRemaining` INTEGER NULL,
    `renewalStatus` VARCHAR(191) NOT NULL DEFAULT 'GOOD',
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED', 'FAILED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `ssl_certificates_domainId_fkey`(`domainId`),
    INDEX `ssl_certificates_subDomainId_fkey`(`subDomainId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `backups` (
    `id` CHAR(36) NOT NULL,
    `serverId` CHAR(36) NULL,
    `hostingAccountId` CHAR(36) NULL,
    `scheduleId` CHAR(36) NULL,
    `name` VARCHAR(255) NOT NULL,
    `filePath` VARCHAR(255) NULL,
    `fileSizeMb` DECIMAL(10, 2) NULL,
    `status` ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `backupType` VARCHAR(191) NOT NULL DEFAULT 'DATABASE',
    `isFull` BOOLEAN NOT NULL DEFAULT true,
    `isEncrypted` BOOLEAN NOT NULL DEFAULT false,
    `restoreTested` BOOLEAN NOT NULL DEFAULT false,
    `restorePoint` BOOLEAN NOT NULL DEFAULT false,
    `completedAt` TIMESTAMP(0) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `backups_hostingAccountId_fkey`(`hostingAccountId`),
    INDEX `backups_scheduleId_fkey`(`scheduleId`),
    INDEX `backups_serverId_fkey`(`serverId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `backup_schedules` (
    `id` CHAR(36) NOT NULL,
    `serverId` CHAR(36) NULL,
    `hostingAccountId` CHAR(36) NULL,
    `name` VARCHAR(100) NOT NULL,
    `frequency` VARCHAR(50) NOT NULL,
    `retentionDays` INTEGER NOT NULL DEFAULT 30,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `backup_schedules_hostingAccountId_fkey`(`hostingAccountId`),
    INDEX `backup_schedules_serverId_fkey`(`serverId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monitoring_checks` (
    `id` CHAR(36) NOT NULL,
    `serverId` CHAR(36) NULL,
    `domainId` CHAR(36) NULL,
    `sslCertificateId` CHAR(36) NULL,
    `name` VARCHAR(100) NOT NULL,
    `checkType` VARCHAR(50) NOT NULL,
    `value` VARCHAR(100) NULL,
    `cpuUsage` DECIMAL(5, 2) NULL,
    `ramUsage` DECIMAL(5, 2) NULL,
    `diskUsage` DECIMAL(5, 2) NULL,
    `loadAverage` DECIMAL(5, 2) NULL,
    `networkInKbps` DECIMAL(10, 2) NULL,
    `networkOutKbps` DECIMAL(10, 2) NULL,
    `responseTimeMs` INTEGER NULL,
    `lastCheckedAt` TIMESTAMP(0) NULL,
    `status` ENUM('HEALTHY', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'HEALTHY',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `monitoring_checks_domainId_fkey`(`domainId`),
    INDEX `monitoring_checks_serverId_fkey`(`serverId`),
    INDEX `monitoring_checks_sslCertificateId_fkey`(`sslCertificateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `incidents` (
    `id` CHAR(36) NOT NULL,
    `serverId` CHAR(36) NULL,
    `domainId` CHAR(36) NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'INVESTIGATING',
    `severity` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'P3',
    `rootCause` TEXT NULL,
    `resolutionTime` INTEGER NULL,
    `assignedEngineer` VARCHAR(100) NULL,
    `affectedServices` VARCHAR(255) NULL,
    `resolvedAt` TIMESTAMP(0) NULL,
    `postmortem` TEXT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `incidents_domainId_fkey`(`domainId`),
    INDEX `incidents_serverId_fkey`(`serverId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `maintenance_windows` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `scheduledStart` TIMESTAMP(0) NOT NULL,
    `scheduledEnd` TIMESTAMP(0) NOT NULL,
    `downtimeExpected` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'SCHEDULED',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `infrastructure_credentials` (
    `id` CHAR(36) NOT NULL,
    `serverId` CHAR(36) NULL,
    `domainId` CHAR(36) NULL,
    `hostingAccountId` CHAR(36) NULL,
    `credentialType` VARCHAR(50) NOT NULL,
    `username` VARCHAR(100) NULL,
    `passwordEncrypted` TEXT NULL,
    `sshPrivateKey` TEXT NULL,
    `apiToken` TEXT NULL,
    `rotationInterval` INTEGER NULL,
    `expiryDate` DATE NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `infrastructure_credentials_domainId_fkey`(`domainId`),
    INDEX `infrastructure_credentials_hostingAccountId_fkey`(`hostingAccountId`),
    INDEX `infrastructure_credentials_serverId_fkey`(`serverId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `infrastructure_tags` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `infrastructure_tags_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `infrastructure_timelines` (
    `id` CHAR(36) NOT NULL,
    `resourceId` CHAR(36) NOT NULL,
    `resourceType` VARCHAR(100) NOT NULL,
    `event` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_categories` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `report_categories_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_definitions` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `categoryId` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `module` VARCHAR(100) NOT NULL,
    `fieldsJson` TEXT NOT NULL,
    `filtersJson` TEXT NULL,
    `sortJson` TEXT NULL,
    `groupByJson` TEXT NULL,
    `aggregationsJson` TEXT NULL,
    `chartConfigJson` TEXT NULL,
    `exportConfigJson` TEXT NULL,
    `currentVersion` VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `report_definitions_code_key`(`code`),
    INDEX `report_definitions_categoryId_fkey`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_versions` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `reportDefinitionId` CHAR(36) NOT NULL,
    `version` VARCHAR(50) NOT NULL,
    `changeSummary` TEXT NULL,
    `createdByUserId` CHAR(36) NOT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `fieldsJson` TEXT NOT NULL,
    `filtersJson` TEXT NULL,
    `chartConfigJson` TEXT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `rowVersion` INTEGER NOT NULL DEFAULT 0,

    INDEX `report_versions_createdByUserId_fkey`(`createdByUserId`),
    INDEX `report_versions_reportDefinitionId_fkey`(`reportDefinitionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `widgets_library` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `type` ENUM('KPI_CARD', 'TABLE', 'LINE_CHART', 'BAR_CHART', 'AREA_CHART', 'PIE_CHART', 'DONUT_CHART', 'FUNNEL', 'GAUGE', 'CALENDAR', 'HEATMAP', 'PROGRESS_BAR', 'TIMELINE') NOT NULL DEFAULT 'KPI_CARD',
    `configJson` LONGTEXT NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `widgets_library_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dashboard_templates` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `layoutJson` LONGTEXT NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `dashboard_templates_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dashboards` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `templateId` CHAR(36) NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('EXECUTIVE', 'SALES', 'PROJECT', 'FINANCE', 'HR', 'OPERATIONS', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM',
    `ownerId` CHAR(36) NOT NULL,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `refreshInterval` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `dashboards_ownerId_fkey`(`ownerId`),
    INDEX `dashboards_templateId_fkey`(`templateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dashboard_widgets` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `dashboardId` CHAR(36) NOT NULL,
    `widgetId` CHAR(36) NULL,
    `title` VARCHAR(100) NOT NULL,
    `xPos` INTEGER NOT NULL DEFAULT 0,
    `yPos` INTEGER NOT NULL DEFAULT 0,
    `width` INTEGER NOT NULL DEFAULT 4,
    `height` INTEGER NOT NULL DEFAULT 3,
    `overrideConfigJson` LONGTEXT NULL,
    `drillDownMetadata` TEXT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `dashboard_widgets_dashboardId_fkey`(`dashboardId`),
    INDEX `dashboard_widgets_widgetId_fkey`(`widgetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dashboard_shares` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `dashboardId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NULL,
    `roleId` CHAR(36) NULL,
    `departmentId` CHAR(36) NULL,
    `permission` ENUM('VIEW', 'EDIT') NOT NULL DEFAULT 'VIEW',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `dashboard_shares_dashboardId_fkey`(`dashboardId`),
    INDEX `dashboard_shares_roleId_fkey`(`roleId`),
    INDEX `dashboard_shares_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_filters` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `reportDefinitionId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `departmentId` CHAR(36) NULL,
    `name` VARCHAR(100) NOT NULL,
    `scope` ENUM('GLOBAL', 'DEPARTMENT', 'PERSONAL') NOT NULL DEFAULT 'PERSONAL',
    `datePreset` ENUM('LAST_7_DAYS', 'LAST_MONTH', 'QUARTER', 'FISCAL_YEAR', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM',
    `filtersJson` TEXT NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `saved_filters_departmentId_fkey`(`departmentId`),
    INDEX `saved_filters_reportDefinitionId_fkey`(`reportDefinitionId`),
    INDEX `saved_filters_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scheduled_reports` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `reportDefinitionId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `frequency` VARCHAR(50) NOT NULL,
    `cronExpression` VARCHAR(100) NULL,
    `deliveryMethods` VARCHAR(255) NOT NULL,
    `recipients` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `scheduled_reports_reportDefinitionId_fkey`(`reportDefinitionId`),
    INDEX `scheduled_reports_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_executions` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `reportDefinitionId` CHAR(36) NOT NULL,
    `scheduledReportId` CHAR(36) NULL,
    `triggeredById` CHAR(36) NULL,
    `status` ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `errorMessage` TEXT NULL,
    `startedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `completedAt` TIMESTAMP(0) NULL,
    `duration` INTEGER NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `report_executions_reportDefinitionId_fkey`(`reportDefinitionId`),
    INDEX `report_executions_scheduledReportId_fkey`(`scheduledReportId`),
    INDEX `report_executions_triggeredById_fkey`(`triggeredById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_exports` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `reportDefinitionId` CHAR(36) NOT NULL,
    `startedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `completedAt` TIMESTAMP(0) NULL,
    `duration` INTEGER NULL,
    `generatedById` CHAR(36) NOT NULL,
    `recordCount` INTEGER NOT NULL DEFAULT 0,
    `fileSize` INTEGER NOT NULL DEFAULT 0,
    `downloadCount` INTEGER NOT NULL DEFAULT 0,
    `exportStatus` ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `exportFormat` ENUM('PDF', 'EXCEL', 'CSV', 'JSON', 'POWERPOINT') NOT NULL,
    `filePath` VARCHAR(255) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `report_exports_generatedById_fkey`(`generatedById`),
    INDEX `report_exports_reportDefinitionId_fkey`(`reportDefinitionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_favorites` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `reportDefinitionId` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `report_favorites_reportDefinitionId_fkey`(`reportDefinitionId`),
    INDEX `report_favorites_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recently_opened_reports` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `reportDefinitionId` CHAR(36) NOT NULL,
    `openedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `recently_opened_reports_reportDefinitionId_fkey`(`reportDefinitionId`),
    INDEX `recently_opened_reports_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `analytics_caches` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `reportId` VARCHAR(100) NOT NULL,
    `filterHash` VARCHAR(100) NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `generatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `expiresAt` TIMESTAMP(0) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `analytics_caches_tenantId_reportId_filterHash_key`(`tenantId`, `reportId`, `filterHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpi_definitions` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `formula` TEXT NOT NULL,
    `targetValue` DECIMAL(15, 2) NULL,
    `warningThreshold` DECIMAL(15, 2) NULL,
    `criticalThreshold` DECIMAL(15, 2) NULL,
    `trendDirection` ENUM('HIGHER_IS_BETTER', 'LOWER_IS_BETTER') NOT NULL DEFAULT 'HIGHER_IS_BETTER',
    `monthlyTarget` DECIMAL(15, 2) NULL,
    `quarterlyTarget` DECIMAL(15, 2) NULL,
    `annualTarget` DECIMAL(15, 2) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `kpi_definitions_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpi_snapshots` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `kpiDefinitionId` CHAR(36) NOT NULL,
    `value` DECIMAL(15, 2) NOT NULL,
    `recordedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `kpi_snapshots_kpiDefinitionId_fkey`(`kpiDefinitionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `business_alerts` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `isTriggered` BOOLEAN NOT NULL DEFAULT true,
    `triggeredAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `resolvedAt` TIMESTAMP(0) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `analytics_snapshots` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `interval` VARCHAR(50) NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `recordedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `analytics_insights` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `dashboardId` CHAR(36) NULL,
    `reportId` CHAR(36) NULL,
    `insightType` VARCHAR(100) NOT NULL,
    `confidenceScore` DECIMAL(5, 2) NOT NULL,
    `generatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `sourceModules` VARCHAR(255) NOT NULL,
    `recommendation` TEXT NOT NULL,
    `explanation` TEXT NOT NULL,
    `supportingMetrics` TEXT NULL,
    `acknowledgedAt` TIMESTAMP(0) NULL,
    `dismissedAt` TIMESTAMP(0) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `analytics_insights_dashboardId_fkey`(`dashboardId`),
    INDEX `analytics_insights_reportId_fkey`(`reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'REMINDER', 'APPROVAL') NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `readAt` TIMESTAMP(0) NULL,
    `clickedAt` TIMESTAMP(0) NULL,
    `archivedAt` TIMESTAMP(0) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `notifications_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_templates` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `subject` VARCHAR(255) NULL,
    `body` TEXT NOT NULL,
    `type` ENUM('EMAIL', 'SMS', 'WHATSAPP', 'PUSH') NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `notification_templates_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_preferences` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `roleId` CHAR(36) NULL,
    `channel` ENUM('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH') NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `digestFrequency` ENUM('IMMEDIATE', 'HOURLY', 'DAILY', 'WEEKLY') NOT NULL DEFAULT 'IMMEDIATE',
    `quietHoursStart` VARCHAR(5) NULL,
    `quietHoursEnd` VARCHAR(5) NULL,
    `timezone` VARCHAR(100) NOT NULL DEFAULT 'UTC',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `notification_preferences_roleId_fkey`(`roleId`),
    INDEX `notification_preferences_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `announcements` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
    `creatorId` CHAR(36) NOT NULL,
    `departmentId` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `announcements_creatorId_fkey`(`creatorId`),
    INDEX `announcements_departmentId_fkey`(`departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reminders` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `frequency` ENUM('ONCE', 'DAILY', 'WEEKLY', 'MONTHLY') NOT NULL DEFAULT 'ONCE',
    `targetDate` TIMESTAMP(0) NOT NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_definitions` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_steps` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `workflowDefinitionId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `stepOrder` INTEGER NOT NULL,
    `approverRoleId` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `workflow_steps_workflowDefinitionId_fkey`(`workflowDefinitionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_executions` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `workflowDefinitionId` CHAR(36) NOT NULL,
    `entityId` CHAR(36) NOT NULL,
    `entityType` VARCHAR(100) NOT NULL,
    `currentStepOrder` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(191) NOT NULL DEFAULT 'IN_PROGRESS',
    `initiatorId` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `workflow_executions_initiatorId_fkey`(`initiatorId`),
    INDEX `workflow_executions_workflowDefinitionId_fkey`(`workflowDefinitionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `automation_rules` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `triggerEvent` VARCHAR(100) NOT NULL,
    `conditionsJson` TEXT NULL,
    `actionType` VARCHAR(100) NOT NULL,
    `actionConfigJson` TEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `automation_triggers` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `ruleId` CHAR(36) NOT NULL,
    `type` ENUM('EVENT', 'SCHEDULE', 'MANUAL') NOT NULL DEFAULT 'EVENT',
    `scheduleExpression` VARCHAR(100) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `automation_executions` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `automationRuleId` CHAR(36) NOT NULL,
    `triggeredEntity` VARCHAR(255) NOT NULL,
    `executionStartedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `executionCompletedAt` TIMESTAMP(0) NULL,
    `executionDuration` INTEGER NULL,
    `executionResult` TEXT NULL,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `errorMessage` TEXT NULL,
    `status` VARCHAR(50) NOT NULL,
    `triggerSource` VARCHAR(100) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `automation_executions_automationRuleId_fkey`(`automationRuleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_requests` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `workflowExecutionId` CHAR(36) NOT NULL,
    `stepOrder` INTEGER NOT NULL,
    `approverId` CHAR(36) NOT NULL,
    `decision` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `comments` TEXT NULL,
    `actionedAt` TIMESTAMP(0) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `approval_requests_approverId_fkey`(`approverId`),
    INDEX `approval_requests_workflowExecutionId_fkey`(`workflowExecutionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_history` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `approvalRequestId` CHAR(36) NOT NULL,
    `decision` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL,
    `comments` TEXT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `approval_history_approvalRequestId_fkey`(`approvalRequestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `escalation_rules` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `workflowStepId` CHAR(36) NOT NULL,
    `escalateAfterHours` INTEGER NOT NULL,
    `escalateToRoleId` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `escalation_rules_workflowStepId_fkey`(`workflowStepId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `communication_logs` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NULL,
    `channel` ENUM('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH') NOT NULL,
    `recipient` VARCHAR(255) NOT NULL,
    `subject` VARCHAR(255) NULL,
    `body` TEXT NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `errorMessage` TEXT NULL,
    `sentAt` TIMESTAMP(0) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `communication_logs_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_events` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `eventType` VARCHAR(100) NOT NULL,
    `payloadJson` LONGTEXT NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_deliveries` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `webhookEventId` CHAR(36) NOT NULL,
    `targetUrl` VARCHAR(255) NOT NULL,
    `responseStatus` INTEGER NULL,
    `responseBody` TEXT NULL,
    `duration` INTEGER NULL,
    `success` BOOLEAN NOT NULL,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,
    `webhookId` CHAR(36) NULL,

    INDEX `webhook_deliveries_webhookEventId_fkey`(`webhookEventId`),
    INDEX `webhook_deliveries_webhookId_fkey`(`webhookId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_subscriptions` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `targetUrl` VARCHAR(255) NOT NULL,
    `eventTypes` VARCHAR(255) NOT NULL,
    `secretToken` VARCHAR(255) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_queues` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `channel` ENUM('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH') NOT NULL,
    `payloadJson` LONGTEXT NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 3,
    `nextRunAt` TIMESTAMP(0) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_audits` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `details` TEXT NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_projects` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `ownerId` CHAR(36) NOT NULL,
    `domain` VARCHAR(255) NOT NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_projects_clientId_fkey`(`clientId`),
    INDEX `seo_projects_ownerId_fkey`(`ownerId`),
    INDEX `seo_projects_projectId_fkey`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_keywords` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `term` VARCHAR(255) NOT NULL,
    `intent` ENUM('INFORMATIONAL', 'NAVIGATIONAL', 'COMMERCIAL', 'TRANSACTIONAL') NOT NULL DEFAULT 'INFORMATIONAL',
    `targetUrl` VARCHAR(255) NULL,
    `searchVolume` INTEGER NOT NULL DEFAULT 0,
    `cpc` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `difficulty` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('TRACKING', 'PAUSED', 'STOPPED') NOT NULL DEFAULT 'TRACKING',
    `groupId` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_keywords_groupId_fkey`(`groupId`),
    INDEX `seo_keywords_seoProjectId_fkey`(`seoProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_keyword_groups` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_keyword_groups_seoProjectId_fkey`(`seoProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_keyword_rankings` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `keywordId` CHAR(36) NOT NULL,
    `engine` ENUM('GOOGLE', 'BING') NOT NULL DEFAULT 'GOOGLE',
    `position` INTEGER NOT NULL,
    `trackedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_keyword_rankings_keywordId_fkey`(`keywordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_serp_snapshots` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `keywordId` CHAR(36) NOT NULL,
    `engine` ENUM('GOOGLE', 'BING') NOT NULL DEFAULT 'GOOGLE',
    `snapshotDate` DATE NOT NULL,
    `serpFeatures` VARCHAR(255) NOT NULL,
    `rawJson` LONGTEXT NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_competitors` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `domain` VARCHAR(255) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_competitors_seoProjectId_fkey`(`seoProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_competitor_keywords` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `competitorId` CHAR(36) NOT NULL,
    `term` VARCHAR(255) NOT NULL,
    `position` INTEGER NOT NULL,
    `searchVolume` INTEGER NOT NULL DEFAULT 0,
    `trackedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_competitor_keywords_competitorId_fkey`(`competitorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_pages` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `urlPath` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `metaDescription` TEXT NULL,
    `canonicalUrl` VARCHAR(255) NULL,
    `robotsMeta` VARCHAR(100) NULL,
    `openGraphJson` TEXT NULL,
    `twitterCardJson` TEXT NULL,
    `headingStructureJson` TEXT NULL,
    `internalLinksCount` INTEGER NOT NULL DEFAULT 0,
    `externalLinksCount` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('OPTIMIZED', 'NEEDS_IMPROVEMENT', 'CRITICAL') NOT NULL DEFAULT 'NEEDS_IMPROVEMENT',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_pages_seoProjectId_fkey`(`seoProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_technical_audits` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `healthScore` INTEGER NOT NULL,
    `pagesCrawled` INTEGER NOT NULL,
    `startedAt` TIMESTAMP(0) NOT NULL,
    `completedAt` TIMESTAMP(0) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_technical_audits_seoProjectId_fkey`(`seoProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_audit_issues` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `technicalAuditId` CHAR(36) NOT NULL,
    `urlPath` VARCHAR(255) NOT NULL,
    `issueType` VARCHAR(100) NOT NULL,
    `severity` ENUM('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `description` TEXT NOT NULL,
    `isResolved` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_audit_issues_technicalAuditId_fkey`(`technicalAuditId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_backlinks` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `sourceUrl` VARCHAR(255) NOT NULL,
    `targetUrl` VARCHAR(255) NOT NULL,
    `domainAuthority` INTEGER NOT NULL DEFAULT 0,
    `spamScore` INTEGER NOT NULL DEFAULT 0,
    `anchorText` VARCHAR(255) NULL,
    `type` ENUM('DOFOLLOW', 'NOFOLLOW', 'UGC', 'SPONSORED') NOT NULL DEFAULT 'DOFOLLOW',
    `lostAt` TIMESTAMP(0) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_backlinks_seoProjectId_fkey`(`seoProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_broken_links` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `sourceUrl` VARCHAR(255) NOT NULL,
    `targetUrl` VARCHAR(255) NOT NULL,
    `statusCode` INTEGER NOT NULL,
    `detectedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_broken_links_seoProjectId_fkey`(`seoProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_redirects` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `sourcePath` VARCHAR(255) NOT NULL,
    `targetPath` VARCHAR(255) NOT NULL,
    `type` ENUM('R301', 'R302', 'R307', 'R308') NOT NULL DEFAULT 'R301',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_redirects_seoProjectId_fkey`(`seoProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_sitemaps` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `sitemapUrl` VARCHAR(255) NOT NULL,
    `xmlContent` LONGTEXT NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_sitemaps_seoProjectId_fkey`(`seoProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_robots` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_robots_seoProjectId_fkey`(`seoProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_schemas` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `urlPath` VARCHAR(255) NOT NULL,
    `type` ENUM('ORGANIZATION', 'LOCAL_BUSINESS', 'FAQ', 'ARTICLE', 'PRODUCT', 'BREADCRUMB', 'EVENT', 'PERSON', 'WEBSITE') NOT NULL,
    `jsonLdContent` TEXT NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_schemas_seoProjectId_fkey`(`seoProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_meta_templates` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `urlPattern` VARCHAR(255) NOT NULL,
    `titlePattern` VARCHAR(255) NOT NULL,
    `descriptionPattern` VARCHAR(255) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_meta_templates_seoProjectId_fkey`(`seoProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_recommendations` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `priority` VARCHAR(50) NOT NULL,
    `impactScore` INTEGER NOT NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_recommendations_seoProjectId_fkey`(`seoProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_reports` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `reportUrl` VARCHAR(255) NOT NULL,
    `createdById` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_reports_createdById_fkey`(`createdById`),
    INDEX `seo_reports_seoProjectId_fkey`(`seoProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_gsc_properties` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `siteUrl` VARCHAR(255) NOT NULL,
    `clicks` INTEGER NOT NULL DEFAULT 0,
    `impressions` INTEGER NOT NULL DEFAULT 0,
    `ctr` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `position` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_gsc_properties_seoProjectId_fkey`(`seoProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_ga_properties` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `measurementId` VARCHAR(100) NOT NULL,
    `activeUsers` INTEGER NOT NULL DEFAULT 0,
    `sessions` INTEGER NOT NULL DEFAULT 0,
    `bounceRate` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_ga_properties_seoProjectId_fkey`(`seoProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_crawl_logs` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `urlPath` VARCHAR(255) NOT NULL,
    `statusCode` INTEGER NOT NULL,
    `loadTimeMs` INTEGER NOT NULL,
    `pageSizeBytes` INTEGER NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `seo_crawl_logs_seoProjectId_fkey`(`seoProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_keys` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `keyHash` VARCHAR(255) NOT NULL,
    `prefix` VARCHAR(16) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `scopes` TEXT NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `expiresAt` TIMESTAMP(0) NULL,
    `lastUsedAt` TIMESTAMP(0) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `api_keys_keyHash_key`(`keyHash`),
    INDEX `api_keys_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_key_usages` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `apiKeyId` CHAR(36) NOT NULL,
    `requestCount` INTEGER NOT NULL DEFAULT 0,
    `recordedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `api_key_usages_apiKeyId_fkey`(`apiKeyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_rate_limits` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `scope` ENUM('USER', 'API_KEY', 'IP') NOT NULL DEFAULT 'USER',
    `identifier` VARCHAR(255) NOT NULL,
    `limitCount` INTEGER NOT NULL,
    `windowSeconds` INTEGER NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_logs` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NULL,
    `apiKeyId` CHAR(36) NULL,
    `ipAddress` VARCHAR(45) NULL,
    `method` VARCHAR(10) NOT NULL,
    `path` VARCHAR(255) NOT NULL,
    `statusCode` INTEGER NOT NULL,
    `latencyMs` INTEGER NOT NULL,
    `logType` ENUM('REQUEST', 'RESPONSE', 'ERROR') NOT NULL DEFAULT 'REQUEST',
    `requestBody` LONGTEXT NULL,
    `responseBody` LONGTEXT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `api_logs_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_versions` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `versionString` VARCHAR(16) NOT NULL,
    `status` ENUM('ACTIVE', 'DEPRECATED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `api_versions_versionString_key`(`versionString`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_endpoints` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `apiVersionId` CHAR(36) NOT NULL,
    `method` VARCHAR(10) NOT NULL,
    `path` VARCHAR(255) NOT NULL,
    `isRequiredScope` VARCHAR(100) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `api_endpoints_apiVersionId_fkey`(`apiVersionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_oauth_applications` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `clientId` CHAR(36) NOT NULL,
    `clientSecret` VARCHAR(255) NOT NULL,
    `redirectUris` TEXT NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `api_oauth_applications_clientId_key`(`clientId`),
    INDEX `api_oauth_applications_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_oauth_tokens` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `oauthApplicationId` CHAR(36) NOT NULL,
    `accessToken` VARCHAR(255) NOT NULL,
    `refreshToken` VARCHAR(255) NULL,
    `expiresAt` TIMESTAMP(0) NOT NULL,
    `scopes` TEXT NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `api_oauth_tokens_accessToken_key`(`accessToken`),
    UNIQUE INDEX `api_oauth_tokens_refreshToken_key`(`refreshToken`),
    INDEX `api_oauth_tokens_oauthApplicationId_fkey`(`oauthApplicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_integrations` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NULL,
    `projectId` CHAR(36) NULL,
    `provider` ENUM('GOOGLE', 'MICROSOFT', 'GITHUB', 'GITLAB', 'SLACK', 'ZOOM', 'STRIPE', 'RAZORPAY', 'PAYPAL', 'TWILIO', 'WHATSAPP', 'CUSTOM') NOT NULL,
    `status` ENUM('CONNECTED', 'DISCONNECTED', 'FAILED') NOT NULL DEFAULT 'CONNECTED',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `api_integrations_clientId_fkey`(`clientId`),
    INDEX `api_integrations_projectId_fkey`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_integration_credentials` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `integrationId` CHAR(36) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `encryptedValue` TEXT NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `api_integration_credentials_integrationId_fkey`(`integrationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_webhooks` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `targetUrl` VARCHAR(255) NOT NULL,
    `eventTypes` VARCHAR(255) NOT NULL,
    `secretToken` VARCHAR(255) NOT NULL,
    `status` ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `userId` CHAR(36) NULL,
    `projectId` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `api_webhooks_projectId_fkey`(`projectId`),
    INDEX `api_webhooks_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_webhook_retries` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `webhookId` CHAR(36) NOT NULL,
    `targetUrl` VARCHAR(255) NOT NULL,
    `payloadJson` LONGTEXT NOT NULL,
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `nextAttemptAt` TIMESTAMP(0) NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'RETRYING') NOT NULL DEFAULT 'PENDING',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `api_webhook_retries_webhookId_fkey`(`webhookId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_developer_applications` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `clientId` CHAR(36) NOT NULL,
    `clientSecret` VARCHAR(255) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `teamId` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `api_developer_applications_clientId_key`(`clientId`),
    INDEX `api_developer_applications_teamId_fkey`(`teamId`),
    INDEX `api_developer_applications_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_developer_teams` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_developer_members` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `teamId` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `api_developer_members_teamId_fkey`(`teamId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_sdk_packages` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `language` ENUM('TYPESCRIPT', 'JAVASCRIPT', 'PYTHON', 'PHP', 'JAVA', 'CSHARP') NOT NULL,
    `versionString` VARCHAR(30) NOT NULL,
    `downloadUrl` VARCHAR(255) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_secret_vaults` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `secretName` VARCHAR(100) NOT NULL,
    `secretType` ENUM('API_KEY', 'ACCESS_TOKEN', 'REFRESH_TOKEN', 'CLIENT_SECRET') NOT NULL,
    `encryptedPayload` TEXT NOT NULL,
    `keyVersion` INTEGER NOT NULL DEFAULT 1,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_analytics` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `endpointPath` VARCHAR(255) NOT NULL,
    `method` VARCHAR(10) NOT NULL,
    `totalRequests` INTEGER NOT NULL DEFAULT 0,
    `errorRequests` INTEGER NOT NULL DEFAULT 0,
    `avgLatencyMs` INTEGER NOT NULL DEFAULT 0,
    `recordedDate` DATE NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_subscriptions` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `monthlyLimit` INTEGER NOT NULL DEFAULT 10000,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_scopes` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `api_scopes_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_audits` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `details` TEXT NOT NULL,
    `performedBy` CHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_external_events` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `provider` ENUM('GOOGLE', 'MICROSOFT', 'GITHUB', 'GITLAB', 'SLACK', 'ZOOM', 'STRIPE', 'RAZORPAY', 'PAYPAL', 'TWILIO', 'WHATSAPP', 'CUSTOM') NOT NULL,
    `eventPayload` LONGTEXT NOT NULL,
    `processedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_integration_history` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `integrationId` CHAR(36) NOT NULL,
    `status` ENUM('CONNECTED', 'DISCONNECTED', 'FAILED') NOT NULL,
    `errorDetails` TEXT NULL,
    `loggedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedBy` CHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `api_integration_history_integrationId_fkey`(`integrationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `systemsetting` (
    `id` CHAR(36) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,

    UNIQUE INDEX `SystemSetting_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_activity_types` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,

    UNIQUE INDEX `seo_activity_types_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_daily_work_logs` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `logDate` DATE NOT NULL,
    `executiveId` CHAR(36) NOT NULL,
    `remarks` TEXT NULL,
    `remarksByManager` TEXT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUIRED') NOT NULL DEFAULT 'DRAFT',
    `totalCount` INTEGER NOT NULL DEFAULT 0,
    `seoTaskId` CHAR(36) NULL,
    `createdById` CHAR(36) NOT NULL,
    `updatedById` CHAR(36) NULL,
    `approvedById` CHAR(36) NULL,
    `approvedAt` TIMESTAMP(0) NULL,
    `rejectedById` CHAR(36) NULL,
    `rejectedAt` TIMESTAMP(0) NULL,
    `submittedAt` TIMESTAMP(0) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,

    UNIQUE INDEX `seo_daily_work_logs_executiveId_seoProjectId_logDate_key`(`executiveId`, `seoProjectId`, `logDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_daily_work_proofs` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `workLogId` CHAR(36) NOT NULL,
    `proofFileUrl` VARCHAR(255) NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `uploadedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_daily_work_log_items` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `workLogId` CHAR(36) NOT NULL,
    `activityTypeId` CHAR(36) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 1,
    `keyword` VARCHAR(255) NULL,
    `targetUrl` VARCHAR(255) NULL,
    `submissionUrl` TEXT NULL,
    `domainAuthority` INTEGER NULL,
    `spamScore` INTEGER NULL,
    `timeSpentMinutes` INTEGER NULL,
    `username` VARCHAR(255) NULL,
    `password` TEXT NULL,
    `anchorText` VARCHAR(255) NULL,
    `remarks` TEXT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUIRED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_monthly_targets` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `executiveId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NULL,
    `month` VARCHAR(7) NOT NULL,
    `activityTypeId` CHAR(36) NOT NULL,
    `targetCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_tasks` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `reviewStatus` VARCHAR(20) NULL,
    `managerRemarks` TEXT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `assignedExecutiveId` CHAR(36) NOT NULL,
    `dueDate` DATE NOT NULL,
    `priority` VARCHAR(20) NOT NULL DEFAULT 'medium',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `activityTypeId` CHAR(36) NULL,
    `createdById` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_task_timelines` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `taskId` CHAR(36) NOT NULL,
    `eventTime` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `userId` CHAR(36) NULL,
    `userName` VARCHAR(255) NULL,
    `action` VARCHAR(100) NOT NULL,
    `remarks` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_credentials` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `platform` VARCHAR(100) NOT NULL,
    `username` VARCHAR(255) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_reminders` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `seoProjectId` CHAR(36) NOT NULL,
    `assignedExecutiveId` CHAR(36) NOT NULL,
    `dueDate` DATE NOT NULL,
    `priority` VARCHAR(20) NOT NULL DEFAULT 'medium',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `createdById` CHAR(36) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,
    `deletedAt` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companies` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `companies_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_features` (
    `id` CHAR(36) NOT NULL,
    `companyId` CHAR(36) NOT NULL,
    `featureKey` VARCHAR(100) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    INDEX `company_features_companyId_fkey`(`companyId`),
    UNIQUE INDEX `company_features_companyId_featureKey_key`(`companyId`, `featureKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_rolepermissions` (
    `A` CHAR(36) NOT NULL,
    `B` CHAR(36) NOT NULL,

    UNIQUE INDEX `_rolepermissions_AB_unique`(`A`, `B`),
    INDEX `_rolepermissions_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ClientToTags` (
    `A` CHAR(36) NOT NULL,
    `B` CHAR(36) NOT NULL,

    UNIQUE INDEX `_ClientToTags_AB_unique`(`A`, `B`),
    INDEX `_ClientToTags_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ProjectToTags` (
    `A` CHAR(36) NOT NULL,
    `B` CHAR(36) NOT NULL,

    UNIQUE INDEX `_ProjectToTags_AB_unique`(`A`, `B`),
    INDEX `_ProjectToTags_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_TaskLabels` (
    `A` CHAR(36) NOT NULL,
    `B` CHAR(36) NOT NULL,

    UNIQUE INDEX `_TaskLabels_AB_unique`(`A`, `B`),
    INDEX `_TaskLabels_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_taskassignees` (
    `A` CHAR(36) NOT NULL,
    `B` CHAR(36) NOT NULL,

    UNIQUE INDEX `_taskassignees_AB_unique`(`A`, `B`),
    INDEX `_taskassignees_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_domaintoinfratags` (
    `A` CHAR(36) NOT NULL,
    `B` CHAR(36) NOT NULL,

    UNIQUE INDEX `_domaintoinfratags_AB_unique`(`A`, `B`),
    INDEX `_domaintoinfratags_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_servertoinfratags` (
    `A` CHAR(36) NOT NULL,
    `B` CHAR(36) NOT NULL,

    UNIQUE INDEX `_servertoinfratags_AB_unique`(`A`, `B`),
    INDEX `_servertoinfratags_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_designationId_fkey` FOREIGN KEY (`designationId`) REFERENCES `designations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_preferences` ADD CONSTRAINT `user_preferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permission_categories` ADD CONSTRAINT `permission_categories_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `permission_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `permission_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_deputyManagerId_fkey` FOREIGN KEY (`deputyManagerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_teams` ADD CONSTRAINT `user_teams_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_teams` ADD CONSTRAINT `user_teams_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `designations` ADD CONSTRAINT `designations_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_histories` ADD CONSTRAINT `password_histories_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `client_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_primaryAddressId_fkey` FOREIGN KEY (`primaryAddressId`) REFERENCES `client_addresses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_primaryContactId_fkey` FOREIGN KEY (`primaryContactId`) REFERENCES `client_contacts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `client_contacts` ADD CONSTRAINT `client_contacts_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `client_addresses` ADD CONSTRAINT `client_addresses_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `client_documents` ADD CONSTRAINT `client_documents_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `client_contracts` ADD CONSTRAINT `client_contracts_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `client_notes` ADD CONSTRAINT `client_notes_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `client_timelines` ADD CONSTRAINT `client_timelines_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `lead_sources`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `lead_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_activities` ADD CONSTRAINT `lead_activities_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_assignments` ADD CONSTRAINT `lead_assignments_assignedById_fkey` FOREIGN KEY (`assignedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_assignments` ADD CONSTRAINT `lead_assignments_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_assignments` ADD CONSTRAINT `lead_assignments_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_assignments` ADD CONSTRAINT `lead_assignments_transferFromId_fkey` FOREIGN KEY (`transferFromId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_timelines` ADD CONSTRAINT `lead_timelines_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pipeline_stages` ADD CONSTRAINT `pipeline_stages_pipelineId_fkey` FOREIGN KEY (`pipelineId`) REFERENCES `pipelines`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `opportunities` ADD CONSTRAINT `opportunities_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `opportunities` ADD CONSTRAINT `opportunities_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `opportunities` ADD CONSTRAINT `opportunities_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `opportunities` ADD CONSTRAINT `opportunities_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `pipeline_stages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `opportunity_items` ADD CONSTRAINT `opportunity_items_opportunityId_fkey` FOREIGN KEY (`opportunityId`) REFERENCES `opportunities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `opportunity_timelines` ADD CONSTRAINT `opportunity_timelines_opportunityId_fkey` FOREIGN KEY (`opportunityId`) REFERENCES `opportunities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_opportunityId_fkey` FOREIGN KEY (`opportunityId`) REFERENCES `opportunities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_pdfGeneratedBy_fkey` FOREIGN KEY (`pdfGeneratedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `proposal_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proposal_items` ADD CONSTRAINT `proposal_items_proposalId_fkey` FOREIGN KEY (`proposalId`) REFERENCES `proposals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proposal_versions` ADD CONSTRAINT `proposal_versions_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proposal_versions` ADD CONSTRAINT `proposal_versions_proposalId_fkey` FOREIGN KEY (`proposalId`) REFERENCES `proposals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proposal_approvals` ADD CONSTRAINT `proposal_approvals_approverId_fkey` FOREIGN KEY (`approverId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proposal_approvals` ADD CONSTRAINT `proposal_approvals_proposalId_fkey` FOREIGN KEY (`proposalId`) REFERENCES `proposals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `project_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_proposalId_fkey` FOREIGN KEY (`proposalId`) REFERENCES `proposals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_phases` ADD CONSTRAINT `project_phases_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_milestones` ADD CONSTRAINT `project_milestones_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_milestones` ADD CONSTRAINT `project_milestones_phaseId_fkey` FOREIGN KEY (`phaseId`) REFERENCES `project_phases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_milestones` ADD CONSTRAINT `project_milestones_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_members` ADD CONSTRAINT `project_members_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_members` ADD CONSTRAINT `project_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_resources` ADD CONSTRAINT `project_resources_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_resources` ADD CONSTRAINT `project_resources_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_dependencies` ADD CONSTRAINT `project_dependencies_dependsOnMilestoneId_fkey` FOREIGN KEY (`dependsOnMilestoneId`) REFERENCES `project_milestones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_dependencies` ADD CONSTRAINT `project_dependencies_dependsOnProjectId_fkey` FOREIGN KEY (`dependsOnProjectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_dependencies` ADD CONSTRAINT `project_dependencies_milestoneId_fkey` FOREIGN KEY (`milestoneId`) REFERENCES `project_milestones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_dependencies` ADD CONSTRAINT `project_dependencies_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_risks` ADD CONSTRAINT `project_risks_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_risks` ADD CONSTRAINT `project_risks_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_issues` ADD CONSTRAINT `project_issues_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_issues` ADD CONSTRAINT `project_issues_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_documents` ADD CONSTRAINT `project_documents_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_timelines` ADD CONSTRAINT `project_timelines_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sprints` ADD CONSTRAINT `sprints_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sprint_goals` ADD CONSTRAINT `sprint_goals_sprintId_fkey` FOREIGN KEY (`sprintId`) REFERENCES `sprints`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_milestoneId_fkey` FOREIGN KEY (`milestoneId`) REFERENCES `project_milestones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_parentTaskId_fkey` FOREIGN KEY (`parentTaskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_priorityId_fkey` FOREIGN KEY (`priorityId`) REFERENCES `task_priorities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_sprintId_fkey` FOREIGN KEY (`sprintId`) REFERENCES `sprints`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `task_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `task_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_checklists` ADD CONSTRAINT `task_checklists_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_checklist_items` ADD CONSTRAINT `task_checklist_items_checklistId_fkey` FOREIGN KEY (`checklistId`) REFERENCES `task_checklists`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_comments` ADD CONSTRAINT `task_comments_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_comments` ADD CONSTRAINT `task_comments_parentCommentId_fkey` FOREIGN KEY (`parentCommentId`) REFERENCES `task_comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_comments` ADD CONSTRAINT `task_comments_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_attachments` ADD CONSTRAINT `task_attachments_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_attachments` ADD CONSTRAINT `task_attachments_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_watchers` ADD CONSTRAINT `task_watchers_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_watchers` ADD CONSTRAINT `task_watchers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_dependencies` ADD CONSTRAINT `task_dependencies_dependsOnTaskId_fkey` FOREIGN KEY (`dependsOnTaskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_dependencies` ADD CONSTRAINT `task_dependencies_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_timelines` ADD CONSTRAINT `task_timelines_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_sessions` ADD CONSTRAINT `work_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_timers` ADD CONSTRAINT `task_timers_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_timers` ADD CONSTRAINT `task_timers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_entries` ADD CONSTRAINT `time_entries_dailyTimesheetId_fkey` FOREIGN KEY (`dailyTimesheetId`) REFERENCES `daily_timesheets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_entries` ADD CONSTRAINT `time_entries_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_entries` ADD CONSTRAINT `time_entries_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_entries` ADD CONSTRAINT `time_entries_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `break_sessions` ADD CONSTRAINT `break_sessions_workSessionId_fkey` FOREIGN KEY (`workSessionId`) REFERENCES `work_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `idle_sessions` ADD CONSTRAINT `idle_sessions_workSessionId_fkey` FOREIGN KEY (`workSessionId`) REFERENCES `work_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `screenshots` ADD CONSTRAINT `screenshots_workSessionId_fkey` FOREIGN KEY (`workSessionId`) REFERENCES `work_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_workSessionId_fkey` FOREIGN KEY (`workSessionId`) REFERENCES `work_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_usages` ADD CONSTRAINT `application_usages_workSessionId_fkey` FOREIGN KEY (`workSessionId`) REFERENCES `work_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `website_usages` ADD CONSTRAINT `website_usages_workSessionId_fkey` FOREIGN KEY (`workSessionId`) REFERENCES `work_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_timesheets` ADD CONSTRAINT `daily_timesheets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `weekly_timesheets` ADD CONSTRAINT `weekly_timesheets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timesheet_approvals` ADD CONSTRAINT `timesheet_approvals_approverId_fkey` FOREIGN KEY (`approverId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timesheet_approvals` ADD CONSTRAINT `timesheet_approvals_weeklyTimesheetId_fkey` FOREIGN KEY (`weeklyTimesheetId`) REFERENCES `weekly_timesheets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productivity_scores` ADD CONSTRAINT `productivity_scores_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `utilization_reports` ADD CONSTRAINT `utilization_reports_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `utilization_reports` ADD CONSTRAINT `utilization_reports_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `expense_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_currencyId_fkey` FOREIGN KEY (`currencyId`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_currencyId_fkey` FOREIGN KEY (`currencyId`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `purchase_items_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `purchases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billable_rates` ADD CONSTRAINT `billable_rates_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billable_rates` ADD CONSTRAINT `billable_rates_currencyId_fkey` FOREIGN KEY (`currencyId`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billable_rates` ADD CONSTRAINT `billable_rates_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billable_rates` ADD CONSTRAINT `billable_rates_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billable_rates` ADD CONSTRAINT `billable_rates_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estimates` ADD CONSTRAINT `estimates_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estimates` ADD CONSTRAINT `estimates_currencyId_fkey` FOREIGN KEY (`currencyId`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estimate_items` ADD CONSTRAINT `estimate_items_estimateId_fkey` FOREIGN KEY (`estimateId`) REFERENCES `estimates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_currencyId_fkey` FOREIGN KEY (`currencyId`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_recurringInvoiceId_fkey` FOREIGN KEY (`recurringInvoiceId`) REFERENCES `recurring_invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_timeEntryId_fkey` FOREIGN KEY (`timeEntryId`) REFERENCES `time_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_payments` ADD CONSTRAINT `invoice_payments_paymentMethodId_fkey` FOREIGN KEY (`paymentMethodId`) REFERENCES `payment_methods`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_payment_allocations` ADD CONSTRAINT `invoice_payment_allocations_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_payment_allocations` ADD CONSTRAINT `invoice_payment_allocations_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `invoice_payments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recurring_invoices` ADD CONSTRAINT `recurring_invoices_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recurring_invoices` ADD CONSTRAINT `recurring_invoices_currencyId_fkey` FOREIGN KEY (`currencyId`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recurring_invoices` ADD CONSTRAINT `recurring_invoices_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_notes` ADD CONSTRAINT `credit_notes_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `debit_notes` ADD CONSTRAINT `debit_notes_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_billings` ADD CONSTRAINT `project_billings_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_timelines` ADD CONSTRAINT `invoice_timelines_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journal_lines` ADD CONSTRAINT `journal_lines_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `ledger_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journal_lines` ADD CONSTRAINT `journal_lines_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `journal_entries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `divisions` ADD CONSTRAINT `divisions_businessUnitId_fkey` FOREIGN KEY (`businessUnitId`) REFERENCES `business_units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_profiles` ADD CONSTRAINT `employee_profiles_businessUnitId_fkey` FOREIGN KEY (`businessUnitId`) REFERENCES `business_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_profiles` ADD CONSTRAINT `employee_profiles_divisionId_fkey` FOREIGN KEY (`divisionId`) REFERENCES `divisions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_profiles` ADD CONSTRAINT `employee_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_documents` ADD CONSTRAINT `employee_documents_employeeProfileId_fkey` FOREIGN KEY (`employeeProfileId`) REFERENCES `employee_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emergency_contacts` ADD CONSTRAINT `emergency_contacts_employeeProfileId_fkey` FOREIGN KEY (`employeeProfileId`) REFERENCES `employee_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_skills` ADD CONSTRAINT `employee_skills_employeeProfileId_fkey` FOREIGN KEY (`employeeProfileId`) REFERENCES `employee_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_certifications` ADD CONSTRAINT `employee_certifications_employeeProfileId_fkey` FOREIGN KEY (`employeeProfileId`) REFERENCES `employee_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_experiences` ADD CONSTRAINT `employee_experiences_employeeProfileId_fkey` FOREIGN KEY (`employeeProfileId`) REFERENCES `employee_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_educations` ADD CONSTRAINT `employee_educations_employeeProfileId_fkey` FOREIGN KEY (`employeeProfileId`) REFERENCES `employee_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_employeeProfileId_fkey` FOREIGN KEY (`employeeProfileId`) REFERENCES `employee_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_workSessionId_fkey` FOREIGN KEY (`workSessionId`) REFERENCES `work_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shift_assignments` ADD CONSTRAINT `shift_assignments_employeeProfileId_fkey` FOREIGN KEY (`employeeProfileId`) REFERENCES `employee_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shift_assignments` ADD CONSTRAINT `shift_assignments_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `shifts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_employeeProfileId_fkey` FOREIGN KEY (`employeeProfileId`) REFERENCES `employee_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_leaveTypeId_fkey` FOREIGN KEY (`leaveTypeId`) REFERENCES `leave_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_employeeProfileId_fkey` FOREIGN KEY (`employeeProfileId`) REFERENCES `employee_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_leaveTypeId_fkey` FOREIGN KEY (`leaveTypeId`) REFERENCES `leave_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_approvals` ADD CONSTRAINT `leave_approvals_approverId_fkey` FOREIGN KEY (`approverId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_approvals` ADD CONSTRAINT `leave_approvals_leaveRequestId_fkey` FOREIGN KEY (`leaveRequestId`) REFERENCES `leave_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `overtime_requests` ADD CONSTRAINT `overtime_requests_employeeProfileId_fkey` FOREIGN KEY (`employeeProfileId`) REFERENCES `employee_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_goals` ADD CONSTRAINT `performance_goals_employeeProfileId_fkey` FOREIGN KEY (`employeeProfileId`) REFERENCES `employee_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `performance_cycles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_employeeProfileId_fkey` FOREIGN KEY (`employeeProfileId`) REFERENCES `employee_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_improvement_plans` ADD CONSTRAINT `performance_improvement_plans_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `performance_reviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_enrollments` ADD CONSTRAINT `training_enrollments_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `training_courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_enrollments` ADD CONSTRAINT `training_enrollments_employeeProfileId_fkey` FOREIGN KEY (`employeeProfileId`) REFERENCES `employee_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_certificates` ADD CONSTRAINT `training_certificates_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `training_enrollments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_assignments` ADD CONSTRAINT `asset_assignments_employeeProfileId_fkey` FOREIGN KEY (`employeeProfileId`) REFERENCES `employee_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_timelines` ADD CONSTRAINT `employee_timelines_employeeProfileId_fkey` FOREIGN KEY (`employeeProfileId`) REFERENCES `employee_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hosting_accounts` ADD CONSTRAINT `hosting_accounts_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hosting_accounts` ADD CONSTRAINT `hosting_accounts_hostingPlanId_fkey` FOREIGN KEY (`hostingPlanId`) REFERENCES `hosting_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hosting_accounts` ADD CONSTRAINT `hosting_accounts_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hosting_accounts` ADD CONSTRAINT `hosting_accounts_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `infrastructure_providers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hosting_plans` ADD CONSTRAINT `hosting_plans_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `infrastructure_providers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servers` ADD CONSTRAINT `servers_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servers` ADD CONSTRAINT `servers_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servers` ADD CONSTRAINT `servers_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `infrastructure_providers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `server_environments` ADD CONSTRAINT `server_environments_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `server_environments` ADD CONSTRAINT `server_environments_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deployments` ADD CONSTRAINT `deployments_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deployments` ADD CONSTRAINT `deployments_repositoryBranchId_fkey` FOREIGN KEY (`repositoryBranchId`) REFERENCES `repository_branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deployments` ADD CONSTRAINT `deployments_serverEnvironmentId_fkey` FOREIGN KEY (`serverEnvironmentId`) REFERENCES `server_environments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deployments` ADD CONSTRAINT `deployments_startedById_fkey` FOREIGN KEY (`startedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deployment_histories` ADD CONSTRAINT `deployment_histories_deploymentId_fkey` FOREIGN KEY (`deploymentId`) REFERENCES `deployments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repositories` ADD CONSTRAINT `repositories_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repository_branches` ADD CONSTRAINT `repository_branches_repositoryId_fkey` FOREIGN KEY (`repositoryId`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `domains` ADD CONSTRAINT `domains_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `domains` ADD CONSTRAINT `domains_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `domains` ADD CONSTRAINT `domains_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sub_domains` ADD CONSTRAINT `sub_domains_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `domains`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dns_records` ADD CONSTRAINT `dns_records_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `domains`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ssl_certificates` ADD CONSTRAINT `ssl_certificates_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `domains`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ssl_certificates` ADD CONSTRAINT `ssl_certificates_subDomainId_fkey` FOREIGN KEY (`subDomainId`) REFERENCES `sub_domains`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backups` ADD CONSTRAINT `backups_hostingAccountId_fkey` FOREIGN KEY (`hostingAccountId`) REFERENCES `hosting_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backups` ADD CONSTRAINT `backups_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `backup_schedules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backups` ADD CONSTRAINT `backups_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backup_schedules` ADD CONSTRAINT `backup_schedules_hostingAccountId_fkey` FOREIGN KEY (`hostingAccountId`) REFERENCES `hosting_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backup_schedules` ADD CONSTRAINT `backup_schedules_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monitoring_checks` ADD CONSTRAINT `monitoring_checks_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `domains`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monitoring_checks` ADD CONSTRAINT `monitoring_checks_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monitoring_checks` ADD CONSTRAINT `monitoring_checks_sslCertificateId_fkey` FOREIGN KEY (`sslCertificateId`) REFERENCES `ssl_certificates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `domains`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `infrastructure_credentials` ADD CONSTRAINT `infrastructure_credentials_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `domains`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `infrastructure_credentials` ADD CONSTRAINT `infrastructure_credentials_hostingAccountId_fkey` FOREIGN KEY (`hostingAccountId`) REFERENCES `hosting_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `infrastructure_credentials` ADD CONSTRAINT `infrastructure_credentials_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_definitions` ADD CONSTRAINT `report_definitions_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `report_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_versions` ADD CONSTRAINT `report_versions_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_versions` ADD CONSTRAINT `report_versions_reportDefinitionId_fkey` FOREIGN KEY (`reportDefinitionId`) REFERENCES `report_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dashboards` ADD CONSTRAINT `dashboards_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dashboards` ADD CONSTRAINT `dashboards_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `dashboard_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dashboard_widgets` ADD CONSTRAINT `dashboard_widgets_dashboardId_fkey` FOREIGN KEY (`dashboardId`) REFERENCES `dashboards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dashboard_widgets` ADD CONSTRAINT `dashboard_widgets_widgetId_fkey` FOREIGN KEY (`widgetId`) REFERENCES `widgets_library`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dashboard_shares` ADD CONSTRAINT `dashboard_shares_dashboardId_fkey` FOREIGN KEY (`dashboardId`) REFERENCES `dashboards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dashboard_shares` ADD CONSTRAINT `dashboard_shares_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dashboard_shares` ADD CONSTRAINT `dashboard_shares_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_filters` ADD CONSTRAINT `saved_filters_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_filters` ADD CONSTRAINT `saved_filters_reportDefinitionId_fkey` FOREIGN KEY (`reportDefinitionId`) REFERENCES `report_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_filters` ADD CONSTRAINT `saved_filters_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scheduled_reports` ADD CONSTRAINT `scheduled_reports_reportDefinitionId_fkey` FOREIGN KEY (`reportDefinitionId`) REFERENCES `report_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scheduled_reports` ADD CONSTRAINT `scheduled_reports_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_executions` ADD CONSTRAINT `report_executions_reportDefinitionId_fkey` FOREIGN KEY (`reportDefinitionId`) REFERENCES `report_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_executions` ADD CONSTRAINT `report_executions_scheduledReportId_fkey` FOREIGN KEY (`scheduledReportId`) REFERENCES `scheduled_reports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_executions` ADD CONSTRAINT `report_executions_triggeredById_fkey` FOREIGN KEY (`triggeredById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_exports` ADD CONSTRAINT `report_exports_generatedById_fkey` FOREIGN KEY (`generatedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_exports` ADD CONSTRAINT `report_exports_reportDefinitionId_fkey` FOREIGN KEY (`reportDefinitionId`) REFERENCES `report_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_favorites` ADD CONSTRAINT `report_favorites_reportDefinitionId_fkey` FOREIGN KEY (`reportDefinitionId`) REFERENCES `report_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_favorites` ADD CONSTRAINT `report_favorites_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recently_opened_reports` ADD CONSTRAINT `recently_opened_reports_reportDefinitionId_fkey` FOREIGN KEY (`reportDefinitionId`) REFERENCES `report_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recently_opened_reports` ADD CONSTRAINT `recently_opened_reports_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_snapshots` ADD CONSTRAINT `kpi_snapshots_kpiDefinitionId_fkey` FOREIGN KEY (`kpiDefinitionId`) REFERENCES `kpi_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `analytics_insights` ADD CONSTRAINT `analytics_insights_dashboardId_fkey` FOREIGN KEY (`dashboardId`) REFERENCES `dashboards`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `analytics_insights` ADD CONSTRAINT `analytics_insights_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `report_definitions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_steps` ADD CONSTRAINT `workflow_steps_workflowDefinitionId_fkey` FOREIGN KEY (`workflowDefinitionId`) REFERENCES `workflow_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_executions` ADD CONSTRAINT `workflow_executions_initiatorId_fkey` FOREIGN KEY (`initiatorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_executions` ADD CONSTRAINT `workflow_executions_workflowDefinitionId_fkey` FOREIGN KEY (`workflowDefinitionId`) REFERENCES `workflow_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `automation_executions` ADD CONSTRAINT `automation_executions_automationRuleId_fkey` FOREIGN KEY (`automationRuleId`) REFERENCES `automation_rules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_requests` ADD CONSTRAINT `approval_requests_approverId_fkey` FOREIGN KEY (`approverId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_requests` ADD CONSTRAINT `approval_requests_workflowExecutionId_fkey` FOREIGN KEY (`workflowExecutionId`) REFERENCES `workflow_executions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_history` ADD CONSTRAINT `approval_history_approvalRequestId_fkey` FOREIGN KEY (`approvalRequestId`) REFERENCES `approval_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `escalation_rules` ADD CONSTRAINT `escalation_rules_workflowStepId_fkey` FOREIGN KEY (`workflowStepId`) REFERENCES `workflow_steps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `communication_logs` ADD CONSTRAINT `communication_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `webhook_deliveries` ADD CONSTRAINT `webhook_deliveries_webhookEventId_fkey` FOREIGN KEY (`webhookEventId`) REFERENCES `webhook_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `webhook_deliveries` ADD CONSTRAINT `webhook_deliveries_webhookId_fkey` FOREIGN KEY (`webhookId`) REFERENCES `api_webhooks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_projects` ADD CONSTRAINT `seo_projects_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_projects` ADD CONSTRAINT `seo_projects_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_projects` ADD CONSTRAINT `seo_projects_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_keywords` ADD CONSTRAINT `seo_keywords_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `seo_keyword_groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_keywords` ADD CONSTRAINT `seo_keywords_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_keyword_groups` ADD CONSTRAINT `seo_keyword_groups_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_keyword_rankings` ADD CONSTRAINT `seo_keyword_rankings_keywordId_fkey` FOREIGN KEY (`keywordId`) REFERENCES `seo_keywords`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_competitors` ADD CONSTRAINT `seo_competitors_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_competitor_keywords` ADD CONSTRAINT `seo_competitor_keywords_competitorId_fkey` FOREIGN KEY (`competitorId`) REFERENCES `seo_competitors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_pages` ADD CONSTRAINT `seo_pages_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_technical_audits` ADD CONSTRAINT `seo_technical_audits_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_audit_issues` ADD CONSTRAINT `seo_audit_issues_technicalAuditId_fkey` FOREIGN KEY (`technicalAuditId`) REFERENCES `seo_technical_audits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_backlinks` ADD CONSTRAINT `seo_backlinks_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_broken_links` ADD CONSTRAINT `seo_broken_links_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_redirects` ADD CONSTRAINT `seo_redirects_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_sitemaps` ADD CONSTRAINT `seo_sitemaps_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_robots` ADD CONSTRAINT `seo_robots_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_schemas` ADD CONSTRAINT `seo_schemas_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_meta_templates` ADD CONSTRAINT `seo_meta_templates_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_recommendations` ADD CONSTRAINT `seo_recommendations_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_reports` ADD CONSTRAINT `seo_reports_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_reports` ADD CONSTRAINT `seo_reports_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_gsc_properties` ADD CONSTRAINT `seo_gsc_properties_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_ga_properties` ADD CONSTRAINT `seo_ga_properties_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_crawl_logs` ADD CONSTRAINT `seo_crawl_logs_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_key_usages` ADD CONSTRAINT `api_key_usages_apiKeyId_fkey` FOREIGN KEY (`apiKeyId`) REFERENCES `api_keys`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_logs` ADD CONSTRAINT `api_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_endpoints` ADD CONSTRAINT `api_endpoints_apiVersionId_fkey` FOREIGN KEY (`apiVersionId`) REFERENCES `api_versions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_oauth_applications` ADD CONSTRAINT `api_oauth_applications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_oauth_tokens` ADD CONSTRAINT `api_oauth_tokens_oauthApplicationId_fkey` FOREIGN KEY (`oauthApplicationId`) REFERENCES `api_oauth_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_integrations` ADD CONSTRAINT `api_integrations_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_integrations` ADD CONSTRAINT `api_integrations_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_integration_credentials` ADD CONSTRAINT `api_integration_credentials_integrationId_fkey` FOREIGN KEY (`integrationId`) REFERENCES `api_integrations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_webhooks` ADD CONSTRAINT `api_webhooks_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_webhooks` ADD CONSTRAINT `api_webhooks_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_webhook_retries` ADD CONSTRAINT `api_webhook_retries_webhookId_fkey` FOREIGN KEY (`webhookId`) REFERENCES `api_webhooks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_developer_applications` ADD CONSTRAINT `api_developer_applications_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `api_developer_teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_developer_applications` ADD CONSTRAINT `api_developer_applications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_developer_members` ADD CONSTRAINT `api_developer_members_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `api_developer_teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_integration_history` ADD CONSTRAINT `api_integration_history_integrationId_fkey` FOREIGN KEY (`integrationId`) REFERENCES `api_integrations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_daily_work_logs` ADD CONSTRAINT `seo_daily_work_logs_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_daily_work_logs` ADD CONSTRAINT `seo_daily_work_logs_executiveId_fkey` FOREIGN KEY (`executiveId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_daily_work_logs` ADD CONSTRAINT `seo_daily_work_logs_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_daily_work_logs` ADD CONSTRAINT `seo_daily_work_logs_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_daily_work_logs` ADD CONSTRAINT `seo_daily_work_logs_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_daily_work_logs` ADD CONSTRAINT `seo_daily_work_logs_rejectedById_fkey` FOREIGN KEY (`rejectedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_daily_work_logs` ADD CONSTRAINT `seo_daily_work_logs_seoTaskId_fkey` FOREIGN KEY (`seoTaskId`) REFERENCES `seo_tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_daily_work_proofs` ADD CONSTRAINT `seo_daily_work_proofs_workLogId_fkey` FOREIGN KEY (`workLogId`) REFERENCES `seo_daily_work_logs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_daily_work_log_items` ADD CONSTRAINT `seo_daily_work_log_items_workLogId_fkey` FOREIGN KEY (`workLogId`) REFERENCES `seo_daily_work_logs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_daily_work_log_items` ADD CONSTRAINT `seo_daily_work_log_items_activityTypeId_fkey` FOREIGN KEY (`activityTypeId`) REFERENCES `seo_activity_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_monthly_targets` ADD CONSTRAINT `seo_monthly_targets_executiveId_fkey` FOREIGN KEY (`executiveId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_monthly_targets` ADD CONSTRAINT `seo_monthly_targets_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_monthly_targets` ADD CONSTRAINT `seo_monthly_targets_activityTypeId_fkey` FOREIGN KEY (`activityTypeId`) REFERENCES `seo_activity_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_tasks` ADD CONSTRAINT `seo_tasks_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_tasks` ADD CONSTRAINT `seo_tasks_assignedExecutiveId_fkey` FOREIGN KEY (`assignedExecutiveId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_tasks` ADD CONSTRAINT `seo_tasks_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_tasks` ADD CONSTRAINT `seo_tasks_activityTypeId_fkey` FOREIGN KEY (`activityTypeId`) REFERENCES `seo_activity_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_task_timelines` ADD CONSTRAINT `seo_task_timelines_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `seo_tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_task_timelines` ADD CONSTRAINT `seo_task_timelines_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_credentials` ADD CONSTRAINT `seo_credentials_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_reminders` ADD CONSTRAINT `seo_reminders_seoProjectId_fkey` FOREIGN KEY (`seoProjectId`) REFERENCES `seo_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_reminders` ADD CONSTRAINT `seo_reminders_assignedExecutiveId_fkey` FOREIGN KEY (`assignedExecutiveId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_reminders` ADD CONSTRAINT `seo_reminders_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_features` ADD CONSTRAINT `company_features_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_rolepermissions` ADD CONSTRAINT `_rolepermissions_A_fkey` FOREIGN KEY (`A`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_rolepermissions` ADD CONSTRAINT `_rolepermissions_B_fkey` FOREIGN KEY (`B`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ClientToTags` ADD CONSTRAINT `_ClientToTags_A_fkey` FOREIGN KEY (`A`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ClientToTags` ADD CONSTRAINT `_ClientToTags_B_fkey` FOREIGN KEY (`B`) REFERENCES `client_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ProjectToTags` ADD CONSTRAINT `_ProjectToTags_A_fkey` FOREIGN KEY (`A`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ProjectToTags` ADD CONSTRAINT `_ProjectToTags_B_fkey` FOREIGN KEY (`B`) REFERENCES `project_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_TaskLabels` ADD CONSTRAINT `_TaskLabels_A_fkey` FOREIGN KEY (`A`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_TaskLabels` ADD CONSTRAINT `_TaskLabels_B_fkey` FOREIGN KEY (`B`) REFERENCES `task_labels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_taskassignees` ADD CONSTRAINT `_taskassignees_A_fkey` FOREIGN KEY (`A`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_taskassignees` ADD CONSTRAINT `_taskassignees_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_domaintoinfratags` ADD CONSTRAINT `_domaintoinfratags_A_fkey` FOREIGN KEY (`A`) REFERENCES `domains`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_domaintoinfratags` ADD CONSTRAINT `_domaintoinfratags_B_fkey` FOREIGN KEY (`B`) REFERENCES `infrastructure_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_servertoinfratags` ADD CONSTRAINT `_servertoinfratags_A_fkey` FOREIGN KEY (`A`) REFERENCES `infrastructure_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_servertoinfratags` ADD CONSTRAINT `_servertoinfratags_B_fkey` FOREIGN KEY (`B`) REFERENCES `servers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
