const cron = require("node-cron");
const { autoGenerateAndStoreTopics } = require("../services/autoGenerateService");

cron.schedule("0 0 */3 * *", async () => {
  console.log("⏰ Running auto topic generation...");
  await autoGenerateAndStoreTopics();
});
