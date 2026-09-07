const zoneSnippets = {
  frontend: [
    ["function ProjectList() {", "  const [data, setData] =", "    useState([]);", "  useEffect(() => {", "    api.get('/projects')", "      .then(setData);", "  }, []);"],
    ["<form onSubmit={handleSubmit}>", "  <input", "    value={email}", "    onChange={onChange} />", "  <button type=\"submit\">", "    Save", "  </button>", "</form>"],
  ],
  backend: [
    ["@RestController", "@RequestMapping(\"/api/orders\")", "public class OrderController {", "  @Autowired", "  private OrderService service;", "", "  @PostMapping", "  public Order create(", "    @Valid @RequestBody", "    OrderDto dto) {"],
    ["@Service", "public class OrderService {", "  public Order place(Dto dto) {", "    validate(dto);", "    Order o = repo.save(", "      map(dto));", "    return o;", "  }", "}"],
  ],
  database: [
    ["SELECT id, name, status", "FROM users", "WHERE active = true", "ORDER BY created_at DESC;"],
    ["CREATE INDEX idx_orders_user", "  ON orders(user_id);", "", "UPDATE orders", "SET status = 'PAID'", "WHERE id = ?;"],
  ],
  testing: [
    ["@SpringBootTest", "@AutoConfigureMockMvc", "class OrderApiTest {", "  @Test", "  void createsOrder() {", "    mockMvc.perform(post(", "      \"/api/orders\"))", "      .andExpect(status()", "        .isCreated());", "  }", "}"],
    ["@Test", "void rejectsInvalidDto() {", "  when(repo.save(any()))", "    .thenThrow(", "      new ValidationEx());", "  assertThrows(", "    ValidationEx.class,", "    () -> service.place(dto));", "}"],
  ],
  devops: [
    ["$ git push origin main", "$ mvn test", "$ mvn package -DskipTests", "$ docker build -t app .", "$ docker push app:latest"],
    ["Running CI pipeline…", "✓ checkout", "✓ build (mvn package)", "✓ unit tests (42 passed)", "✓ docker image built", "→ triggering deploy"],
  ],
  deployment: [
    ["$ docker run -d \\", "  -p 8080:8080 \\", "  --env-file .env \\", "  app:latest", "Container started ✓", "GET /actuator/health", "200 OK — status: UP"],
    ["Deploying to production…", "✓ container healthy", "✓ db connection pool ok", "✓ ssl certificate valid", "Service is live ✓"],
  ],
};

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function startZoneTypewriter(el, lines) {
  const textEl = el.querySelector(".zone-text");
  let snippetIndex = 0;
  let charIndex = 0;
  let phase = "typing"; // typing | holding | erasing

  function tick() {
    const snippet = lines[snippetIndex % lines.length];
    const full = snippet.join("\n");

    if (phase === "typing") {
      charIndex += 2;
      if (charIndex >= full.length) {
        charIndex = full.length;
        phase = "holding";
        setTimeout(() => {
          phase = "erasing";
        }, 2600);
      }
    } else if (phase === "erasing") {
      charIndex -= 4;
      if (charIndex <= 0) {
        charIndex = 0;
        phase = "typing";
        snippetIndex++;
      }
    }

    textEl.innerHTML = escapeHtml(full.slice(0, charIndex)) + '<span class="zone-cursor"></span>';
  }

  tick();
  return setInterval(tick, 70);
}

let zoneTimers = [];
let bgAppBuild;

export function initBackgroundAnimation() {
  bgAppBuild = document.getElementById("bgAppBuild");
  if (window.innerWidth > 700) start();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else if (window.innerWidth > 700) start();
  });
}

function start() {
  if (!bgAppBuild || zoneTimers.length) return;
  const zoneMap = [
    [".zone-frontend", zoneSnippets.frontend],
    [".zone-backend", zoneSnippets.backend],
    [".zone-database", zoneSnippets.database],
    [".zone-testing", zoneSnippets.testing],
    [".zone-devops", zoneSnippets.devops],
    [".zone-deployment", zoneSnippets.deployment],
  ];
  zoneMap.forEach(([selector, lines]) => {
    const el = document.querySelector(selector);
    if (el) zoneTimers.push(startZoneTypewriter(el, lines));
  });
}

function stop() {
  zoneTimers.forEach((t) => clearInterval(t));
  zoneTimers = [];
}