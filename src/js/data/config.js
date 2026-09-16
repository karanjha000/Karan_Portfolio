export const GITHUB_USER = "karanjha000";

export const PRIORITY_MATCHERS = [
  "skillconnect", "equinox", "chronoclass", "purelane", "shopify",
  "bookpilot", "book_pilot", "book-pilot", "manjari",
];

// Explicit exclusion blocklist — repos matching these are hidden from
// the Projects showcase regardless of when they were created. This is
// the ONLY exclusion mechanism besides forks and the GitHub
// profile-README repo (handled separately in projectBuilder.js) — no
// implicit "looks trivial" filtering, so new legitimate repos always
// show up automatically without needing this list touched.
export const EXCLUDE_SUBSTRINGS = ["portfolio"];

// Paths are served from /public/images/projects/<project>/ — Vite
// copies everything under public/ to the site root on build, so these
// resolve correctly in both dev and production. Drop the actual
// screenshot files into the matching folder; the filenames below are
// the expected names once they're added.
export const KNOWN_IMAGES = {
  "SkillConnect---Learn-Together-Solve-Together": [
    "/images/projects/skillconnect/img1.png",
    "/images/projects/skillconnect/img2.png",
    "/images/projects/skillconnect/img3.png",
    "/images/projects/skillconnect/img4.png",
    "/images/projects/skillconnect/img5.png",
  ],
  "Book_Pilot_Manager": [
    "/images/projects/bookpilot/img1.png",
    "/images/projects/bookpilot/img2.png",
    "/images/projects/bookpilot/img3.png",
  ],
  "Chat_App": ["/images/projects/chatapp/img1.png"],
};

// Resume-verified tech stacks for the projects already documented on the
// resume — merged in regardless of what GitHub's language stats or
// dependency-file scan show, since ground truth from the resume is more
// reliable than automated detection for these specific, already-known
// projects. Names here must match keys in TECH_INFO below (case doesn't
// matter — they get normalized the same way as any other detected tag).
export const RESUME_VERIFIED_TAGS = {
  equinox: ["java", "spring-boot", "spring-security", "spring-data-jpa", "jwt", "react", "postgresql", "docker"],
  skillconnect: ["react", "socket.io", "rest-api"],
  bookpilot: ["java", "mysql", "java-swing", "jdbc"],
};

// Subcategory detail breakdowns for consolidated skills — shown on the
// skill-detail view without creating a second competing skill entry.
export const SKILL_DETAILS = {
  java: ["Core Java", "Advanced Java", "OOP", "Collections", "Multithreading", "Exception Handling"],
};

