
const { Telegraf } = require("telegraf");
const express = require("express");

const token = process.env.BOT_TOKEN;
const channel = process.env.CHANNEL_USERNAME;
const ownerId = String(process.env.OWNER_ID || "");

if (!token || !channel || !ownerId) {
  throw new Error("Missing BOT_TOKEN, CHANNEL_USERNAME or OWNER_ID");
}

const bot = new Telegraf(token);
const app = express();

let joins = 0;
let leaves = 0;
let reactionUpdates = 0;

app.get("/", (req, res) => {
  res.send("Anonymous Analytics Bot is running!");
});

bot.start(async (ctx) => {
  if (String(ctx.from.id) !== ownerId) {
    return ctx.reply("Access denied.");
  }

  await ctx.reply(
    "Welcome to Anonymous Updates Analytics! 📊\n\nSend /stats to view your channel statistics."
  );
});

bot.command("stats", async (ctx) => {
  if (String(ctx.from.id) !== ownerId) {
    return ctx.reply("Access denied.");
  }

  try {
    const members = await ctx.telegram.getChatMemberCount(channel);

    await ctx.reply(
      "📊 ANONYMOUS UPDATES ANALYTICS\n\n" +
      "👥 Total subscribers: " + members + "\n" +
      "🟢 New joins since startup: " + joins + "\n" +
      "🔴 Departures since startup: " + leaves + "\n" +
      "❤️ Reaction updates: " + reactionUpdates + "\n\n" +
      "Note: Exact online subscribers and post views are not available through the Bot API."
    );
  } catch (error) {
    console.error("STATS ERROR:", error);
    await ctx.reply("Statistics error: " + error.message);
  }
});

bot.on("chat_member", (ctx) => {
  const update = ctx.chatMember;

  if (
    !update.chat.username ||
    update.chat.username.toLowerCase() !== channel.replace("@", "").toLowerCase()
  ) return;

  const statuses = ["member", "administrator", "creator", "restricted"];

  const wasMember = statuses.includes(update.old_chat_member.status);
  const isMember = statuses.includes(update.new_chat_member.status);

  if (!wasMember && isMember) joins++;
  if (wasMember && !isMember) leaves++;
});

bot.on("message_reaction_count", (ctx) => {
  if (
    ctx.chat.username &&
    ctx.chat.username.toLowerCase() === channel.replace("@", "").toLowerCase()
  ) {
    reactionUpdates++;
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Analytics server started");
});

bot.launch({
  allowedUpdates: ["message", "chat_member", "message_reaction_count"]
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
