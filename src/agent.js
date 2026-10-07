import { ChatOllama } from "@langchain/ollama";
import { ToolNode, createReactAgent } from "@langchain/langgraph/prebuilt"
import { MemorySaver, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { readdirSync } from "fs";
import path from "path";
import { createRequire } from "module";
import contexts from "./contexts.js";

import client from "./bot.js";
import prompt from "./prompt.js";

const require = createRequire(import.meta.url);

const tools = [];
for (const file of readdirSync(path.join(import.meta.dirname, "tools"))) {
    tools.push(require(path.join(import.meta.dirname, "tools", file)).default);
}
const toolNode = new ToolNode(tools);

const llm = new ChatOllama({
    model: "gpt-oss:20b",
    temperature: 0,
    keepAlive: 600,
}).bindTools(tools);

function shouldContinue(state) {
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage.tool_calls?.length) {
        return "tools";
    }
    return "__end__";
}

async function callModel(state) {
    const response = await llm.invoke(state.messages);

    return { messages: [response] };
}

const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addEdge("__start__", "agent")
    .addNode("tools", toolNode)
    .addEdge("tools", "agent")
    .addConditionalEdges("agent", shouldContinue);

const agent = workflow.compile();

client.on("messageCreate", async (message) => {
    var start = Date.now();

    if (message.author.bot) return;

    message.channel.sendTyping();

    var date = new Date();
    var dateTimeStr = `Today is ${date.toLocaleString("en-US", { weekday: "long" })}, ` +
        `${date.toLocaleString("en-US", { month: "long" })} ${date.getDate()}, ` +
        `and it is currently ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}.`;
    const agentFinalState = await agent.invoke(
        {
            messages: [
                ["system", prompt + "\n\n" + contexts[message.channel.name] + "\n\n" + dateTimeStr],
                ["human", message.content],
            ],
            toolUsed: false,
        }
    );
    var messages = agentFinalState.messages;
    var lastMessage = messages[messages.length - 1];

    console.log("response took " + ((Date.now() - start) / 1000).toFixed(2) + " seconds");

    message.reply({ content: lastMessage.content }).catch(console.error);
});

export default agent;