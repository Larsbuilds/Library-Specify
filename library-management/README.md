# Library Management System

This project implements a library management system based on the Specify4IT specification (ichart.pl). The implementation follows a strict type-safe approach using TypeScript and Redux Toolkit.

## Specification Implementation Status

### Member Management
✅ Member State Management (lib08-13)
- Member addition, deletion, and modification
- Member status tracking (permitted, restricted, suspended)
- Member state validation

✅ Member Borrowing Controls (lib28-31)
- Borrowing status tracking (UNDER_LIMIT, OVER_LIMIT)
- Automatic status updates based on loan count
- Validation of borrowing limits

✅ Member Deletion Safety (lib14)
- Prevention of member deletion with active loans
- Data integrity protection

### Loan Management
✅ Loan Flow Implementation (lib03-07)
- Request validation
- Loan approval process
- Return handling
- Status tracking (requested, approved, overdue)

✅ Loan Limits (lib32-33)
- Maximum loans per member enforcement
- Total loans tracking
- Borrowing permission validation

### Book Management
✅ Book State Management (lib15-27)
- Book availability tracking
- Purchase and deletion controls
- Status updates (available, borrowed, reserved)

## Technical Implementation

### Type Safety
- Comprehensive TypeScript interfaces for all entities
- Redux Toolkit for type-safe state management
- Middleware for constraint validation

### State Management
- Redux store with slices for books, members, and loans
- Action validation middleware
- Constraint enforcement through TypeScript types

### Key Features
1. **Type-Safe Actions**: All actions are properly typed with PayloadAction
2. **Constraint Middleware**: Validates all operations against ichart.pl rules
3. **Member Status Control**: Automatic status updates based on borrowing activity
4. **Data Integrity**: Prevents invalid operations through TypeScript and runtime checks

## Development

### Prerequisites
- Node.js
- npm or yarn
- TypeScript

### Setup
```bash
cd library-management
npm install
npm start
```

## Testing
The system includes validation for all constraints specified in ichart.pl, ensuring:
- Member borrowing limits
- Book availability rules
- Loan status transitions
- Data integrity constraints

## Future Enhancements
- Calendar integration (lib42-47)
- Enhanced reporting features
- UI improvements for constraint feedback
- Additional validation rules from future specs