// ---------------------------------------------------------------------
// Unified technology dictionary: every entry maps a normalized key
// (a package/dependency name, a language name, or a common alias) to
// its canonical display name AND its correct category. This is the
// single source of truth for classification, replacing the old
// separate alias-list + category-list-membership approach that let
// arbitrary strings (repo topics, README words) slip into "Skills"
// under a generic catch-all bucket.
//
// Categories are exactly: Languages, Frontend, Backend, Database,
// DevOps, Others. Anything not in this dictionary is NOT a skill and
// is discarded rather than falling into a catch-all category — a repo
// topic like "library-management-system" or "booking-system" has no
// entry here and is correctly dropped, not displayed.
// ---------------------------------------------------------------------
export const TECH_INFO = {
  // Languages — actual programming languages only. Versions normalize
  // to the bare language (java8/java11/java17 all -> Java).
  java: { name: "Java", category: "Languages" },
  java8: { name: "Java", category: "Languages" },
  java11: { name: "Java", category: "Languages" },
  java17: { name: "Java", category: "Languages" },
  java21: { name: "Java", category: "Languages" },
  javascript: { name: "JavaScript", category: "Languages" },
  js: { name: "JavaScript", category: "Languages" },
  typescript: { name: "TypeScript", category: "Languages" },
  ts: { name: "TypeScript", category: "Languages" },
  python: { name: "Python", category: "Languages" },
  c: { name: "C", category: "Languages" },
  "c++": { name: "C++", category: "Languages" },
  cpp: { name: "C++", category: "Languages" },
  html: { name: "HTML", category: "Languages" },
  html5: { name: "HTML", category: "Languages" },
  css: { name: "CSS", category: "Languages" },
  css3: { name: "CSS", category: "Languages" },

  // Frontend — UI frameworks/libraries only.
  react: { name: "React", category: "Frontend" },
  "react-dom": { name: "React", category: "Frontend" },
  reactjs: { name: "React", category: "Frontend" },
  "react-router-dom": { name: "React Router", category: "Frontend" },
  "react-router": { name: "React Router", category: "Frontend" },
  "react-icons": { name: "React Icons", category: "Frontend" },
  "react-hook-form": { name: "React Hook Form", category: "Frontend" },
  "react-toastify": { name: "React Toastify", category: "Frontend" },
  "react-hot-toast": { name: "React Hot Toast", category: "Frontend" },
  formik: { name: "Formik", category: "Frontend" },
  vue: { name: "Vue", category: "Frontend" },
  "vue-router": { name: "Vue Router", category: "Frontend" },
  vuex: { name: "Vuex", category: "Frontend" },
  pinia: { name: "Pinia", category: "Frontend" },
  angular: { name: "Angular", category: "Frontend" },
  next: { name: "Next.js", category: "Frontend" },
  "next.js": { name: "Next.js", category: "Frontend" },
  tailwindcss: { name: "Tailwind CSS", category: "Frontend" },
  tailwind: { name: "Tailwind CSS", category: "Frontend" },
  bootstrap: { name: "Bootstrap", category: "Frontend" },
  "react-bootstrap": { name: "Bootstrap", category: "Frontend" },
  "styled-components": { name: "Styled Components", category: "Frontend" },
  sass: { name: "Sass", category: "Frontend" },
  scss: { name: "Sass", category: "Frontend" },
  less: { name: "Less", category: "Frontend" },
  redux: { name: "Redux", category: "Frontend" },
  "redux-toolkit": { name: "Redux Toolkit", category: "Frontend" },
  "@reduxjs/toolkit": { name: "Redux Toolkit", category: "Frontend" },
  "react-redux": { name: "Redux", category: "Frontend" },
  zustand: { name: "Zustand", category: "Frontend" },
  "@tanstack/react-query": { name: "React Query", category: "Frontend" },
  "react-query": { name: "React Query", category: "Frontend" },
  recharts: { name: "Recharts", category: "Frontend" },
  "chart.js": { name: "Chart.js", category: "Frontend" },
  "react-chartjs-2": { name: "Chart.js", category: "Frontend" },
  "framer-motion": { name: "Framer Motion", category: "Frontend" },
  "socket.io-client": { name: "Socket.IO", category: "Frontend" },
  axios: { name: "Axios", category: "Frontend" },

  // Backend — server frameworks, runtimes, auth, real-time, middleware.
  "spring-boot": { name: "Spring Boot", category: "Backend" },
  "spring-boot-starter-web": { name: "Spring Boot", category: "Backend" },
  "spring-boot-starter": { name: "Spring Boot", category: "Backend" },
  springboot: { name: "Spring Boot", category: "Backend" },
  "spring-security": { name: "Spring Security", category: "Backend" },
  "spring-boot-starter-security": { name: "Spring Security", category: "Backend" },
  "spring-data-jpa": { name: "Spring Data JPA", category: "Backend" },
  "spring-boot-starter-data-jpa": { name: "Spring Data JPA", category: "Backend" },
  "spring-boot-starter-websocket": { name: "WebSockets", category: "Backend" },
  "spring-boot-starter-validation": { name: "Spring Boot", category: "Backend" },
  "spring-boot-starter-mail": { name: "Spring Boot", category: "Backend" },
  hibernate: { name: "Hibernate", category: "Backend" },
  node: { name: "Node.js", category: "Backend" },
  nodejs: { name: "Node.js", category: "Backend" },
  "node.js": { name: "Node.js", category: "Backend" },
  express: { name: "Express.js", category: "Backend" },
  "express.js": { name: "Express.js", category: "Backend" },
  koa: { name: "Koa", category: "Backend" },
  fastify: { name: "Fastify", category: "Backend" },
  django: { name: "Django", category: "Backend" },
  djangorestframework: { name: "Django REST Framework", category: "Backend" },
  "djangorestframework-simplejwt": { name: "Django REST Framework", category: "Backend" },
  flask: { name: "Flask", category: "Backend" },
  fastapi: { name: "FastAPI", category: "Backend" },
  "socket.io": { name: "Socket.IO", category: "Backend" },
  socketio: { name: "Socket.IO", category: "Backend" },
  websocket: { name: "WebSockets", category: "Backend" },
  websockets: { name: "WebSockets", category: "Backend" },
  jwt: { name: "JWT", category: "Backend" },
  jsonwebtoken: { name: "JWT", category: "Backend" },
  jjwt: { name: "JWT", category: "Backend" },
  "jjwt-api": { name: "JWT", category: "Backend" },
  "jjwt-impl": { name: "JWT", category: "Backend" },
  "jjwt-jackson": { name: "JWT", category: "Backend" },
  passport: { name: "Passport.js", category: "Backend" },
  "passport-jwt": { name: "Passport.js", category: "Backend" },
  "passport-local": { name: "Passport.js", category: "Backend" },
  bcrypt: { name: "bcrypt", category: "Backend" },
  bcryptjs: { name: "bcrypt", category: "Backend" },
  "rest-api": { name: "REST APIs", category: "Backend" },
  restapi: { name: "REST APIs", category: "Backend" },
  jdbc: { name: "JDBC", category: "Backend" },
  nodemailer: { name: "Nodemailer", category: "Backend" },
  multer: { name: "Multer", category: "Backend" },
  cors: { name: "CORS", category: "Backend" },
  helmet: { name: "Helmet", category: "Backend" },
  morgan: { name: "Morgan", category: "Backend" },
  "cookie-parser": { name: "Cookie Parser", category: "Backend" },
  "body-parser": { name: "Body Parser", category: "Backend" },
  celery: { name: "Celery", category: "Backend" },

  // Database — actual databases/drivers. H2 stays tagged as a genuine
  // (development) database, not discarded and not claimed as prod.
  postgresql: { name: "PostgreSQL", category: "Database" },
  postgres: { name: "PostgreSQL", category: "Database" },
  pg: { name: "PostgreSQL", category: "Database" },
  psycopg2: { name: "PostgreSQL", category: "Database" },
  "psycopg2-binary": { name: "PostgreSQL", category: "Database" },
  mysql: { name: "MySQL", category: "Database" },
  mysql2: { name: "MySQL", category: "Database" },
  "mysql-connector-java": { name: "MySQL", category: "Database" },
  "mysql-connector-j": { name: "MySQL", category: "Database" },
  mongodb: { name: "MongoDB", category: "Database" },
  mongo: { name: "MongoDB", category: "Database" },
  mongoose: { name: "MongoDB", category: "Database" },
  pymongo: { name: "MongoDB", category: "Database" },
  h2: { name: "H2 (Dev)", category: "Database" },
  sqlite: { name: "SQLite", category: "Database" },
  sqlite3: { name: "SQLite", category: "Database" },
  redis: { name: "Redis", category: "Database" },
  ioredis: { name: "Redis", category: "Database" },
  sequelize: { name: "Sequelize", category: "Database" },
  sqlalchemy: { name: "SQLAlchemy", category: "Database" },
  prisma: { name: "Prisma", category: "Database" },
  "@prisma/client": { name: "Prisma", category: "Database" },
  typeorm: { name: "TypeORM", category: "Database" },

  // DevOps — containerization, CI/CD, hosting/infra.
  docker: { name: "Docker", category: "DevOps" },
  "docker-compose": { name: "Docker", category: "DevOps" },
  "github-actions": { name: "GitHub Actions", category: "DevOps" },
  vercel: { name: "Vercel", category: "DevOps" },
  render: { name: "Render", category: "DevOps" },
  aws: { name: "AWS", category: "DevOps" },
  netlify: { name: "Netlify", category: "DevOps" },
  heroku: { name: "Heroku", category: "DevOps" },
  nginx: { name: "Nginx", category: "DevOps" },
  jenkins: { name: "Jenkins", category: "DevOps" },
  kubernetes: { name: "Kubernetes", category: "DevOps" },

  // Others — genuine tools/utilities that aren't a language or a
  // language/framework/db/devops category, not a dumping ground.
  git: { name: "Git", category: "Others" },
  postman: { name: "Postman", category: "Others" },
  swagger: { name: "Swagger", category: "Others" },
  springdoc: { name: "Swagger", category: "Others" },
  "springdoc-openapi": { name: "Swagger", category: "Others" },
  openapi: { name: "Swagger", category: "Others" },
  maven: { name: "Maven", category: "Others" },
  gradle: { name: "Gradle", category: "Others" },
  junit: { name: "JUnit", category: "Others" },
  lombok: { name: "Lombok", category: "Others" },
  vite: { name: "Vite", category: "Others" },
  webpack: { name: "Webpack", category: "Others" },
  eslint: { name: "ESLint", category: "Others" },
  prettier: { name: "Prettier", category: "Others" },
  jest: { name: "Jest", category: "Others" },
  mocha: { name: "Mocha", category: "Others" },
  chai: { name: "Chai", category: "Others" },
  cypress: { name: "Cypress", category: "Others" },
  swing: { name: "Java Swing", category: "Others" },
  "java-swing": { name: "Java Swing", category: "Others" },
  dotenv: { name: "dotenv", category: "Others" },
  joi: { name: "Joi", category: "Others" },
  zod: { name: "Zod", category: "Others" },
  yup: { name: "Yup", category: "Others" },
};

export const JS_STACK_TAGS = ["JavaScript", "TypeScript", "React", "Vue", "Node.js", "Vite"];