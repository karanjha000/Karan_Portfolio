export const GITHUB_USER = "karanjha000";

export const PRIORITY_MATCHERS = [
  "skillconnect", "equinox", "chronoclass", "purelane", "shopify",
  "bookpilot", "book_pilot", "book-pilot",
];

export const EXCLUDE_SUBSTRINGS = ["portfolio"];

export const KNOWN_IMAGES = {
  "SkillConnect---Learn-Together-Solve-Together": [
    "images/img1.png", "images/img2.png", "images/img3.png", "images/img4.png", "images/img5.png",
  ],
  "Book_Pilot_Manager": ["images/Book1.png", "images/Book2.png", "images/Book3.png"],
  "Chat_App": ["images/klyra1.png"],
};

// Resume-verified tech stacks for the projects already documented on the
// resume — merged in regardless of what GitHub's language stats show,
// since a mixed-stack repo (e.g. Java backend + React frontend in one
// repo) can report a misleading single "primary language". This is
// ground-truth from the resume, not a guess.
export const RESUME_VERIFIED_TAGS = {
  equinox: ["Java", "Spring Boot", "Spring Security", "Spring Data JPA", "JWT", "React", "PostgreSQL", "Docker"],
  skillconnect: ["React", "Socket.IO", "WebSockets", "REST APIs"],
  bookpilot: ["Java", "MySQL", "Java Swing", "JDBC"],
};

export const TECH_ALIASES = {
  javascript: "JavaScript", js: "JavaScript", typescript: "TypeScript", ts: "TypeScript",
  postgresql: "PostgreSQL", postgres: "PostgreSQL", mysql: "MySQL", mongodb: "MongoDB", mongo: "MongoDB",
  "spring-boot": "Spring Boot", springboot: "Spring Boot", spring: "Spring Boot",
  "rest-api": "REST APIs", restapi: "REST APIs", rest: "REST APIs",
  "socket.io": "Socket.IO", socketio: "Socket.IO", websocket: "WebSockets", websockets: "WebSockets",
  html: "HTML5", html5: "HTML5", css: "CSS3", css3: "CSS3",
  java: "Java", python: "Python", "c++": "C++", cpp: "C++",
  docker: "Docker", git: "Git", maven: "Maven",
  node: "Node.js", nodejs: "Node.js", "node.js": "Node.js",
  react: "React", reactjs: "React", tailwindcss: "Tailwind CSS", tailwind: "Tailwind CSS", vite: "Vite",
  jwt: "JWT", hibernate: "Hibernate", jpa: "Spring Data JPA", swing: "Java Swing", jdbc: "JDBC",
};

export const CATEGORY_MAP = {
  "Databases": ["PostgreSQL", "MySQL", "MongoDB", "H2", "SQLite", "Redis"],
  "DevOps & Tools": ["Docker", "Git", "GitHub Actions (CI/CD)", "Maven", "Postman", "Swagger", "Gradle", "Jenkins"],
  "Frontend & Real-Time": ["React", "React 18", "Vue", "Angular", "HTML5", "CSS3", "Tailwind CSS", "Vite", "WebSockets", "Socket.IO", "JavaScript", "TypeScript", "Recharts"],
  "Backend & Security": ["Spring Boot", "Spring Security", "Spring Data JPA", "Hibernate", "JWT", "3-Tier RBAC", "REST APIs", "Node.js"],
  "Languages": ["Java (Core & Advanced)", "Java", "JavaScript (ES6+)", "Python", "C++", "C", "TypeScript"],
};

// Stacks that WebContainers (an in-browser Node runtime) can actually run.
// Anything outside this list — Java/Spring Boot, Python, etc. — has no
// in-browser execution path and falls back to the backend preview
// endpoint, which is honest about not being configured yet.
export const JS_STACK_TAGS = ["JavaScript", "TypeScript", "React", "React 18", "Vue", "Node.js", "Vite"];