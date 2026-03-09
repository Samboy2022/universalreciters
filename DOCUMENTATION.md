# Technical Documentation - Universal Reciters

This document provides technical details on the Universal Reciters platform architecture, database schema, and core functionalities.

## 🗄️ Database Schema (Supabase)

### Tables
- **`profiles`**: User data including `name`, `email`, `state`, `lga`, `ward`, `points`, and `money_balance`.
- **`videos`**: Content for recitation including `title`, `arabic_text`, `video_url`, `thumbnail_url`, and `unlock_fee`.
- **`recitations`**: History of user recitation attempts with `score`, `mistakes`, and `word_results`.
- **`transactions`**: Log of financial operations including `credits` and `debits` for wallet balance management.
- **`conversations`**: Chat conversation meta-data.
- **`conversation_members`**: Linking users to conversations.
- **`messages`**: Individual chat messages.
- **`redemption_pins`**: Coupons that can be redeemed for account balance.
- **`banks`**: List of Nigerian banks supported for withdrawal.

## 🛠️ RPC Functions (Database Side)

### `get_admin_stats()`
Performs server-side aggregation to provide dashboard stats:
- **`totalUsers`**, **`activeUsers`**, **`totalVideos`**, **`totalRecitations`**, **`totalPins`**, **`redeemedPins`**, **`totalTransactions`**.
- **`totalRevenue`**: SUM of debit transactions.
- **`totalUserBalance`**: SUM of current profile balances.
- **`totalPointsBalance`**: SUM of user points.

### `unlock_video(_user_id uuid, _video_id uuid)`
Atomic function to handle content access:
1. Checks if the video is already unlocked.
2. Verifies the user has sufficient balance for the fee.
3. Deducts the fee from `profiles.money_balance`.
4. Inserts a `debit` transaction as confirmation of the unlock.

### `admin_add_balance(_user_id uuid, _amount numeric)`
Securely updates a user's wallet:
1. Increments `profiles.money_balance`.
2. Records a `credit` transaction from `admin_deposit`.

## 🖥️ Core Components

### `VideoPlayer.tsx`
Handles video display, YouTube embedding, and the unlock paywall overlay.

### `RecitationChecker.tsx`
A complex component that manages the recitation session, provides Arabic text highlighting, and calculates the final score based on audio analysis.

### `AdminUsers.tsx`
Comprehensive user management interface featuring:
- Server-side pagination.
- Mobile-responsive card layouts.
- Modal-based user creation and editing.
- Wallet management tool.

## 🎨 Design System

- **Shadcn UI**: Used for most UI components (Modals, Tables, Tabs, Forms).
- **Tailwind CSS**: Utility-first styling with custom colors for `primary`, `success`, `warning`, and `destructive`.
- **Lucide Icons**: Consistent iconography throughout the platform.
