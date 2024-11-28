# Data Export Engine

A modern NestJS-based service designed to efficiently export and transform data from Thingsboard's PostgreSQL database. This project provides a type-safe, optimized way to access IoT device information while maintaining Thingsboard's security model.

## Overview 🎯

This service acts as a bridge between Thingsboard's database and client applications, offering:

- Type-safe database access using Prisma
- Clean architecture using CQRS pattern
- Compatible security model with Thingsboard
- Optimized query performance
- Selective data export capabilities

## Built With 🛠️

[![NestJS][nestjs-shield]][nestjs-url] [![TypeScript][typescript-shield]][typescript-url] [![PostgreSQL][postgresql-shield]][postgresql-url] [![Prisma][prisma-shield]][prisma-url]

Core dependencies:

- NestJS v10 - A progressive Node.js framework
- Prisma - Next-generation ORM
- CQRS - For clean separation of read/write operations
- Passport & JWT - Authentication compatible with Thingsboard
- Class Validator & Transformer - For DTO validation

## Prerequisites 📋

- Node.js (v16 or later)
- Yarn package manager
- PostgreSQL database (shared with Thingsboard)
- Running Thingsboard instance

## Getting Started 🚀

1. Clone and install dependencies:

```bash
git clone https://github.com/ctp-swinburne/light-controller-frontend.git
cd data-export-engine
yarn install
```

2. Configure your environment:

```bash
cp .env.example .env
# Edit .env with your database credentials and JWT settings
```

3. Generate Prisma client:

```bash
yarn prisma generate
```

4. Start development server:

```bash
yarn start:dev
```

### Useful Commands 💻

```bash
# Development
yarn start:dev       # Start with hot reload
yarn db:studio      # Launch Prisma Studio UI

# Code Quality
yarn format         # Format code
yarn lint          # Lint code

# Testing
yarn test          # Run tests
yarn test:e2e      # Run e2e tests
yarn test:cov      # Generate coverage report
```

## Environment Variables 🔐

Required environment variables:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
SECRET_KEY=your-jwt-secret-key
JWT_EXPIRATION=1h
```

## Contributing 🤝

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📝

This project is under MIT License.

[nestjs-shield]: https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white
[nestjs-url]: https://nestjs.com/
[typescript-shield]: https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white
[typescript-url]: https://www.typescriptlang.org/
[postgresql-shield]: https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white
[postgresql-url]: https://www.postgresql.org/
[prisma-shield]: https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white
[prisma-url]: https://www.prisma.io/
