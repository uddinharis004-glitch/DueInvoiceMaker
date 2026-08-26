import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = createInterface({ input, output });

const password = await rl.question("Password to hash: ");
rl.close();

if (!password || password.length < 10) {
  console.error("Use a password of at least 10 characters.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log("\nAPP_PASSWORD_HASH=");
console.log(hash);
