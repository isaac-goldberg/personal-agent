import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const t = new DynamicStructuredTool({
    name: "get_menu",
    description: "This tool gets info on the menus at the dining hall for today.",
    schema: z.object({ }),
    func: async ({ }) => {
        const url = "https://apps.dining.ucsb.edu/menu/day?dc=portola";
        const res = await fetch(url);
        const body = await res.text();

        const doc = new JSDOM(body, {
            url,
        });

        const reader = new Readability(doc.window.document);
        const article = reader.parse();
        
        var text;
        if (article && article.textContent) {
            text = article.textContent.trim();
        }

        return text;
    }
})
export default t;
