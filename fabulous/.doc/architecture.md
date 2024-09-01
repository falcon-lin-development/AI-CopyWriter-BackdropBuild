project-root/
│
├── infrastructure/
│   ├── bin/
│   │   └── infrastructure.ts
│   ├── lib/
│   │   ├── networking-stack.ts
│   │   ├── database-stack.ts
│   │   ├── cognito-stack.ts
│   │   ├── sns-stack.ts
│   │   ├── websocket-stack.ts
│   │   ├── ai-stack.ts
│   │   └── webscraper-stack.ts
│   ├── config/
│   │   ├── dev.json
│   │   └── prod.json
│   ├── test/
│   │   └── infrastructure.test.ts
│   ├── cdk.json
│   └── package.json
│
├── services/
│   ├── websocket-handler/
│   │   ├── src/
│   │   │   ├── handlers/
│   │   │   ├── models/
│   │   │   └── utils/
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── ai-service/
│   │   ├── src/
│   │   │   ├── handlers/
│   │   │   ├── models/
│   │   │   └── utils/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── webscraper-service/
│       ├── src/
│       │   ├── handlers/
│       │   ├── models/
│       │   └── utils/
│       ├── tests/
│       ├── Dockerfile
│       └── package.json
│
├── shared/
│   ├── typescript/
│   │   ├── src/
│   │   │   ├── utils/
│   │   │   └── models/
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── python/
│       ├── src/
│       │   ├── utils/
│       │   └── models/
│       ├── tests/
│       └── requirements.txt
│
├── scripts/
│   ├── deploy.sh
│   ├── test.sh
│   └── local-dev.sh
│
├── docs/
│   ├── architecture.md
│   └── api-specs/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
│
├── docker-compose.yml
├── .gitignore
├── README.md
└── package.json