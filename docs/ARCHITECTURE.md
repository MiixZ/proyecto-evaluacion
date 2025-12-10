# Arquitectura del Sistema

proyecto-evaluacion/
├── docker-compose.yml # Orquestación de servicios
├── .env.example # Variables de entorno
├── .gitignore
├── README.md
│
├── backend/
│ ├── Dockerfile # Contenedor backend
│ ├── package.json
│ ├── tsconfig.json # Configuración TypeScript
│ ├── .eslintrc.json # Linting
│ ├── .prettierrc.json # Formateo código
│ │
│ ├── src/
│ │ ├── main.ts # Punto de entrada
│ │ ├── config/
│ │ │ ├── database.ts # Conexión MySQL
│ │ │ ├── authgear.ts # Integración Authgear
│ │ │ └── environment.ts # Variables de entorno
│ │ │
│ │ ├── middleware/
│ │ │ ├── auth.middleware.ts # Validación tokens
│ │ │ ├── roleCheck.middleware.ts # Control de roles
│ │ │ ├── errorHandler.middleware.ts
│ │ │ └── requestLogger.middleware.ts
│ │ │
│ │ ├── routes/
│ │ │ ├── index.ts # Registro de rutas principales
│ │ │ │
│ │ │ ├── auth/
│ │ │ │ └── auth.routes.ts # POST /auth/login, /auth/logout
│ │ │ │
│ │ │ ├── users/
│ │ │ │ └── users.routes.ts # GET/PUT /users/:id, /users/profile
│ │ │ │
│ │ │ ├── admin/
│ │ │ │ ├── admin.routes.ts # Rutas principales admin
│ │ │ │ ├── degrees/ # Titulaciones
│ │ │ │ │ └── degrees.routes.ts
│ │ │ │ ├── subjects/ # Asignaturas
│ │ │ │ │ └── subjects.routes.ts
│ │ │ │ ├── syllabi/ # Temarios
│ │ │ │ │ └── syllabi.routes.ts
│ │ │ │ ├── exercises/ # Ejercicios
│ │ │ │ │ └── exercises.routes.ts
│ │ │ │ ├── teachers/ # Gestión profesores
│ │ │ │ │ └── teachers.routes.ts
│ │ │ │ └── users-admin/ # Visualizar usuarios
│ │ │ │ └── users-admin.routes.ts
│ │ │ │
│ │ │ ├── student/
│ │ │ │ ├── student.routes.ts # Rutas principales estudiante
│ │ │ │ ├── exercises/ # Consultar ejercicios
│ │ │ │ │ └── exercises.routes.ts
│ │ │ │ ├── submissions/ # Enviar soluciones
│ │ │ │ │ └── submissions.routes.ts
│ │ │ │ ├── progress/ # Ver progreso
│ │ │ │ │ └── progress.routes.ts
│ │ │ │ └── syllabus/ # Consultar temarios
│ │ │ │ └── syllabus.routes.ts
│ │ │ │
│ │ │ └── teacher/
│ │ │ ├── teacher.routes.ts # Rutas principales profesor
│ │ │ ├── groups/ # Gestionar estudiantes
│ │ │ │ └── groups.routes.ts
│ │ │ ├── monitoring/ # Monitorizar progreso
│ │ │ │ ├── individual.routes.ts # Estudiante individual
│ │ │ │ └── groupStats.routes.ts # Estadísticas grupo
│ │ │ ├── feedback/ # Añadir retroalimentación
│ │ │ │ └── feedback.routes.ts
│ │ │ └── export/ # Exportar datos
│ │ │ └── export.routes.ts
│ │ │
│ │ ├── controllers/ # Lógica de las rutas
│ │ │ ├── admin/
│ │ │ │ ├── degreesController.ts
│ │ │ │ ├── subjectsController.ts
│ │ │ │ ├── syllabiController.ts
│ │ │ │ ├── exercisesController.ts
│ │ │ │ ├── teachersController.ts
│ │ │ │ └── usersAdminController.ts
│ │ │ │
│ │ │ ├── student/
│ │ │ │ ├── exercisesController.ts
│ │ │ │ ├── submissionsController.ts
│ │ │ │ ├── progressController.ts
│ │ │ │ └── syllabusController.ts
│ │ │ │
│ │ │ ├── teacher/
│ │ │ │ ├── groupsController.ts
│ │ │ │ ├── individualMonitoringController.ts
│ │ │ │ ├── groupStatsController.ts
│ │ │ │ ├── feedbackController.ts
│ │ │ │ └── exportController.ts
│ │ │ │
│ │ │ └── auth/
│ │ │ └── authController.ts
│ │ │
│ │ ├── services/ # Lógica de negocio
│ │ │ ├── auth/
│ │ │ │ └── authService.ts
│ │ │ │
│ │ │ ├── admin/
│ │ │ │ ├── degreeService.ts
│ │ │ │ ├── subjectService.ts
│ │ │ │ ├── syllabusService.ts
│ │ │ │ ├── exerciseService.ts
│ │ │ │ └── teacherService.ts
│ │ │ │
│ │ │ ├── student/
│ │ │ │ ├── exerciseStudentService.ts
│ │ │ │ ├── submissionService.ts
│ │ │ │ ├── progressService.ts
│ │ │ │ └── syllabusStudentService.ts
│ │ │ │
│ │ │ ├── teacher/
│ │ │ │ ├── groupService.ts
│ │ │ │ ├── monitoringService.ts
│ │ │ │ ├── statsService.ts
│ │ │ │ ├── feedbackService.ts
│ │ │ │ └── exportService.ts
│ │ │ │
│ │ │ └── shared/
│ │ │ ├── userService.ts
│ │ │ ├── submissionEvaluationService.ts
│ │ │ └── emailService.ts
│ │ │
│ │ ├── models/ # Esquemas de base de datos (ORM/Query Builder)
│ │ │ ├── User.ts
│ │ │ ├── Degree.ts
│ │ │ ├── Subject.ts
│ │ │ ├── Syllabus.ts
│ │ │ ├── Exercise.ts
│ │ │ ├── TestCase.ts
│ │ │ ├── Submission.ts
│ │ │ ├── Group.ts
│ │ │ ├── UserGroup.ts
│ │ │ ├── AuditLog.ts
│ │ │ └── Feedback.ts
│ │ │
│ │ ├── types/ # Tipos TypeScript
│ │ │ ├── common.types.ts # Tipos generales
│ │ │ ├── user.types.ts
│ │ │ ├── exercise.types.ts
│ │ │ ├── submission.types.ts
│ │ │ ├── request.types.ts # Extensión de Request de Express
│ │ │ └── api.types.ts # Tipos de respuestas API
│ │ │
│ │ ├── validators/ # Validación de entrada
│ │ │ ├── userValidator.ts
│ │ │ ├── exerciseValidator.ts
│ │ │ ├── submissionValidator.ts
│ │ │ └── groupValidator.ts
│ │ │
│ │ ├── utils/
│ │ │ ├── logger.ts # Logging
│ │ │ ├── errors.ts # Clases de error personalizadas
│ │ │ ├── jwt.ts # Utilidades JWT
│ │ │ ├── formatters.ts # Formateo de datos
│ │ │ └── validators.ts # Funciones de validación reutilizables
│ │ │
│ │ └── database/
│ │ ├── connection.ts # Pool de conexiones MySQL
│ │ └── migrations/ # Scripts de migración (futura)
│ │
│ └── tests/ # Tests (Jest/Mocha)
│ ├── unit/
│ ├── integration/
│ └── fixtures/
│
├── execution-service/ # Capa de ejecución (Sprint 2)
│ ├── Dockerfile
│ └── ...
│
├── frontend/ # Frontend (Astro + React)
│ └── ... (se estructura luego)
│
├── authgear/ # Configuración Authgear (opcional)
│ └── config.yaml
│
└── docs/ # Documentación
├── API.md # Especificación OpenAPI
├── ARCHITECTURE.md
├── INSTALLATION.md
└── USER_GUIDE.md

## Descripción de Capas

### Backend

- **Config**: Configuración de servicios externos y variables de entorno
- **Middleware**: Autenticación, autorización y manejo de errores
- **Routes**: Definición de endpoints REST organizados por rol
- **Controllers**: Lógica de controladores y validación de requests
- **Services**: Lógica de negocio y comunicación con la base de datos
- **Models**: Esquemas y modelos de datos
- **Types**: Definiciones de tipos TypeScript
- **Validators**: Validación de entrada de datos
- **Utils**: Utilidades y helpers reutilizables
- **Database**: Gestión de conexiones y migraciones

### Execution Service

Servicio independiente para ejecutar código de estudiantes de forma segura en contenedores aislados.

### Frontend

Interfaz de usuario construida con Astro y React, organizada por componentes y vistas.

### Authgear

Sistema de autenticación y gestión de identidades externo.
