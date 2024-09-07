import { SlashCommandFile } from "../../@types";
import { Message, InteractionResponse, APIEmbed } from "discord.js";
import CommandInteractionContext from "../../structures/CommandInteractionContext";
import {
    generateDiscordTimestamp,
    TopGGVoteRewards,
    findItem,
    addXp,
    hasVotedRecenty,
} from "../../utils/Functions";

const slashCommand: SlashCommandFile = {
    data: {
        name: "vote",
        description: "Vote for Jolyne in Top.GG",
        options: [],
    },
    execute: async (
        ctx: CommandInteractionContext
    ): Promise<Message | void | InteractionResponse> => {
        const voteMonth = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
        const totalVotes = ctx.userData.totalVotes || 0;
        const monthVotes = ctx.userData.voteHistory[voteMonth] ?? []; // array of timestamps
        const voteRewards = TopGGVoteRewards(ctx.userData);

        const xpRewards = addXp(ctx.userData, voteRewards.xp, ctx.client, true);

        const embeds: APIEmbed[] = [
            {
                author: {
                    icon_url:
                        "https://pbs.twimg.com/profile_images/1502418247706046466/EMg2DjtV_400x400.jpg",
                    name: "Top.GG",
                },
                description: `You have voted **${
                    monthVotes.length
                }** times this month and **${totalVotes}** times in total.\nBy voting, you can earn **${voteRewards.coins.toLocaleString(
                    "en-US"
                )}** ${ctx.client.localEmojis.jocoins}, **${xpRewards.toLocaleString("en-US")}** ${
                    ctx.client.localEmojis.xp
                }, x2 ${ctx.client.localEmojis.mysterious_arrow} **Stand Arrows** and x2 ${
                    ctx.client.localEmojis.mysterious_arrow
                } **Rare Stand Arrows** + 1x ${
                    findItem("dungeon").emoji
                } **Dungeon Key** every 2 votes.`,
                color: 0xff3366,
                fields: [],
            },
        ];

        // check if the user has voted less than 12 hours ago
        const lastVote = monthVotes[monthVotes.length - 1] || 0;
        const canVoteTimestamp = lastVote + 43200000;
        if (lastVote && Date.now() - lastVote < 43200000 && monthVotes.length > 0) {
            const rewardXP = addXp(ctx.userData, voteRewards.xp, ctx.client, true);
            embeds[0].fields.push({
                // color: 0xff3366,
                // fields: [
                // {
                name: "Thank you for voting!",
                value: `You have been given **${voteRewards.coins.toLocaleString("en-US")}** ${
                    ctx.client.localEmojis.jocoins
                }, **${rewardXP.toLocaleString("en-US")}** ${ctx.client.localEmojis.xp}, x2 ${
                    ctx.client.localEmojis.mysterious_arrow
                } **Stand Arrows** for voting ${generateDiscordTimestamp(lastVote, "FROM_NOW")}. ${
                    ctx.userData.totalVotes % 2 === 0
                        ? `\nYou have also been giving x2 ${
                              ctx.client.localEmojis.mysterious_arrow
                          } Rare Stand Arrows and a ${
                              findItem("dungeon").emoji
                          } **Dungeon Key** for voting 2 times.`
                        : `\nIf you vote 1 more time, you will be given x2 ${
                              ctx.client.localEmojis.mysterious_arrow
                          } Rare Stand Arrows and a ${findItem("dungeon").emoji} **Dungeon Key**.`
                }`,
                // }
                // ]
            });

            if (hasVotedRecenty(ctx.userData, ctx.client)) {
                const expire = lastVote + 60000 * 5; // only lasts for 5 minutes
                embeds[0].fields.push({
                    name: `${ctx.client.localEmojis.timerIcon} Low Cooldown!`,
                    value: `Since you have voted recently, all your cooldowns are reduced by **45 seconds** !! (${[
                        "assault",
                        "loot",
                        "raid",
                    ]
                        .map((x) => ctx.client.getSlashCommandMention(x))
                        .join(", ")}) [expires ${generateDiscordTimestamp(
                        expire,
                        "FROM_NOW"
                    )}]\nYou have also been fully healed and your stamina has been restored.`,
                });
                return await ctx.makeMessage({ embeds });
            }
        }
        embeds[0].fields.push({
            //color: 0xff3366,
            //fields: [
            //  {
            name: "Vote for Jolyne",
            value: `[${
                Date.now() - lastVote < 43200000
                    ? `You can vote again ${generateDiscordTimestamp(
                          canVoteTimestamp,
                          "FROM_NOW"
                      )}.`
                    : `You can vote now!`
            }](https://top.gg/bot/923619190831730698)`,
            //}
            //]
        });

        return await ctx.makeMessage({ embeds });
    },
};

export default slashCommand;
