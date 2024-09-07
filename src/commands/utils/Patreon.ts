import { SlashCommandFile } from "../../@types";
import { APIEmbed, InteractionResponse, Message } from "discord.js";
import CommandInteractionContext from "../../structures/CommandInteractionContext";
import * as Functions from "../../utils/Functions";
import { Patron } from "../../structures/JolyneClient";

const tiers = {
    1: "Supporter",
    2: "Ascended Supporter",
    3: "Heaven Ascended Supporter",
    4: "Over Heaven Supporter",
    0: "Former Supporter",
};

const slashCommand: SlashCommandFile = {
    data: {
        name: "patreon",
        description: "Get the patreon link to support Jolyne and earn rewards",
        options: [
            {
                name: "public",
                description: "If the message should be public (everyone can see it)",
                type: 5,
            },
        ],
    },
    execute: async (
        ctx: CommandInteractionContext
    ): Promise<InteractionResponse | Message | void> => {
        const isInData = await ctx.client.database.getString(`patronData:${ctx.user.id}`);
        const isPublic = ctx.interaction.options.getBoolean("public");

        if (isInData) {
            const parsedData = JSON.parse(isInData) as Patron;
            const tier = ctx.client.patreons.find((p) => p.id === ctx.user.id)?.level ?? 0;

            const embed: APIEmbed = {
                author: {
                    name: ctx.user.username,
                    icon_url: ctx.user.displayAvatarURL(),
                },
                description:
                    parsedData.patron_status === "active_patron"
                        ? `${ctx.client.localEmojis.diamond_gif} Thank you for supporting Jolyne!`
                        : `Thanks for considering supporting Jolyne! :pray:`,
                color: 0x70926c,
                fields: [
                    {
                        name: "Tier",
                        value: String(tier) + " | " + tiers[tier],
                        inline: true,
                    },
                    {
                        name: "Total Contributions",
                        value:
                            parsedData.lifetime_support_cents / 100 + // euros
                            "€",
                        inline: true,
                    },
                    {
                        name: "Currently Entitled Amount",
                        value:
                            parsedData.currently_entitled_amount_cents / 100 + // euros
                            "€",
                        inline: true,
                    },
                    {
                        name: "Last Charge Date",
                        value:
                            Functions.generateDiscordTimestamp(
                                new Date(parsedData.last_charge_date),
                                "FULL_DATE"
                            ) +
                            ` (${Functions.generateDiscordTimestamp(
                                new Date(parsedData.last_charge_date),
                                "FROM_NOW"
                            )})`,
                        inline: true,
                    },
                    {
                        name: "Last Charge Status",
                        value: parsedData.last_charge_status,
                        inline: true,
                    },
                ],
                thumbnail: {
                    url: "https://media.jolyne.moe/xY6CEw/direct",
                },
            };

            await ctx.makeMessage({
                embeds: [embed],
                ephemeral: !isPublic,
            });
        } else {
            await ctx.makeMessage({
                content: `Consider supporting Jolyne on Patreon to get rewards and help the bot grow!:pray: https://patreon.com/mizuki54`,
            });
        }
    },
};
export default slashCommand;
