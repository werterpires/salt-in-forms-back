# Overview

This is a NestJS-based backend application called "salt-informs-back" that manages form systems, user management, and process workflows. The application provides a comprehensive platform for creating and managing structured forms with complex validation rules, user authentication and authorization, and process management capabilities. It appears to be designed for organizational use cases involving candidate evaluation, ministerial forms, and administrative workflows.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Framework and Core Technologies
- **NestJS Framework**: Modern Node.js framework using TypeScript with decorators and dependency injection
- **Database Layer**: Uses Knex.js query builder with MySQL2 as the primary database connector, with PostgreSQL support for staging/production environments
- **Authentication**: JWT-based authentication with Passport.js strategies (local and JWT)
- **Validation**: Class-validator and class-transformer for request validation and transformation

## Database Design
- **Migration-based Schema**: Database schema managed through Knex migrations with comprehensive table relationships
- **Key Entities**: Users, roles, processes, forms, questions, validations, and ministerials
- **Naming Convention**: Snake case for database columns with camelCase transformation in application layer
- **Relationships**: Complex foreign key relationships supporting form sections, questions, sub-questions, and validation rules

## Modular Architecture
- **Domain-driven Modules**: Separate modules for users, processes, forms, questions, terms, and ministerials
- **Repository Pattern**: Data access layer abstracted through repository classes
- **Service-Repository Structure**: Business logic in services, data access in repositories
- **Helper Classes**: Utility functions and data transformation logic separated into helper files

## Authentication and Authorization
- **Role-based Access Control**: Multiple user roles (Admin, Secretary, Interviewer, Candidate) with method-level authorization
- **JWT Implementation**: Token-based authentication with refresh capabilities
- **Password Management**: Bcrypt hashing with password recovery functionality
- **Guard System**: Custom guards for JWT authentication and role-based access

## Form Management System
- **Dynamic Form Builder**: Complex form creation with sections, questions, and conditional logic
- **Question Types**: Support for multiple question types (open answer, multiple choice, Likert scale, matrix questions, date/time)
- **Validation Engine**: Comprehensive validation system with custom validation rules
- **Display Rules**: Conditional display logic for form sections and questions based on previous answers

## Data Processing
- **Request Transformation**: Automatic camelCase to snake_case conversion for database operations
- **Response Formatting**: Snake_case to camelCase conversion for API responses
- **Pagination**: Built-in pagination system with configurable page sizes
- **Filtering**: Dynamic filtering capabilities across all major entities

## Rate Limiting and Security
- **Throttling**: Request rate limiting using NestJS throttler (120 requests per minute)
- **Input Validation**: Comprehensive DTO validation with whitelist and transform options
- **Error Handling**: Global error filter with custom error handling service
- **CORS Configuration**: Configured for local development with specific origin allowance

# External Dependencies

## Database
- **MySQL**: Primary database for development environment
- **PostgreSQL**: Database option for staging and production environments
- **SQLite3**: Available as alternative database option

## Authentication Services
- **JWT**: JSON Web Tokens for stateless authentication
- **Passport.js**: Authentication middleware with local and JWT strategies
- **Bcrypt**: Password hashing and validation

## Utility Libraries
- **Knex.js**: SQL query builder and migration tool
- **nest-knexjs**: NestJS integration for Knex
- **camelcase-keys**: Automatic case conversion for API responses
- **class-validator**: Request validation decorators
- **class-transformer**: Object transformation and serialization
- **uuid**: Unique identifier generation
- **dotenv**: Environment variable management

## Development Tools
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **Jest**: Testing framework for unit and e2e tests
- **SWC**: Fast TypeScript/JavaScript compiler
- **TypeScript**: Type-safe JavaScript development