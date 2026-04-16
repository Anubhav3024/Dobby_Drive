const app = require("./app");
const { connectDB } = require("./config/db");
const env = require("./config/env");
const dns = require("dns");

function mongoConnectionHint(err) {
  const uri = String(env.MONGODB_URI || "");
  const isSrvUri = uri.startsWith("mongodb+srv://");
  const message = String(err?.message || "");
  const isSrvLookupError =
    err?.syscall === "querySrv" ||
    err?.hostname?.includes("mongodb.net") ||
    message.includes("querySrv");

  if (!isSrvUri || !isSrvLookupError) {
    return null;
  }

  return [
    "MongoDB connection failed while performing SRV DNS lookup for a mongodb+srv:// URI.",
    "",
    "Common fixes:",
    "  - Use a standard (non-SRV) Atlas connection string (mongodb://host1,host2,host3/...) from the Atlas UI.",
    "  - Or switch to local MongoDB: MONGODB_URI=mongodb://127.0.0.1:27017/dobby_drive",
    "  - If you must use SRV, disable DNS blockers/VPN/firewall rules that prevent Node from resolving SRV records.",
  ].join("\n");
}

function configureDns() {
  const raw = String(env.DNS_SERVERS || "").trim();
  if (raw) {
    const servers = raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (servers.length > 0) {
      try {
        dns.setServers(servers);
        console.log(`DNS override enabled: ${servers.join(", ")}`);
      } catch (err) {
        console.warn("Failed to apply DNS override:", err?.message || err);
      }
    }
    return;
  }

  const current = dns.getServers();
  if (current.some((s) => s === "127.0.0.1" || s === "::1")) {
    console.warn(
      "Warning: DNS is configured to use loopback (127.0.0.1/::1). If your local DNS service isn't running, MongoDB Atlas lookups may fail. Set DNS_SERVERS in server/.env or fix your OS DNS.",
    );
  }
}

configureDns();

connectDB()
  .then(() => {
    const server = app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });

    server.on("error", (err) => {
      if (err && err.code === "EADDRINUSE") {
        console.error(
          `Port ${env.PORT} is already in use. Stop the other process using it or change PORT in server/.env, then restart.`,
        );
        process.exit(1);
      }
      console.error("Server error", err);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    const hint = mongoConnectionHint(err);
    if (hint) {
      console.error("\n" + hint + "\n");
    }
    process.exit(1);
  });
