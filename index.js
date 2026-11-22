
const { Telegraf } = require("telegraf");
const express = require("express");

const token = process.env.BOT_TOKEN;
const channel = process.env.CHANNEL_USERNAME;

if (!token || !channel) {
  throw new Error("Missing BOT_TOKEN or CHANNEL_USERNAME");
}

const bot = new Telegraf(token);
const app = express();

let ownerId = null;
let joins = 0;
let leaves = 0;
let reactionUpdates = 0;

app.get("/", (req, res) => {
  res.send("Anonymous Analytics Bot is running!");
});

bot.start(async (ctx) => {
  ownerId = ctx.chat.id;

  await ctx.reply(
    "📊 Welcome to Anonymous Analytics!\n\n" +
    "Use /stats to view your channel statistics."
  );
});

bot.command("stats", async (ctx) => {
  if (!ownerId || ctx.chat.id !== ownerId) {
    return ctx.reply("Access denied.");
  }

  try {
    const members = await ctx.telegram.getChatMemberCount(channel);

    await ctx.reply(
      "📊 ANONYMOUS UPDATES ANALYTICS\n\n" +
      "👥 Total subscribers: " + members + "\n" +
      "🟢 New joins since startup: " + joins + "\n" +
      "🔴 Departures since startup: " + leaves + "\n" +
      "❤️ Reaction updates received: " + reactionUpdates + "\n\n" +
      "📌 Post views and exact online users are not available through the Bot API.\n\n" +
      "Use /stats again for an updated report."
    );
  } catch (error) {
  console.error("STATS ERROR:", error);
  await ctx.reply("Error: " + error.message);
  }
});

bot.on("chat_member", async (ctx) => {
  const update = ctx.chatMember;

  if (update.chat.username !== channel.replace("@", "")) return;

  const oldStatus = update.old_chat_member.status;
  const newStatus = update.new_chat_member.status;

  const wasMember = ["member", "administrator", "creator", "restricted"].includes(oldStatus);
  const isMember = ["member", "administrator", "creator", "restricted"].includes(newStatus);

  if (!wasMember && isMember) joins++;
  if (wasMember && !isMember) leaves++;
});

bot.on("message_reaction_count", async (ctx) => {
  if (ctx.chat.username !== channel.replace("@", "")) return;

  reactionUpdates++;
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Web server started");
});

bot.launch({
  allowedUpdates: [
    "message",
    "chat_member",
    "message_reaction_count"
  ]
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
  
