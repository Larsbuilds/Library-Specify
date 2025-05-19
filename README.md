# Library Management System

This project implements a library management system based on the Specify4IT specification (ichart.pl). The implementation follows a strict type-safe approach using TypeScript and Redux Toolkit.

## Specification Implementation Status

### Complete Specification Checklist

#### Book Operations (lib01-02, lib15-21)
✅ lib01 - Book purchase to current state
✅ lib02 - Book current to available state
✅ lib15 - Book modification to current
✅ lib16 - Book deletion to current
✅ lib17 - Book current to purchase validation
✅ lib18 - Book current to modify validation
✅ lib19 - Book current to delete validation
✅ lib20 - Book available to loan request
✅ lib21 - Book available to delete validation

#### Loan Operations (lib03-07, lib22-27)
✅ lib03 - Member permission for loan request
✅ lib04 - Loan request to approved
✅ lib05 - Loan approved to returned
✅ lib06 - Loan returned to approved deletion
✅ lib07 - Loan approved to book available
✅ lib22 - Loan current to modify validation
✅ lib23 - Loan current to delete validation
✅ lib24 - Loan modification to current
✅ lib25 - Loan deletion to current
✅ lib26 - Loan deletion to book current
✅ lib27 - Loan approved to current

#### Member Operations (lib08-14)
✅ lib08 - Member deletion to current
✅ lib09 - Member modification to current
✅ lib10 - Member addition to current
✅ lib11 - Member current to delete validation
✅ lib12 - Member current to modify validation
✅ lib13 - Member current to add validation
✅ lib14 - Loan current to member delete validation

#### Member Borrowing & Status (lib28-35)
✅ lib28 - Loan current to member borrowing
✅ lib29 - Member current to borrowing
✅ lib30 - Member borrowing to under limit
✅ lib31 - Member borrowing to over limit
✅ lib32 - Total loans validation for under limit
✅ lib33 - Total loans validation for over limit
✅ lib34 - Member under limit to permitted
✅ lib35 - Member over limit to permitted deletion

#### Total Loans Management (lib36-41)
✅ lib36 - Total loans addition to current
✅ lib37 - Total loans modification to current
✅ lib38 - Total loans deletion to current
✅ lib39 - Total loans current to add validation
✅ lib40 - Total loans current to modify validation
✅ lib41 - Total loans current to delete validation

#### Calendar System (lib42-47)
✅ lib42 - Calendar current to add validation
✅ lib43 - Calendar current to modify validation
✅ lib44 - Calendar current to delete validation
✅ lib45 - Calendar addition to current
✅ lib46 - Calendar modification to current
✅ lib47 - Calendar deletion to current

## Implementation Details

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

### Calendar Management
✅ Calendar Integration (lib42-47)
- System calendar operations
- Date tracking for loans
- Due date management
- Overdue status automation

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
- Enhanced reporting features
- UI improvements for constraint feedback
- Additional validation rules from future specs
- Performance optimizations for large datasets
