# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a financial management system (Sistema de Gestão Financeira) designed to manage payments, attendants (atendentes), travelers (tripeiros), expenses, and financial closing reports. The system includes both a main application and an administrative panel.

## System Architecture

### Core Business Entities
- **Pagamentos (Payments)**: Financial transactions with associated commissions
- **Atendentes (Attendants)**: Service providers who earn commissions from payments
- **Tripeiros (Travelers)**: Clients who can have multiple accounts and generate receivables
- **Despesas (Expenses)**: System expenses with categorization and period totalization
- **Recebimentos (Receipts)**: Payment records from travelers including bank details
- **Fechamento Financeiro (Financial Closing)**: Period summaries with PDF/WhatsApp export capabilities

### Key Features
- Multi-tenant architecture with user management via admin panel
- Automatic commission calculations for attendants
- Dashboard with real-time financial metrics
- Audit logging for all administrative actions
- Export capabilities (PDF and WhatsApp integration)

## Development Guidelines

### When implementing new features:
1. Follow the priority levels defined in requisitos-funcionais.md (Essential > High)
2. Ensure all financial calculations maintain precision (use appropriate decimal types)
3. Implement audit logging for all data modifications
4. Consider multi-tenancy implications for all database operations

### Database Considerations
- Design for multi-tenant architecture from the start
- Include soft deletes for audit trail preservation
- Implement proper indexing for report generation performance
- Store monetary values with appropriate precision

### Security Requirements
- Implement role-based access control (RBAC)
- Separate admin panel authentication from main application
- Log all administrative actions with user identification
- Validate tenant isolation in all queries

### API Design
- RESTful endpoints for CRUD operations
- Separate endpoints for admin operations
- Include pagination for list operations
- Implement proper error handling and validation

### Frontend Considerations
- Dashboard must display real-time metrics
- Responsive design for mobile access
- Export functionality for PDF generation
- WhatsApp integration for report sharing
- **NEVER use mocked data in frontend components** - always integrate with real backend APIs
- All data displayed must come from actual database queries through the API
- Do not create placeholder or example data in frontend code

## Functional Requirements Reference

The complete functional requirements are documented in requisitos-funcionais.md. Key requirements include:
- RF001-RF007: Core business functionality (Essential priority)
- RF008: User management in admin panel (Essential priority)
- RF009-RF010: Metrics and audit logging (High priority)